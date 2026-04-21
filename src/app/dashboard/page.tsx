"use client";

import { useState, useEffect } from "react";
import { getDashboardStats } from "@/db/dashboard";
import { TrendingUp, Users, Wallet } from "lucide-react";

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => { getDashboardStats().then(setStats); }, []);

    const kpis = stats ? [
        { label: "Active Loans", value: stats.activeLoans, sub: "Currently running", icon: Users, color: "var(--primary)", border: "var(--primary)" },
        { label: "Total Collected", value: `₹${parseFloat(stats.totalCollected).toLocaleString()}`, sub: "Lifetime collections", icon: Wallet, color: "var(--success)", border: "var(--success)" },
        { label: "Total Profit", value: `₹${parseFloat(stats.totalProfit).toLocaleString()}`, sub: "Interest earned", icon: TrendingUp, color: "var(--warning)", border: "var(--warning)" },
    ] : [];

    return (
        <div className="animate-fade-in">
            <h1 style={{ marginBottom: "1.75rem" }}>Financial Overview</h1>

            {!stats ? (
                <p style={{ opacity: 0.5 }}>Loading stats…</p>
            ) : (
                <>
                    {/* KPI Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                        {kpis.map(({ label, value, sub, icon: Icon, color, border }) => (
                            <div key={label} className="card" style={{ borderLeft: `4px solid ${border}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <p style={{ fontSize: "0.78rem", opacity: 0.55, marginBottom: "0.4rem" }}>{label}</p>
                                        <h2 style={{ fontSize: "1.75rem", fontWeight: 700 }}>{value}</h2>
                                        <p style={{ fontSize: "0.72rem", opacity: 0.45, marginTop: "4px" }}>{sub}</p>
                                    </div>
                                    <div style={{ background: `${color}22`, borderRadius: "10px", padding: "0.5rem" }}>
                                        <Icon size={22} color={color} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick actions */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className="card" style={{ borderLeft: "4px solid var(--primary)", cursor: "pointer" }} onClick={() => window.location.href = "/dashboard/customers"}>
                            <h3 style={{ marginBottom: "0.5rem" }}>👥 Customers</h3>
                            <p style={{ fontSize: "0.82rem", opacity: 0.5 }}>Manage customer records and loans</p>
                        </div>
                        <div className="card" style={{ borderLeft: "4px solid var(--success)", cursor: "pointer" }} onClick={() => window.location.href = "/dashboard/collection"}>
                            <h3 style={{ marginBottom: "0.5rem" }}>📅 Today's Collection</h3>
                            <p style={{ fontSize: "0.82rem", opacity: 0.5 }}>Record daily payments</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
