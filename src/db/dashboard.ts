"use server";

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function getDashboardStats(startDate?: string, endDate?: string) {
    let collectionQuery = sql`SELECT COALESCE(SUM(amount_collected), 0) as total FROM collections`;
    let profitQuery = sql`SELECT COALESCE(SUM(loan_amount - given_amount), 0) as profit FROM loans`;

    if (startDate && endDate) {
        collectionQuery = sql`SELECT COALESCE(SUM(amount_collected), 0) as total FROM collections WHERE payment_date >= ${startDate} AND payment_date <= ${endDate}`;
        profitQuery = sql`SELECT COALESCE(SUM(loan_amount - given_amount), 0) as profit FROM loans WHERE start_date >= ${startDate} AND start_date <= ${endDate}`;
    }

    const loanRows = await sql`SELECT COUNT(*) as count FROM loans WHERE status = 'active'`;
    const collectionRows = await collectionQuery;
    const profitRows = await profitQuery;

    // Daily trends for chart (last 7 days or filtered range)
    const trendRows = await sql`
        SELECT payment_date as date, SUM(amount_collected) as amount 
        FROM collections 
        ${startDate && endDate ? sql`WHERE payment_date >= ${startDate} AND payment_date <= ${endDate}` : sql`WHERE payment_date >= (CURRENT_DATE - INTERVAL '7 days')`}
        GROUP BY payment_date 
        ORDER BY payment_date ASC
    `;

    return {
        activeLoans: loanRows[0].count || 0,
        totalCollected: parseFloat(collectionRows[0].total).toFixed(2),
        totalProfit: parseFloat(profitRows[0].profit).toFixed(2),
        trends: trendRows.map((r: any) => ({
            date: r.date,
            amount: parseFloat(r.amount)
        }))
    };
}
