import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    // 1. Customers Table
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        own_id TEXT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        id_proof TEXT NOT NULL,
        id_number TEXT NOT NULL,
        dob DATE NOT NULL,
        mobile_no TEXT NOT NULL,
        status BOOLEAN DEFAULT TRUE,
        is_deleted BOOLEAN DEFAULT FALSE,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Add columns if they don't exist (in case of re-run)
    try { await sql`ALTER TABLE customers ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;`; } catch (e) { }
    try { await sql`ALTER TABLE customers ADD COLUMN deleted_at TIMESTAMP;`; } catch (e) { }

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

    return NextResponse.json({ ok: true, message: "Database initialized/updated!" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
