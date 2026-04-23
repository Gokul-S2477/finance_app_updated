"use server";

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function getDashboardStats(startDate?: string, endDate?: string) {
    try {
        let collectionRows, profitRows, trendRows;

        if (startDate && endDate) {
            collectionRows = await sql`SELECT COALESCE(SUM(amount_collected), 0) as total FROM collections WHERE payment_date >= ${startDate} AND payment_date <= ${endDate}`;
            profitRows = await sql`SELECT COALESCE(SUM(loan_amount - given_amount), 0) as profit FROM loans WHERE start_date >= ${startDate} AND start_date <= ${endDate}`;
            trendRows = await sql`
                SELECT payment_date as date, SUM(amount_collected) as amount 
                FROM collections 
                WHERE payment_date >= ${startDate} AND payment_date <= ${endDate}
                GROUP BY payment_date 
                ORDER BY payment_date ASC
            `;
        } else {
            collectionRows = await sql`SELECT COALESCE(SUM(amount_collected), 0) as total FROM collections`;
            profitRows = await sql`SELECT COALESCE(SUM(loan_amount - given_amount), 0) as profit FROM loans`;
            trendRows = await sql`
                SELECT payment_date as date, SUM(amount_collected) as amount 
                FROM collections 
                WHERE payment_date >= (CURRENT_DATE - INTERVAL '7 days')
                GROUP BY payment_date 
                ORDER BY payment_date ASC
            `;
        }

        const loanRows = await sql`SELECT COUNT(*) as count FROM loans WHERE status = 'active'`;

        return {
            activeLoans: loanRows[0].count || 0,
            totalCollected: parseFloat(collectionRows[0].total).toFixed(2),
            totalProfit: parseFloat(profitRows[0].profit).toFixed(2),
            trends: trendRows.map((r: any) => ({
                date: r.date,
                amount: parseFloat(r.amount)
            }))
        };
    } catch (e) {
        console.error("Dashboard Stats Error:", e);
        return { activeLoans: 0, totalCollected: "0.00", totalProfit: "0.00", trends: [] };
    }
}
