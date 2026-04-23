"use client";

import { useState, useEffect } from "react";
import { getFinancialSummary, addLedgerEntry, getLedgerEntries } from "@/db/actions";
import { Wallet, ArrowUpCircle, ArrowDownCircle, Plus, Loader2, History, IndianRupee } from "lucide-react";
import { format } from "date-fns";

export default function LedgerPage() {
    const [summary, setSummary] = useState<any>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        amount: "",
        type: "rotation",
        description: "",
        date: format(new Date(), "yyyy-MM-dd")
    });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const [s, e] = await Promise.all([getFinancialSummary(), getLedgerEntries()]);
        setSummary(s);
        setEntries(e as any[]);
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.amount || parseFloat(form.amount) <= 0) return;
        setSaving(true);
        await addLedgerEntry(form);
        setForm({ ...form, amount: "", description: "" });
        setShowModal(false);
        setSaving(false);
        loadData();
    }

    if (loading && !summary) return <div style={{ padding: "2rem", textAlign: "center", opacity: 0.5 }}>Loading Ledger...</div>;

    return (
        <div className="animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1 style={{ margin: 0 }}>Financial Ledger</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Plus size={18} /> Add Entry
                </button>
            </div>

            {/* Cash in Hand Card */}
            <div className="card" style={{ 
                background: "linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)", 
                color: "white", 
                padding: "2rem", 
                borderRadius: "24px", 
                marginBottom: "2rem",
                boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", opacity: 0.8, marginBottom: "0.5rem" }}>
                    <Wallet size={20} />
                    <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>Expected Cash in Hand</span>
                </div>
                <h2 style={{ fontSize: "3rem", fontWeight: 800, margin: 0, letterSpacing: "-1px" }}>
                    ₹{summary?.expectedCash?.toLocaleString()}
                </h2>
                <p style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "1rem" }}>
                    Calculated from collections, rotations, and expenses.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="responsive-grid cols-3" style={{ marginBottom: "2rem" }}>
                <div className="card" style={{ borderLeft: "4px solid var(--success)" }}>
                    <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>Total Collected</p>
                    <h3 style={{ margin: "0.25rem 0" }}>₹{summary?.totalCollected?.toLocaleString()}</h3>
                </div>
                <div className="card" style={{ borderLeft: "4px solid var(--warning)" }}>
                    <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>Total Rotated</p>
                    <h3 style={{ margin: "0.25rem 0" }}>₹{summary?.totalRotated?.toLocaleString()}</h3>
                </div>
                <div className="card" style={{ borderLeft: "4px solid var(--danger)" }}>
                    <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>Total Expenses</p>
                    <h3 style={{ margin: "0.25rem 0" }}>₹{summary?.totalExpenses?.toLocaleString()}</h3>
                </div>
            </div>

            {/* History Table */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <History size={18} style={{ opacity: 0.5 }} />
                    <h3 style={{ margin: 0, fontSize: "1rem" }}>Transaction History</h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", background: "rgba(255,255,255,0.02)" }}>
                                <th style={{ padding: "1rem", fontSize: "0.8rem", opacity: 0.5 }}>Date</th>
                                <th style={{ padding: "1rem", fontSize: "0.8rem", opacity: 0.5 }}>Type</th>
                                <th style={{ padding: "1rem", fontSize: "0.8rem", opacity: 0.5 }}>Description</th>
                                <th style={{ padding: "1rem", fontSize: "0.8rem", opacity: 0.5, textAlign: "right" }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((item) => (
                                <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <td style={{ padding: "1rem", fontSize: "0.9rem" }}>{format(new Date(item.date), "MMM dd, yyyy")}</td>
                                    <td style={{ padding: "1rem" }}>
                                        <span style={{ 
                                            padding: "0.25rem 0.6rem", 
                                            borderRadius: "20px", 
                                            fontSize: "0.7rem", 
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            background: item.type === 'rotation' ? 'rgba(245, 158, 11, 0.1)' : 
                                                        item.type === 'capital' ? 'rgba(16, 185, 129, 0.1)' : 
                                                        'rgba(239, 68, 68, 0.1)',
                                            color: item.type === 'rotation' ? 'var(--warning)' : 
                                                   item.type === 'capital' ? 'var(--success)' : 
                                                   'var(--danger)'
                                        }}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td style={{ padding: "1rem", fontSize: "0.9rem", opacity: 0.8 }}>{item.description || "-"}</td>
                                    <td style={{ padding: "1rem", fontSize: "0.9rem", fontWeight: 700, textAlign: "right" }}>
                                        ₹{parseFloat(item.amount).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Entry Modal */}
            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
                    <div className="card animate-scale-in" style={{ width: "100%", maxWidth: "400px", padding: "2rem" }}>
                        <h2 style={{ marginBottom: "1.5rem" }}>Add Ledger Entry</h2>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={{ fontSize: "0.8rem", opacity: 0.5, display: "block", marginBottom: "0.4rem" }}>Type</label>
                                <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={{ width: "100%" }}>
                                    <option value="rotation">🔄 Rotation (Capital Out)</option>
                                    <option value="expense">💼 Business Expense</option>
                                    <option value="personal">🏠 Personal Use</option>
                                    <option value="capital">💰 External Capital In</option>
                                    <option value="initial">🏁 Opening Balance</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.8rem", opacity: 0.5, display: "block", marginBottom: "0.4rem" }}>Amount (₹)</label>
                                <input type="number" className="input" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required style={{ width: "100%" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: "0.8rem", opacity: 0.5, display: "block", marginBottom: "0.4rem" }}>Description</label>
                                <input type="text" className="input" placeholder="What is this for?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ width: "100%" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: "0.8rem", opacity: 0.5, display: "block", marginBottom: "0.4rem" }}>Date</label>
                                <input type="date" className="input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required style={{ width: "100%" }} />
                            </div>
                            
                            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1, background: "var(--border)" }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : "Save Entry"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .animate-scale-in { animation: scaleIn 0.3s ease-out; }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}
