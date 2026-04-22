import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    // 1. Customers Table
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        own_id TEXT NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        id_proof TEXT,
        id_number TEXT,
        dob DATE,
        mobile_no TEXT NOT NULL,
        mobile_alt TEXT,
        status BOOLEAN DEFAULT TRUE,
        is_deleted BOOLEAN DEFAULT FALSE,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // 2. Loans Table
    await sql`
      CREATE TABLE IF NOT EXISTS loans (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) NOT NULL,
        loan_amount DECIMAL(10, 2) NOT NULL,
        given_amount DECIMAL(10, 2) NOT NULL,
        interest_rate DECIMAL(5, 2) DEFAULT 12.00,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // 3. Collections Table
    await sql`
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        loan_id INTEGER REFERENCES loans(id) NOT NULL,
        payment_date DATE NOT NULL,
        amount_collected DECIMAL(10, 2) NOT NULL,
        status TEXT DEFAULT 'paid',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Safe column migrations — add missing columns if they don't exist
    try { await sql`ALTER TABLE loans ADD COLUMN IF NOT EXISTS closed_date TIMESTAMP`; } catch (_) {}
    try { await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE`; } catch (_) {}
    try { await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`; } catch (_) {}
    try { await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS mobile_alt TEXT`; } catch (_) {}

    // ADD UNIQUE CONSTRAINT for upserts (loan_id + payment_date)
    try {
      // Check if duplicate data exists first to avoid hard crash on ALTER TABLE
      const duplicates = await sql`
        SELECT loan_id, payment_date, COUNT(*) 
        FROM collections 
        GROUP BY loan_id, payment_date 
        HAVING COUNT(*) > 1
      `;
      
      if (duplicates.length === 0) {
        await sql`ALTER TABLE collections ADD CONSTRAINT unique_loan_date UNIQUE (loan_id, payment_date);`;
      }
    } catch (_) {
      // Constraint likely already exists or table has duplicates we can't fix automatically
    }

    return NextResponse.json({ ok: true, message: "Database initialized and all columns applied!" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
