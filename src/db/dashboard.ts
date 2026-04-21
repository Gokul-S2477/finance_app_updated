"use server";

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function getDashboardStats() {
    const loanRows = await sql`SELECT COUNT(*) as count FROM loans WHERE status = 'active'`;
    const collectionRows = await sql`SELECT COALESCE(SUM(amount_collected), 0) as total FROM collections`;
    const profitRows = await sql`SELECT COALESCE(SUM(loan_amount - given_amount), 0) as profit FROM loans`;

    return {
        activeLoans: loanRows[0].count || 0,
        totalCollected: parseFloat(collectionRows[0].total).toFixed(2),
        totalProfit: parseFloat(profitRows[0].profit).toFixed(2),
    };
}
