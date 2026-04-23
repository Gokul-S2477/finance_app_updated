"use server";

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function getDashboardStats(startDate?: string, endDate?: string) {
    try {
        let collectionRows, profitRows, trendRows, pendingRows;

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
            pendingRows = await sql`
                SELECT 
                    (SELECT COALESCE(SUM(loan_amount), 0) FROM loans WHERE status = 'active' AND start_date >= ${startDate} AND start_date <= ${endDate}) - 
                    (SELECT COALESCE(SUM(c.amount_collected), 0) FROM collections c JOIN loans l ON c.loan_id = l.id WHERE l.status = 'active' AND l.start_date >= ${startDate} AND l.start_date <= ${endDate}) as pending
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
            pendingRows = await sql`
                SELECT 
                    (SELECT COALESCE(SUM(loan_amount), 0) FROM loans WHERE status = 'active') - 
                    (SELECT COALESCE(SUM(amount_collected), 0) FROM collections c JOIN loans l ON c.loan_id = l.id WHERE l.status = 'active') as pending
            `;
        }

        const loanCountRows = await sql`SELECT COUNT(*) as count FROM loans WHERE status = 'active'`;
        const statusRows = await sql`SELECT status, COUNT(*) as count FROM loans GROUP BY status`;
        
        // 1. Ending Soon (Top 10)
        const endingSoon = await sql`
            SELECT 
                l.id,
                l.end_date,
                l.loan_amount,
                c.name,
                c.own_id,
                COALESCE((SELECT SUM(amount_collected) FROM collections WHERE loan_id = l.id), 0) as collected
            FROM loans l
            JOIN customers c ON l.customer_id = c.id
            WHERE l.status = 'active'
            ORDER BY l.end_date ASC
            LIMIT 10
        `;

        const weekdayRows = await sql`
            SELECT TO_CHAR(payment_date, 'Day') as weekday, SUM(amount_collected) as amount 
            FROM collections 
            GROUP BY weekday 
            ORDER BY MIN(EXTRACT(DOW FROM payment_date))
        `;
        const topBorrowers = await sql`
            SELECT c.name, SUM(l.loan_amount) as total 
            FROM loans l 
            JOIN customers c ON l.customer_id = c.id 
            WHERE l.status = 'active'
            GROUP BY c.name 
            ORDER BY total DESC 
            LIMIT 5
        `;

        return {
            activeLoans: loanCountRows[0].count || 0,
            totalCollected: parseFloat(collectionRows[0].total).toFixed(2),
            totalProfit: parseFloat(profitRows[0].profit).toFixed(2),
            totalPending: parseFloat(pendingRows[0].pending || "0").toFixed(2),
            trends: trendRows.map((r: any) => ({
                date: r.date,
                amount: parseFloat(r.amount)
            })),
            statusDistribution: statusRows.map((r: any) => ({
                name: r.status.charAt(0).toUpperCase() + r.status.slice(1),
                value: parseInt(r.count)
            })),
            weekdayDistribution: weekdayRows.map((r: any) => ({
                day: r.weekday.trim(),
                amount: parseFloat(r.amount)
            })),
            topBorrowers: topBorrowers.map((r: any) => ({
                name: r.name,
                total: parseFloat(r.total)
            })),
            endingSoon: endingSoon.map((r: any) => ({
                id: r.id,
                name: r.name,
                ownId: r.own_id,
                endDate: r.end_date,
                collected: parseFloat(r.collected),
                pending: parseFloat(r.loan_amount) - parseFloat(r.collected)
            }))
        };
    } catch (e) {
        console.error("Dashboard Stats Error:", e);
        return { 
            activeLoans: 0, 
            totalCollected: "0.00", 
            totalProfit: "0.00", 
            totalPending: "0.00",
            trends: [],
            statusDistribution: [],
            weekdayDistribution: [],
            topBorrowers: [],
            endingSoon: []
        };
    }
}
