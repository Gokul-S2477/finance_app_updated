"use client";

import { useState, useEffect } from "react";
import { getDashboardStats } from "@/db/dashboard";
import { TrendingUp, Users, Wallet } from "lucide-react";

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => { getDashboardStats().then(setStats); }, []);

    const kpis = stats ? [
        { label: "Active Loans", value: stats.activeLoans, sub: "Currently running", icon: Users, color: "var(--primary)" },
        { label: "Total Collected", value: `₹${parseFloat(stats.totalCollected).toLocaleString()}`, sub: "Lifetime collections", icon: Wallet, color: "var(--success)" },
        { label: "Total Profit", value: `₹${parseFloat(stats.totalProfit).toLocaleString()}`, sub: "Interest earned", icon: TrendingUp, color: "var(--warning)" },
    ] : [];

    return (
        <div className="animate-fade-in">
            <h1 style={{ marginBottom: "1.5rem" }}>Financial Overview</h1>

            {!stats ? (
                <p style={{ opacity: 0.5 }}>Loading stats…</p>
            ) : (
                <>
                    {/* KPI Grid - Responsive */}
                    <div className="responsive-grid cols-3" style={{ marginBottom: "2rem" }}>
                        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
                            <div key={label} className="card" style={{ borderLeft: `4px solid ${color}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.25rem" }}>{label}</p>
                                        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</h2>
                                        <p style={{ fontSize: "0.7rem", opacity: 0.45, marginTop: "2px" }}>{sub}</p>
                                    </div>
                                    <div style={{ background: `${color}15`, borderRadius: "10px", padding: "0.5rem", flexShrink: 0 }}>
                                        <Icon size={20} color={color} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick actions - Responsive */}
                    <div className="responsive-grid cols-2">
                        <div className="card" style={{ cursor: "pointer", borderLeft: "4px solid var(--primary)" }} onClick={() => window.location.href = "/dashboard/customers"}>
                            <h3 style={{ marginBottom: "0.4rem" }}>👥 Customers</h3>
                            <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>Manage loan profiles</p>
                        </div>
                        <div className="card" style={{ cursor: "pointer", borderLeft: "4px solid var(--success)" }} onClick={() => window.location.href = "/dashboard/collection"}>
                            <h3 style={{ marginBottom: "0.4rem" }}>📅 Collection</h3>
                            <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>Quick daily entry</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
