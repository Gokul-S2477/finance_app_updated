"use server";

import { neon } from "@neondatabase/serverless";
import { addDays } from "date-fns";

const sql = neon(process.env.DATABASE_URL!);

export async function getCustomers(search?: string) {
  if (search && search.trim() !== "") {
    return await sql`
      SELECT * FROM customers
      WHERE is_deleted = FALSE 
        AND (LOWER(name) LIKE ${"%" + search.toLowerCase() + "%"}
        OR LOWER(COALESCE(own_id, '')) LIKE ${"%" + search.toLowerCase() + "%"})
      ORDER BY created_at DESC
    `;
  }
  return await sql`SELECT * FROM customers WHERE is_deleted = FALSE ORDER BY created_at DESC`;
}

export async function getDeletedCustomers() {
  return await sql`SELECT * FROM customers WHERE is_deleted = TRUE ORDER BY deleted_at DESC`;
}

export async function createCustomer(data: any) {
  const { loanAmount = "10000", startDate: formStart, ownId, name, address, idProof, idNumber, dob, mobile } = data;

  // 1. Create Customer
  const rows = await sql`
    INSERT INTO customers (own_id, name, address, id_proof, id_number, dob, mobile_no)
    VALUES (${ownId || null}, ${name}, ${address}, ${idProof}, ${idNumber}, ${dob}, ${mobile})
    RETURNING *
  `;
  const customer = rows[0];

  // 2. Create Loan (100 days, 12% interest)
  const start = formStart ? new Date(formStart) : new Date();
  const end = addDays(start, 100);
  const amount = parseFloat(loanAmount);
  const givenAmount = amount * 0.88;

  await sql`
    INSERT INTO loans (customer_id, loan_amount, given_amount, interest_rate, start_date, end_date, status)
    VALUES (${customer.id}, ${amount}, ${givenAmount}, 12.00, ${start.toISOString().split("T")[0]}, ${end.toISOString().split("T")[0]}, 'active')
  `;

  return customer;
}

export async function updateCustomer(id: number, data: any) {
  const { ownId, name, address, idProof, idNumber, dob, mobile, loanAmount } = data;

  // 1. Update Customer Profile
  await sql`
    UPDATE customers 
    SET own_id = ${ownId || null}, 
        name = ${name}, 
        address = ${address}, 
        id_proof = ${idProof}, 
        id_number = ${idNumber}, 
        dob = ${dob}, 
        mobile_no = ${mobile}
    WHERE id = ${id}
  `;

  // 2. Update Loan if permitted (within 2 days of creation)
  if (loanAmount) {
    const loanRows = await sql`SELECT * FROM loans WHERE customer_id = ${id} AND status = 'active' ORDER BY created_at DESC LIMIT 1`;
    const activeLoan = loanRows[0];

    if (activeLoan) {
      const createdAt = new Date(activeLoan.created_at);
      const now = new Date();
      const diffDays = Math.ceil(Math.abs(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 2) {
        const amount = parseFloat(loanAmount);
        const givenAmount = amount * 0.88;
        await sql`
          UPDATE loans 
          SET loan_amount = ${amount}, 
              given_amount = ${givenAmount}
          WHERE id = ${activeLoan.id}
        `;
      }
    }
  }
}

export async function deleteCustomer(id: number) {
  return await sql`
    UPDATE customers 
    SET is_deleted = TRUE, 
        deleted_at = NOW() 
    WHERE id = ${id}
  `;
}

export async function restoreCustomer(id: number) {
  return await sql`
    UPDATE customers 
    SET is_deleted = FALSE, 
        deleted_at = NULL 
    WHERE id = ${id}
  `;
}

export async function getCustomerDetails(id: number) {
  const customerRows = await sql`SELECT * FROM customers WHERE id = ${id}`;
  const customer = customerRows[0];

  const loanRows = await sql`
    SELECT * FROM loans WHERE customer_id = ${id} ORDER BY created_at DESC LIMIT 1
  `;
  const activeLoan = loanRows[0] || null;

  let collections: any[] = [];
  if (activeLoan) {
    collections = await sql`
      SELECT * FROM collections WHERE loan_id = ${activeLoan.id} ORDER BY payment_date DESC
    `;
  }

  return { customer, activeLoan, collections };
}

export async function getCollectionStatus(dateStr: string, search?: string) {
  const activeLoans = await sql`
    SELECT l.*, c.id as cust_id, c.name, c.own_id
    FROM loans l
    JOIN customers c ON l.customer_id = c.id
    WHERE l.status = 'active' AND c.is_deleted = FALSE
  `;

  const dateCollections = await sql`
    SELECT * FROM collections WHERE payment_date = ${dateStr}
  `;

  const processedLoanIds = new Set(dateCollections.map((c: any) => c.loan_id));

  let result = activeLoans.map((loan: any) => ({
    loanId: loan.id,
    customerId: loan.customer_id,
    ownId: loan.own_id,
    name: loan.name,
    amountToCollect: (parseFloat(loan.loan_amount) / 100).toFixed(2),
    isProcessed: processedLoanIds.has(loan.id),
    collectedAmount: dateCollections.find((c: any) => c.loan_id === loan.id)?.amount_collected || "0",
  }));

  if (search && search.trim() !== "") {
    const s = search.toLowerCase();
    result = result.filter(
      (r: any) =>
        r.name.toLowerCase().includes(s) ||
        (r.ownId && r.ownId.toLowerCase().includes(s))
    );
  }

  return result.sort((a: any, b: any) => {
    if (a.isProcessed === b.isProcessed) return 0;
    return a.isProcessed ? 1 : -1;
  });
}

export async function recordCollection(loanId: number, dateStr: string, amount: string) {
  return await sql`
    INSERT INTO collections (loan_id, payment_date, amount_collected, status)
    VALUES (${loanId}, ${dateStr}, ${amount}, 'paid')
  `;
}

export async function closeLoan(loanId: number) {
  return await sql`UPDATE loans SET status = 'closed' WHERE id = ${loanId}`;
}

export async function createNewLoanForCustomer(customerId: number, loanAmount: string) {
  const start = new Date();
  const end = addDays(start, 100);
  const amount = parseFloat(loanAmount);
  const givenAmount = amount * 0.88;

  return await sql`
    INSERT INTO loans (customer_id, loan_amount, given_amount, interest_rate, start_date, end_date, status)
    VALUES (${customerId}, ${amount}, ${givenAmount}, 12.00, ${start.toISOString().split("T")[0]}, ${end.toISOString().split("T")[0]}, 'active')
  `;
}
