"use server";

import { neon } from "@neondatabase/serverless";
import { addDays, subHours, isAfter } from "date-fns";

const sql = neon(process.env.DATABASE_URL || "");

// ... (getCustomers, getDeletedCustomers, createCustomer, updateCustomer, deleteCustomer, restoreCustomer, getCustomerDetails, getCollectionStatus, recordCollection, closeLoan, createNewLoanForCustomer)

export async function getCustomers(search?: string) {
  try {
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
  } catch (e) { console.error("getCustomers error:", e); return []; }
}

export async function getDeletedCustomers() {
  try { return await sql`SELECT * FROM customers WHERE is_deleted = TRUE ORDER BY deleted_at DESC`; }
  catch (e) { console.error("getDeletedCustomers error:", e); return []; }
}

export async function createCustomer(data: any) {
  const { loanAmount = "10000", startDate: formStart, ownId, name, address, idProof, idNumber, dob, mobile, mobileAlt } = data;
  if (!ownId || ownId.trim() === "") throw new Error("DL Number is required.");
  try {
    if (ownId) {
        const existing = await sql`SELECT * FROM customers WHERE own_id = ${ownId}`;
        if (existing.length > 0) {
          if (existing[0].is_deleted) {
            const activeLoans = await sql`SELECT * FROM loans WHERE customer_id = ${existing[0].id} AND status = 'active'`;
            if (activeLoans.length > 0) {
              throw new Error("This customer already has an active loan. Please close it first before creating a new one.");
            }
            await restoreCustomer(existing[0].id);
            await updateCustomer(existing[0].id, data);
            const start = formStart ? new Date(formStart) : addDays(new Date(), 1);
            const end = addDays(start, 100);
            const amount = parseFloat(loanAmount);
            const givenAmount = amount * 0.88;
            await sql`INSERT INTO loans (customer_id, loan_amount, given_amount, interest_rate, start_date, end_date, status) VALUES (${existing[0].id}, ${amount}, ${givenAmount}, 12.00, ${start.toISOString().split("T")[0]}, ${end.toISOString().split("T")[0]}, 'active')`;
            return existing[0];
          } else throw new Error("Customer with this DL Number already exists.");
        }
      }
      const rows = await sql`INSERT INTO customers (own_id, name, address, id_proof, id_number, dob, mobile_no, mobile_alt) VALUES (${ownId}, ${name}, ${address}, ${idProof || null}, ${idNumber || null}, ${dob || null}, ${mobile}, ${mobileAlt || null}) RETURNING *`;
      const customer = rows[0];
      const start = formStart ? new Date(formStart) : addDays(new Date(), 1);
      const end = addDays(start, 100);
      const amount = parseFloat(loanAmount);
      const givenAmount = amount * 0.88;
      await sql`INSERT INTO loans (customer_id, loan_amount, given_amount, interest_rate, start_date, end_date, status) VALUES (${customer.id}, ${amount}, ${givenAmount}, 12.00, ${start.toISOString().split("T")[0]}, ${end.toISOString().split("T")[0]}, 'active')`;
      return customer;
  } catch (e: any) { throw new Error(e.message || "Failed to create customer"); }
}

export async function updateCustomer(id: number, data: any) {
  const { ownId, name, address, idProof, idNumber, dob, mobile, mobileAlt, loanAmount, startDate } = data;
  try {
    await sql`UPDATE customers SET own_id = ${ownId || null}, name = ${name}, address = ${address}, id_proof = ${idProof}, id_number = ${idNumber}, dob = ${dob}, mobile_no = ${mobile}, mobile_alt = ${mobileAlt || null} WHERE id = ${id}`;
    if (loanAmount || startDate) {
        const loanRows = await sql`SELECT * FROM loans WHERE customer_id = ${id} AND status = 'active' AND is_deleted = FALSE ORDER BY created_at DESC LIMIT 1`;
        const activeLoan = loanRows[0];
        if (activeLoan) {
          if (startDate) {
            const start = new Date(startDate);
            const end = addDays(start, 100);
            await sql`UPDATE loans SET start_date = ${start.toISOString().split("T")[0]}, end_date = ${end.toISOString().split("T")[0]} WHERE id = ${activeLoan.id}`;
          }
          if (loanAmount) {
            const amount = parseFloat(loanAmount);
            const givenAmount = amount * 0.88;
            await sql`UPDATE loans SET loan_amount = ${amount}, given_amount = ${givenAmount} WHERE id = ${activeLoan.id}`;
          }
        }
      }
  } catch (e: any) { console.error("updateCustomer error:", e); }
}

export async function deleteCustomer(id: number) {
  const activeLoans = await sql`SELECT * FROM loans WHERE customer_id = ${id} AND status = 'active'`;
  if (activeLoans.length > 0) {
      throw new Error("Cannot delete customer with an active loan. Please close the loan first.");
  }
  return await sql`UPDATE customers SET is_deleted = TRUE, deleted_at = NOW() WHERE id = ${id}`; 
}
export async function restoreCustomer(id: number) { return await sql`UPDATE customers SET is_deleted = FALSE, deleted_at = NULL WHERE id = ${id}`; }

export async function getCustomerDetails(id: number) {
  try {
    const customerRows = await sql`SELECT * FROM customers WHERE id = ${id}`;
    const customer = customerRows[0];
    const allLoans = await sql`SELECT * FROM loans WHERE customer_id = ${id} AND is_deleted = FALSE ORDER BY created_at DESC`;
    const activeLoan = allLoans.find((l: any) => l.status === 'active') || null;
    let allCollections: any[] = [];
    if (allLoans.length > 0) {
        const loanIds = allLoans.map((l: any) => l.id);
        allCollections = await sql`SELECT * FROM collections WHERE loan_id = ANY(${loanIds}::int[]) ORDER BY payment_date DESC`;
    }
    const collections = allCollections.filter((c: any) => activeLoan && c.loan_id === activeLoan.id);
    return { customer, activeLoan, collections, allLoans, allCollections };
  } catch (e) { console.error("getCustomerDetails error:", e); return { customer: null, activeLoan: null, collections: [], allLoans: [], allCollections: [] }; }
}

export async function getCollectionStatus(dateStr: string, search?: string) {
  try {
    const activeLoans = await sql`SELECT l.*, c.id as cust_id, c.name, c.own_id FROM loans l JOIN customers c ON l.customer_id = c.id WHERE l.status = 'active' AND l.is_deleted = FALSE AND c.is_deleted = FALSE`;
    const dateCollections = await sql`SELECT * FROM collections WHERE payment_date = ${dateStr}`;
    const processedLoanIds = new Set(dateCollections.map((c: any) => c.loan_id));
    const totalCollectionsRows = await sql`SELECT loan_id, SUM(amount_collected) as total FROM collections WHERE loan_id IN (SELECT id FROM loans WHERE status = 'active' AND is_deleted = FALSE) GROUP BY loan_id`;
    const totalCollectedMap = new Map(totalCollectionsRows.map((r: any) => [r.loan_id, parseFloat(r.total)]));
    let result = activeLoans.filter((loan: any) => new Date(loan.start_date) <= new Date(dateStr)).map((loan: any) => ({
        loanId: loan.id, customerId: loan.customer_id, ownId: loan.own_id, name: loan.name, loanAmount: loan.loan_amount,
        amountToCollect: (parseFloat(loan.loan_amount) / 100).toFixed(2), isProcessed: processedLoanIds.has(loan.id),
        collectedAmount: dateCollections.find((c: any) => c.loan_id === loan.id)?.amount_collected || "0",
        totalCollected: totalCollectedMap.get(loan.id) || 0,
      }));
    if (search && search.trim() !== "") {
        const s = search.toLowerCase();
        result = result.filter(r => r.name.toLowerCase().includes(s) || (r.ownId && r.ownId.toLowerCase().includes(s)));
    }
    return result.sort((a, b) => (a.isProcessed === b.isProcessed ? 0 : a.isProcessed ? 1 : -1));
  } catch (e) { console.error("getCollectionStatus error:", e); return []; }
}

export async function recordCollection(loanId: number, dateStr: string, amount: string) {
  return await sql`INSERT INTO collections (loan_id, payment_date, amount_collected, status) VALUES (${loanId}, ${dateStr}, ${amount}, 'paid') ON CONFLICT (loan_id, payment_date) DO UPDATE SET amount_collected = EXCLUDED.amount_collected, created_at = NOW()`;
}

export async function closeLoan(loanId: number) { return await sql`UPDATE loans SET status = 'closed', closed_date = NOW() WHERE id = ${loanId}`; }

export async function createNewLoanForCustomer(customerId: number, loanAmount: string) {
  const start = addDays(new Date(), 1);
  const end = addDays(start, 100);
  const amount = parseFloat(loanAmount);
  const givenAmount = amount * 0.88;
  return await sql`INSERT INTO loans (customer_id, loan_amount, given_amount, interest_rate, start_date, end_date, status) VALUES (${customerId}, ${amount}, ${givenAmount}, 12.00, ${start.toISOString().split("T")[0]}, ${end.toISOString().split("T")[0]}, 'active')`;
}

// DELETED LOANS
export async function getDeletedLoans() {
  try { return await sql`SELECT l.*, c.name, c.own_id FROM loans l JOIN customers c ON l.customer_id = c.id WHERE l.is_deleted = TRUE ORDER BY l.deleted_at DESC`; }
  catch (e) { console.error("getDeletedLoans error:", e); return []; }
}

export async function deleteLoan(loanId: number, pin: string) {
  const validPin = process.env.ADMIN_DELETE_PIN || "1234";
  if (pin !== validPin) throw new Error("Invalid Admin PIN");
  return await sql`UPDATE loans SET is_deleted = TRUE, deleted_at = NOW() WHERE id = ${loanId}`;
}

export async function restoreLoan(loanId: number) {
  const loan = await sql`SELECT * FROM loans WHERE id = ${loanId}`;
  if (!loan[0]) throw new Error("Loan not found");
  
  const customerId = loan[0].customer_id;
  const activeLoans = await sql`SELECT * FROM loans WHERE customer_id = ${customerId} AND status = 'active' AND is_deleted = FALSE`;
  
  if (activeLoans.length > 0) {
    throw new Error("Cannot restore: This customer already has an active loan.");
  }
  
  return await sql`UPDATE loans SET is_deleted = FALSE, deleted_at = NULL WHERE id = ${loanId}`;
}

// LEDGER
export async function getLedgerEntries() {
  try { return await sql`SELECT * FROM ledger ORDER BY date DESC, created_at DESC LIMIT 50`; }
  catch (e) { console.error("getLedgerEntries error:", e); return []; }
}

export async function addLedgerEntry(data: { amount: string, type: string, description: string, date: string }) {
  return await sql`INSERT INTO ledger (amount, type, description, date) VALUES (${data.amount}, ${data.type}, ${data.description}, ${data.date})`;
}

export async function updateLedgerEntry(id: number, data: { amount: string, type: string, description: string, date: string }) {
    const entry = await sql`SELECT createdAt FROM ledger WHERE id = ${id}`;
    if (!entry[0]) throw new Error("Entry not found");
    const limitDate = addDays(new Date(entry[0].createdAt), 4);
    if (new Date() > limitDate) throw new Error("Editing expired (4-day limit reached)");

    return await sql`
        UPDATE ledger 
        SET amount = ${data.amount}, type = ${data.type}, description = ${data.description}, date = ${data.date}
        WHERE id = ${id}
    `;
}

export async function deleteLedgerEntry(id: number) {
    const entry = await sql`SELECT createdAt FROM ledger WHERE id = ${id}`;
    if (!entry[0]) throw new Error("Entry not found");
    const limitDate = addDays(new Date(entry[0].createdAt), 4);
    if (new Date() > limitDate) throw new Error("Deletion expired (4-day limit reached)");

    return await sql`DELETE FROM ledger WHERE id = ${id}`;
}

export async function getFinancialSummary() {
  try {
    const collections = await sql`SELECT COALESCE(SUM(amount_collected), 0) as total FROM collections`;
    let ledgerEntries: any[] = [];
    try { ledgerEntries = await sql`SELECT type, SUM(amount) as total FROM ledger GROUP BY type`; }
    catch (ee: any) { console.error("Ledger error:", ee.message); }

    const totalCollected = parseFloat(collections[0].total || "0");
    const ledgerMap = new Map(ledgerEntries.map((r: any) => [r.type, parseFloat(r.total || "0")]));

    const totalRotation = ledgerMap.get('rotation') || 0;
    const totalCapital = ledgerMap.get('capital') || 0;
    const totalExpenses = (ledgerMap.get('expense') || 0) + (ledgerMap.get('personal') || 0);

    const expectedCash = (totalCollected + totalRotation + totalCapital) - totalExpenses;

    return { totalCollected, totalRotated: totalRotation, totalExpenses, totalCapital, expectedCash };
  } catch (e) { console.error("getFinancialSummary error:", e); return { totalCollected: 0, totalRotated: 0, totalExpenses: 0, totalCapital: 0, expectedCash: 0 }; }
}
