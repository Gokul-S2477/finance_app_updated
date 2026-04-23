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
        OR LOWER(COALESCE(own_id, '')) LIKE ${"%" + search.toLowerCase() + "%"}
        OR mobile_no LIKE ${"%" + search + "%"})
      ORDER BY created_at DESC
    `;
  }
  return await sql`SELECT * FROM customers WHERE is_deleted = FALSE ORDER BY created_at DESC`;
}

export async function getDeletedCustomers() {
  return await sql`SELECT * FROM customers WHERE is_deleted = TRUE ORDER BY deleted_at DESC`;
}

export async function createCustomer(data: any) {
  const { loanAmount = "10000", startDate: formStart, ownId, name, address, idProof, idNumber, dob, mobile, mobileAlt } = data;

  if (!ownId || ownId.trim() === "") {
    throw new Error("DL Number is required.");
  }

  if (ownId) {
    const existing = await sql`SELECT * FROM customers WHERE own_id = ${ownId}`;
    if (existing.length > 0) {
      if (existing[0].is_deleted) {
        await restoreCustomer(existing[0].id);
        await updateCustomer(existing[0].id, data);
        const start = formStart ? new Date(formStart) : addDays(new Date(), 1);
        const end = addDays(start, 100);
        const amount = parseFloat(loanAmount);
        const givenAmount = amount * 0.88;
        await sql`
          INSERT INTO loans (customer_id, loan_amount, given_amount, interest_rate, start_date, end_date, status)
          VALUES (${existing[0].id}, ${amount}, ${givenAmount}, 12.00, ${start.toISOString().split("T")[0]}, ${end.toISOString().split("T")[0]}, 'active')
        `;
        return existing[0];
      } else {
        throw new Error("Customer with this DL Number already exists.");
      }
    }
  }

  // 1. Create Customer
  const rows = await sql`
    INSERT INTO customers (own_id, name, address, id_proof, id_number, dob, mobile_no, mobile_alt)
    VALUES (
      ${ownId},
      ${name},
      ${address},
      ${idProof || null},
      ${idNumber || null},
      ${dob || null},
      ${mobile},
      ${mobileAlt || null}
    )
    RETURNING *
  `;
  const customer = rows[0];

  // 2. Create Loan (100 days, 12% interest)
  const start = formStart ? new Date(formStart) : addDays(new Date(), 1);
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
  const { ownId, name, address, idProof, idNumber, dob, mobile, mobileAlt, loanAmount, startDate } = data;

  // 1. Update Customer Profile
  await sql`
    UPDATE customers 
    SET own_id = ${ownId || null}, 
        name = ${name}, 
        address = ${address}, 
        id_proof = ${idProof}, 
        id_number = ${idNumber}, 
        dob = ${dob}, 
        mobile_no = ${mobile},
        mobile_alt = ${mobileAlt || null}
    WHERE id = ${id}
  `;

  // 2. Update Loan if permitted (within 2 days of creation or just updating start date)
  if (loanAmount || startDate) {
    const loanRows = await sql`SELECT * FROM loans WHERE customer_id = ${id} AND status = 'active' ORDER BY created_at DESC LIMIT 1`;
    const activeLoan = loanRows[0];

    if (activeLoan) {
      const createdAt = new Date(activeLoan.created_at);
      const now = new Date();
      const diffDays = Math.ceil(Math.abs(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // 2a. Update Start/End Dates (Always allowed for active loan)
      if (startDate) {
        const start = new Date(startDate);
        const end = addDays(start, 100);
        await sql`
          UPDATE loans 
          SET start_date = ${start.toISOString().split("T")[0]}, 
              end_date = ${end.toISOString().split("T")[0]}
          WHERE id = ${activeLoan.id}
        `;
      }

      // 2b. Update Amount (Only within 2 days)
      if (loanAmount && diffDays <= 2) {
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

  const allLoans = await sql`
    SELECT * FROM loans WHERE customer_id = ${id} ORDER BY created_at DESC
  `;
  const activeLoan = allLoans.find((l: any) => l.status === 'active') || null;

  let allCollections: any[] = [];
  if (allLoans.length > 0) {
    const loanIds = allLoans.map((l: any) => l.id);
    allCollections = await sql`
      SELECT * FROM collections 
      WHERE loan_id = ANY(${loanIds}::int[])
      ORDER BY payment_date DESC
    `;
  }

  // Fallback for previous code
  const collections = allCollections.filter((c: any) => activeLoan && c.loan_id === activeLoan.id);

  return { customer, activeLoan, collections, allLoans, allCollections };
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

  // Get total collected for each active loan
  const totalCollectionsRows = await sql`
    SELECT loan_id, SUM(amount_collected) as total
    FROM collections
    WHERE loan_id IN (
      SELECT id FROM loans WHERE status = 'active'
    )
    GROUP BY loan_id
  `;
  const totalCollectedMap = new Map(totalCollectionsRows.map((r: any) => [r.loan_id, parseFloat(r.total)]));

  let result = activeLoans
    .filter((loan: any) => {
        const start = new Date(loan.start_date);
        const current = new Date(dateStr);
        return start <= current;
    })
    .map((loan: any) => ({
    loanId: loan.id,
    customerId: loan.customer_id,
    ownId: loan.own_id,
    name: loan.name,
    loanAmount: loan.loan_amount,
    amountToCollect: (parseFloat(loan.loan_amount) / 100).toFixed(2),
    isProcessed: processedLoanIds.has(loan.id),
    collectedAmount: dateCollections.find((c: any) => c.loan_id === loan.id)?.amount_collected || "0",
    totalCollected: totalCollectedMap.get(loan.id) || 0,
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
    ON CONFLICT (loan_id, payment_date) 
    DO UPDATE SET amount_collected = EXCLUDED.amount_collected, created_at = NOW()
  `;
}


export async function closeLoan(loanId: number) {
  // Try with closed_date first; if column missing, fall back to just status update
  try {
    return await sql`UPDATE loans SET status = 'closed', closed_date = NOW() WHERE id = ${loanId}`;
  } catch {
    return await sql`UPDATE loans SET status = 'closed' WHERE id = ${loanId}`;
  }
}

export async function createNewLoanForCustomer(customerId: number, loanAmount: string) {
  const start = addDays(new Date(), 1);
  const end = addDays(start, 100);
  const amount = parseFloat(loanAmount);
  const givenAmount = amount * 0.88;

  return await sql`
    INSERT INTO loans (customer_id, loan_amount, given_amount, interest_rate, start_date, end_date, status)
    VALUES (${customerId}, ${amount}, ${givenAmount}, 12.00, ${start.toISOString().split("T")[0]}, ${end.toISOString().split("T")[0]}, 'active')
  `;
}

// LEDGER ACTIONS
export async function getLedgerEntries() {
  return await sql`SELECT * FROM ledger ORDER BY date DESC, created_at DESC LIMIT 50`;
}

export async function addLedgerEntry(data: { amount: string, type: string, description: string, date: string }) {
  return await sql`
    INSERT INTO ledger (amount, type, description, date)
    VALUES (${data.amount}, ${data.type}, ${data.description}, ${data.date})
  `;
}

export async function getFinancialSummary() {
  const collections = await sql`SELECT COALESCE(SUM(amount_collected), 0) as total FROM collections`;
  const ledgerEntries = await sql`SELECT type, SUM(amount) as total FROM ledger GROUP BY type`;

  const totalCollected = parseFloat(collections[0].total);
  const ledgerMap = new Map(ledgerEntries.map((r: any) => [r.type, parseFloat(r.total)]));

  const totalRotated = ledgerMap.get('rotation') || 0;
  const totalExpenses = (ledgerMap.get('expense') || 0) + (ledgerMap.get('personal') || 0);
  const totalCapital = ledgerMap.get('capital') || 0;
  const initialBalance = ledgerMap.get('initial') || 0;

  const expectedCash = (initialBalance + totalCollected + totalCapital) - (totalRotated + totalExpenses);

  return {
    totalCollected,
    totalRotated,
    totalExpenses,
    totalCapital,
    initialBalance,
    expectedCash
  };
}
