"use client";

import { useState, useEffect } from "react";
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Calendar, History, TrendingUp, TrendingDown, X } from "lucide-react";
import { getFinancialSummary, addLedgerEntry, getLedgerEntries } from "@/db/actions";
import { format } from "date-fns";

export default function LedgerPage() {
    const [summary, setSummary] = useState<any>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    
    const [formData, setFormData] = useState({
        amount: "",
        type: "rotation",
        description: "",
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [s, e] = await Promise.all([getFinancialSummary(), getLedgerEntries()]);
        setSummary(s);
        setEntries(e);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.type) return;
        
        await addLedgerEntry(formData);
        setShowAdd(false);
        setFormData({ ...formData, amount: "", description: "" });
        loadData();
    };

    if (loading && !summary) return <div style={{ padding: "2rem", textAlign: "center", opacity: 0.5 }}>Loading Ledger...</div>;

    const typeLabels: any = {
        rotation: { label: "Rotation (In)", icon: ArrowUpRight, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
        expense: { label: "Business Expense (Out)", icon: ArrowDownLeft, color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
        personal: { label: "Personal Expense (Out)", icon: ArrowDownLeft, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
        capital: { label: "External Capital (In)", icon: ArrowUpRight, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" }
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: "5rem" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                <div>
                    <h1>Financial Ledger</h1>
                    <p style={{ opacity: 0.5, fontSize: "0.9rem" }}>Track rotations, expenses, and capital movements.</p>
                </div>
                <button 
                    onClick={() => setShowAdd(true)}
                    className="btn" 
                    style={{ background: "var(--primary)", color: "white", borderRadius: "12px", padding: "0.75rem 1.25rem" }}
                >
                    <Plus size={20} />
                    <span>Add Entry</span>
                </button>
            </div>

            {/* Expected Cash Card */}
            <div className="card" style={{ 
                background: "linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)", 
                padding: "2rem", 
                borderRadius: "24px",
                marginBottom: "2rem",
                position: "relative",
                overflow: "hidden"
            }}>
                <div style={{ position: "absolute", right: "-20px", top: "-20px", opacity: 0.1 }}>
                    <Wallet size={150} />
                </div>
                <p style={{ fontSize: "0.9rem", opacity: 0.8, fontWeight: 500 }}>Expected Cash in Hand</p>
                <h2 style={{ fontSize: "2.5rem", margin: "0.5rem 0", fontWeight: 800 }}>
                    ₹{summary?.expectedCash?.toLocaleString('en-IN') || "0"}
                </h2>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                    <div style={{ background: "rgba(255,255,255,0.1)", padding: "0.75rem 1rem", borderRadius: "12px", backdropFilter: "blur(10px)" }}>
                        <p style={{ fontSize: "0.7rem", opacity: 0.7 }}>Total Collected</p>
                        <p style={{ fontSize: "1rem", fontWeight: 700 }}>₹{summary?.totalCollected?.toLocaleString('en-IN')}</p>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.1)", padding: "0.75rem 1rem", borderRadius: "12px", backdropFilter: "blur(10px)" }}>
                        <p style={{ fontSize: "0.7rem", opacity: 0.7 }}>External Capital</p>
                        <p style={{ fontSize: "1rem", fontWeight: 700 }}>₹{summary?.totalCapital?.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            {/* Detailed Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                <div className="card" style={{ padding: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                            <ArrowUpRight size={18} />
                        </div>
                        <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>Total Rotated</span>
                    </div>
                    <p style={{ fontSize: "1.25rem", fontWeight: 700 }}>₹{summary?.totalRotated?.toLocaleString('en-IN')}</p>
                </div>
                <div className="card" style={{ padding: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
                            <ArrowDownLeft size={18} />
                        </div>
                        <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>Total Expenses</span>
                    </div>
                    <p style={{ fontSize: "1.25rem", fontWeight: 700 }}>₹{summary?.totalExpenses?.toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* History Table */}
            <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <History size={18} style={{ opacity: 0.5 }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Recent Movements</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {entries.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>
                        <Plus size={40} style={{ margin: "0 auto 1rem", opacity: 0.2 }} />
                        <p>No ledger entries yet.</p>
                    </div>
                ) : entries.map((e) => {
                    const type = typeLabels[e.type] || { label: e.type, icon: Plus, color: "white", bg: "rgba(255,255,255,0.05)" };
                    const Icon = type.icon;
                    return (
                        <div key={e.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem" }}>
                            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: type.bg, color: type.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <p style={{ fontSize: "0.95rem", fontWeight: 600 }}>{type.label}</p>
                                    <p style={{ fontSize: "0.75rem", opacity: 0.4 }}>{e.description || "No description"}</p>
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <p style={{ fontSize: "1rem", fontWeight: 700, color: type.color }}>
                                    {['rotation', 'expense', 'personal'].includes(e.type) ? '-' : '+'} ₹{parseFloat(e.amount).toLocaleString('en-IN')}
                                </p>
                                <p style={{ fontSize: "0.7rem", opacity: 0.4 }}>{format(new Date(e.date), "dd MMM yyyy")}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Entry Modal */}
            {showAdd && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.8)",
                    backdropFilter: "blur(8px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "1.5rem"
                }}>
                    <div className="card" style={{ width: "100%", maxWidth: "450px", padding: "2rem", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <h2 style={{ fontSize: "1.25rem" }}>Add Ledger Entry</h2>
                            <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: "white", opacity: 0.5 }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", opacity: 0.6, marginBottom: "0.5rem" }}>Amount (₹)</label>
                                <input 
                                    type="number" 
                                    required
                                    placeholder="Enter amount"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    style={{ width: "100%", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.8rem 1rem", color: "white" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", opacity: 0.6, marginBottom: "0.5rem" }}>Type</label>
                                <select 
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    style={{ 
                                        width: "100%", 
                                        background: "var(--input)", 
                                        border: "1px solid var(--border)", 
                                        borderRadius: "10px", 
                                        padding: "0.8rem 1rem", 
                                        color: "white",
                                        appearance: "none",
                                        cursor: "pointer",
                                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                        backgroundRepeat: "no-repeat",
                                        backgroundPosition: "right 1rem center",
                                        backgroundSize: "1.2rem"
                                    }}
                                >
                                    <option value="rotation" style={{ background: "#1a1a1a", color: "white" }}>Rotation (In)</option>
                                    <option value="expense" style={{ background: "#1a1a1a", color: "white" }}>Business Expense (Out)</option>
                                    <option value="personal" style={{ background: "#1a1a1a", color: "white" }}>Personal Expense (Out)</option>
                                    <option value="capital" style={{ background: "#1a1a1a", color: "white" }}>External Capital (In)</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", opacity: 0.6, marginBottom: "0.5rem" }}>Description</label>
                                <input 
                                    type="text" 
                                    placeholder="What is this for?"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: "100%", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.8rem 1rem", color: "white" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", opacity: 0.6, marginBottom: "0.5rem" }}>Date</label>
                                <input 
                                    type="date" 
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    style={{ width: "100%", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.8rem 1rem", color: "white" }}
                                />
                            </div>

                            <button className="btn" type="submit" style={{ background: "var(--primary)", color: "white", marginTop: "1rem", padding: "1rem" }}>
                                Save Entry
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
