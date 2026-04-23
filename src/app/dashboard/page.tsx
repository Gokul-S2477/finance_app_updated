"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, DollarSign, Calendar, ArrowRight, Wallet, PieChart as PieIcon, BarChart3, Clock } from "lucide-react";
import { getDashboardStats } from "@/db/dashboard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from "recharts";
import Link from "next/link";

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        const data = await getDashboardStats(dateRange.from, dateRange.to);
        setStats(data);
        setLoading(false);
    };

    if (loading && !stats) return <div style={{ padding: "2rem", textAlign: "center", opacity: 0.5 }}>Loading Dashboard...</div>;

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

    return (
        <div className="animate-fade-in" style={{ paddingBottom: "5rem" }}>
            <div style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Executive Dashboard</h1>
                    <p style={{ opacity: 0.5, marginTop: "0.25rem" }}>Business performance and collection analytics.</p>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "0.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "0.65rem", opacity: 0.4, paddingLeft: "0.5rem" }}>From</span>
                        <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                            style={{ background: "none", border: "none", color: "white", fontSize: "0.85rem", padding: "0.25rem 0.5rem", cursor: "pointer" }} />
                    </div>
                    <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "0.65rem", opacity: 0.4, paddingLeft: "0.5rem" }}>To</span>
                        <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                            style={{ background: "none", border: "none", color: "white", fontSize: "0.85rem", padding: "0.25rem 0.5rem", cursor: "pointer" }} />
                    </div>
                    <button onClick={fetchStats} className="btn" style={{ background: "var(--primary)", color: "white", padding: "0.6rem 1rem", borderRadius: "12px", marginLeft: "0.5rem" }}>
                        Apply
                    </button>
                </div>
            </div>

            {/* Main KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
                <div className="card" style={{ padding: "1.5rem", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <DollarSign size={20} />
                        </div>
                        <TrendingUp size={18} style={{ color: "var(--success)" }} />
                    </div>
                    <p style={{ fontSize: "0.8rem", opacity: 0.5, fontWeight: 500 }}>Total Collected</p>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0.4rem 0" }}>₹{parseFloat(stats?.totalCollected).toLocaleString('en-IN')}</h2>
                    <p style={{ fontSize: "0.7rem", color: "var(--success)", fontWeight: 600 }}>Period performance</p>
                </div>

                <div className="card" style={{ padding: "1.5rem", background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--error)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Clock size={20} />
                        </div>
                        <span style={{ fontSize: "0.7rem", opacity: 0.4 }}>Outstanding</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", opacity: 0.5, fontWeight: 500 }}>Total Pending</p>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0.4rem 0" }}>₹{parseFloat(stats?.totalPending).toLocaleString('en-IN')}</h2>
                    <p style={{ fontSize: "0.7rem", opacity: 0.4 }}>Balance to be collected</p>
                </div>

                <div className="card" style={{ padding: "1.5rem", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--success)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <TrendingUp size={20} />
                        </div>
                        <TrendingUp size={18} style={{ color: "var(--success)" }} />
                    </div>
                    <p style={{ fontSize: "0.8rem", opacity: 0.5, fontWeight: 500 }}>Total Profit</p>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0.4rem 0" }}>₹{parseFloat(stats?.totalProfit).toLocaleString('en-IN')}</h2>
                    <p style={{ fontSize: "0.7rem", color: "var(--success)", fontWeight: 600 }}>Interest yield</p>
                </div>

                <div className="card" style={{ padding: "1.5rem", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#f59e0b", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Users size={20} />
                        </div>
                        <span style={{ fontSize: "0.7rem", opacity: 0.5 }}>Active</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", opacity: 0.5, fontWeight: 500 }}>Active Loans</p>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0.4rem 0" }}>{stats?.activeLoans}</h2>
                    <p style={{ fontSize: "0.7rem", opacity: 0.5 }}>Running accounts</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
                {/* Collection Trend */}
                <div className="card" style={{ padding: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Collection Trend</h3>
                        <div style={{ padding: "4px 10px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", fontSize: "0.7rem", opacity: 0.5 }}>Daily</div>
                    </div>
                    <div style={{ width: "100%", height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.trends}>
                                <defs>
                                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(val) => `₹${val}`} />
                                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                <Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Weekday Distribution */}
                <div className="card" style={{ padding: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Weekday Performance</h3>
                        <BarChart3 size={20} style={{ opacity: 0.3 }} />
                    </div>
                    <div style={{ width: "100%", height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.weekdayDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                                    {stats?.weekdayDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="card" style={{ padding: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Loan Status</h3>
                        <PieIcon size={20} style={{ opacity: 0.3 }} />
                    </div>
                    <div style={{ width: "100%", height: 300, position: "relative" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats?.statusDistribution} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                                    {stats?.statusDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                            <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{stats?.activeLoans + (stats?.statusDistribution.find((s:any)=>s.name==='Closed')?.value || 0)}</span>
                            <span style={{ fontSize: "0.7rem", opacity: 0.5 }}>Total Loans</span>
                        </div>
                    </div>
                </div>

                {/* Top Borrowers */}
                <div className="card" style={{ padding: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Top 5 Borrowers</h3>
                        <Users size={20} style={{ opacity: 0.3 }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {stats?.topBorrowers.map((b: any, i: number) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, opacity: 0.5 }}>
                                    {i + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                        <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{b.name}</span>
                                        <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>₹{b.total.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", overflow: "hidden" }}>
                                        <div style={{ 
                                            width: `${(b.total / stats.topBorrowers[0].total) * 100}%`, 
                                            height: "100%", 
                                            background: COLORS[i % COLORS.length],
                                            borderRadius: "10px" 
                                        }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <Link href="/dashboard/customers" className="card" style={{ flex: 1, minWidth: "200px", padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", color: "inherit", transition: "all 0.2s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)" }}>
                            <Users size={20} />
                        </div>
                        <span style={{ fontWeight: 600 }}>Add Customer</span>
                    </div>
                    <ArrowRight size={18} style={{ opacity: 0.3 }} />
                </Link>

                <Link href="/dashboard/collection" className="card" style={{ flex: 1, minWidth: "200px", padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", color: "inherit", transition: "all 0.2s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.1)", color: "var(--success)" }}>
                            <Calendar size={20} />
                        </div>
                        <span style={{ fontWeight: 600 }}>Daily Collection</span>
                    </div>
                    <ArrowRight size={18} style={{ opacity: 0.3 }} />
                </Link>

                <Link href="/dashboard/ledger" className="card" style={{ flex: 1, minWidth: "200px", padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", color: "inherit", transition: "all 0.2s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                            <Wallet size={20} />
                        </div>
                        <span style={{ fontWeight: 600 }}>Finance Ledger</span>
                    </div>
                    <ArrowRight size={18} style={{ opacity: 0.3 }} />
                </Link>
            </div>
        </div>
    );
}
