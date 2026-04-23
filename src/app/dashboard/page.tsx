"use client";

import { useState, useEffect } from "react";
import { getDashboardStats } from "@/db/dashboard";
import { TrendingUp, Users, Wallet, Calendar, Filter, ArrowRight, IndianRupee, PieChart as PieIcon } from "lucide-react";
import { format, subDays } from "date-fns";

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Filter state
    const [filter, setFilter] = useState({
        startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd")
    });

    useEffect(() => { 
        setLoading(true);
        getDashboardStats(filter.startDate, filter.endDate).then(res => {
            setStats(res);
            setLoading(false);
        }); 
    }, [filter.startDate, filter.endDate]);

    const kpis = stats ? [
        { label: "Active Loans", value: stats.activeLoans, sub: "Currently running", icon: Users, color: "#6366f1" },
        { label: "Range Collection", value: `₹${parseFloat(stats.totalCollected).toLocaleString()}`, sub: "For selected period", icon: Wallet, color: "#10b981" },
        { label: "Range Profit", value: `₹${parseFloat(stats.totalProfit).toLocaleString()}`, sub: "Interest for period", icon: TrendingUp, color: "#f59e0b" },
    ] : [];

    return (
        <div className="animate-fade-in" style={{ paddingBottom: "2rem" }}>
            {/* Header with Filters */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ marginBottom: "0.25rem" }}>Executive Dashboard</h1>
                    <p style={{ fontSize: "0.85rem", opacity: 0.5 }}>Real-time financial performance tracking</p>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "16px", padding: "0.75rem 1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Calendar size={14} style={{ opacity: 0.5 }} />
                        <input type="date" className="date-input" value={filter.startDate} onChange={e => setFilter({...filter, startDate: e.target.value})} />
                    </div>
                    <ArrowRight size={14} style={{ opacity: 0.3 }} />
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <input type="date" className="date-input" value={filter.endDate} onChange={e => setFilter({...filter, endDate: e.target.value})} />
                    </div>
                    <div style={{ width: "1px", height: "20px", background: "var(--border)", margin: "0 0.25rem" }} />
                    <Filter size={16} style={{ opacity: 0.5 }} />
                </div>
            </div>

            {loading ? (
                <div style={{ padding: "4rem", textAlign: "center", opacity: 0.5 }}>Loading performance data...</div>
            ) : (
                <>
                    {/* KPI Grid */}
                    <div className="responsive-grid cols-3" style={{ marginBottom: "2rem" }}>
                        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
                            <div key={label} className="card dashboard-card" style={{ borderLeft: `6px solid ${color}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <p style={{ fontSize: "0.8rem", fontWeight: 600, opacity: 0.5, marginBottom: "0.5rem" }}>{label}</p>
                                        <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>{value}</h2>
                                        <p style={{ fontSize: "0.7rem", opacity: 0.4, marginTop: "0.25rem" }}>{sub}</p>
                                    </div>
                                    <div style={{ background: `${color}15`, borderRadius: "12px", padding: "0.75rem" }}>
                                        <Icon size={24} color={color} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="responsive-grid cols-2" style={{ gap: "2rem" }}>
                        {/* Collection Trend Chart (Custom CSS/SVG) */}
                        <div className="card" style={{ padding: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                                <h3 style={{ fontSize: "1rem", margin: 0 }}>Collection Trend</h3>
                                <span style={{ fontSize: "0.7rem", opacity: 0.5 }}>Last {stats.trends.length} entries</span>
                            </div>
                            
                            <div style={{ height: "200px", display: "flex", alignItems: "flex-end", gap: "0.5rem", padding: "0 0.5rem" }}>
                                {stats.trends.length === 0 ? (
                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.3, fontSize: "0.8rem" }}>No data for this range</div>
                                ) : (
                                    stats.trends.map((t: any, i: number) => {
                                        const max = Math.max(...stats.trends.map((x: any) => x.amount), 1);
                                        const height = (t.amount / max) * 100;
                                        return (
                                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                                                <div className="bar-wrapper" style={{ width: "100%", height: "150px", display: "flex", alignItems: "flex-end", position: "relative" }}>
                                                    <div className="bar" style={{ 
                                                        width: "100%", 
                                                        height: `${height}%`, 
                                                        background: "var(--primary)", 
                                                        borderRadius: "4px 4px 0 0",
                                                        transition: "height 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                                                        position: "relative"
                                                    }}>
                                                        <div className="tooltip">₹{t.amount.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: "0.6rem", opacity: 0.4, transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>
                                                    {format(new Date(t.date), "MMM dd")}
                                                </span>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            <div className="card clickable" onClick={() => window.location.href = "/dashboard/ledger"} style={{ 
                                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                color: "white",
                                border: "none"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                    <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "12px", padding: "0.75rem" }}>
                                        <Wallet size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Financial Ledger</h3>
                                        <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.8 }}>Manage rotations & expenses</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card clickable" onClick={() => window.location.href = "/dashboard/collection"} style={{ borderLeft: "6px solid var(--success)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                    <div style={{ background: "rgba(16, 185, 129, 0.1)", borderRadius: "12px", padding: "0.75rem" }}>
                                        <PieIcon size={24} color="var(--success)" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Daily Collection</h3>
                                        <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.5 }}>Quick entry & tracking</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .date-input {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 0.85rem;
                    outline: none;
                    width: 100px;
                }
                .dashboard-card {
                    transition: transform 0.2s;
                }
                .dashboard-card:hover {
                    transform: translateY(-4px);
                }
                .clickable {
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .clickable:hover {
                    transform: scale(1.02);
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
                }
                .bar-wrapper:hover .bar {
                    filter: brightness(1.2);
                }
                .bar-wrapper:hover .tooltip {
                    opacity: 1;
                    transform: translateX(-50%) translateY(-10px);
                }
                .tooltip {
                    position: absolute;
                    top: -25px;
                    left: 50%;
                    transform: translateX(-50%) translateY(0);
                    background: var(--primary);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.65rem;
                    font-weight: 700;
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.2s;
                    white-space: nowrap;
                    z-index: 10;
                }
            `}</style>
        </div>
    );
}
