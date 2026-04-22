"use client";

import { useState, useEffect } from "react";
import { Search, Calendar as CalendarIcon, CheckCircle2, Circle, ChevronRight, Edit2 } from "lucide-react";
import { getCollectionStatus, recordCollection, closeLoan } from "@/db/actions";
import { format } from "date-fns";

export default function CollectionPage() {
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [search, setSearch] = useState("");
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [amounts, setAmounts] = useState<Record<number, string>>({});
    const [saving, setSaving] = useState<number | null>(null);
    const [editingIds, setEditingIds] = useState<Set<number>>(new Set());

    useEffect(() => { fetchStatus(); }, [date, search]);

    const fetchStatus = async () => {
        setLoading(true);
        const data = await getCollectionStatus(date, search);
        setCustomers(data as any[]);
        setLoading(false);
    };

    const handleEntry = async (item: any) => {
        const amount = amounts[item.loanId] || item.amountToCollect;
        if (!amount || parseFloat(amount) <= 0) return;
        setSaving(item.loanId);

        await recordCollection(item.loanId, date, amount);

        const totalSoFar = parseFloat(item.totalCollected || "0");
        const amountVal = parseFloat(amount);
        const loanAmt = parseFloat(item.loanAmount || "10000");

        if (totalSoFar + amountVal >= loanAmt) {
            if (window.confirm("Amount collected fully successfully. Shall we close the loan?")) {
                await closeLoan(item.loanId);
            }
        }

        setSaving(null);
        setAmounts(prev => { const n = { ...prev }; delete n[item.loanId]; return n; });
        const newEditing = new Set(editingIds);
        newEditing.delete(item.loanId);
        setEditingIds(newEditing);
        fetchStatus();
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <h1>Collection</h1>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.6rem 0.9rem" }}>
                    <CalendarIcon size={14} style={{ opacity: 0.5 }} />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                        style={{ border: "none", background: "none", outline: "none", color: "white", fontSize: "0.9rem", width: "120px" }} />
                </div>
            </div>

            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.6rem 1rem", marginBottom: "1.5rem" }}>
                <Search size={18} style={{ opacity: 0.4, flexShrink: 0 }} />
                <input type="text" placeholder="Search customer…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ border: "none", background: "none", outline: "none", color: "white", width: "100%", fontSize: "0.95rem" }} />
            </div>

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {loading ? (
                    <p style={{ opacity: 0.5, textAlign: "center", padding: "2rem" }}>Loading list…</p>
                ) : customers.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>
                        <p>No active collections found.</p>
                    </div>
                ) : customers.map((item: any) => {
                    const isActuallyProcessed = item.isProcessed && !editingIds.has(item.loanId);

                    return (
                        <div key={item.loanId} className="card" style={{ borderLeft: `4px solid ${isActuallyProcessed ? "var(--success)" : "var(--primary)"}`, padding: "0.75rem 1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "nowrap" }}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        {isActuallyProcessed ? <CheckCircle2 size={14} color="var(--success)" /> : <Circle size={14} style={{ opacity: 0.3 }} />}
                                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary)" }}>{item.ownId || `#${item.cust_id}`}</h3>
                                        <span style={{ fontSize: "0.95rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</span>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                                    {isActuallyProcessed ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                            <div style={{ textAlign: "right" }}>
                                                <p style={{ fontSize: "0.6rem", opacity: 0.5 }}>Collected</p>
                                                <p style={{ fontWeight: 700, color: "var(--success)", fontSize: "0.95rem" }}>₹{parseFloat(item.collectedAmount).toLocaleString()}</p>
                                            </div>
                                            <button className="btn" onClick={() => {
                                                const next = new Set(editingIds); next.add(item.loanId); setEditingIds(next);
                                                setAmounts(prev => ({ ...prev, [item.loanId]: item.collectedAmount }));
                                            }} style={{ background: "var(--input)", padding: "0.4rem", borderRadius: "8px" }}>
                                                <Edit2 size={14} style={{ opacity: 0.6 }} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                            <div style={{ textAlign: "right" }}>
                                                <p style={{ fontSize: "0.6rem", opacity: 0.5 }}>Due</p>
                                                <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>₹{parseFloat(item.amountToCollect).toLocaleString()}</p>
                                            </div>
                                            <input type="number" inputMode="numeric" className="input" placeholder={item.amountToCollect} value={amounts[item.loanId] || ""} onChange={e => setAmounts(prev => ({ ...prev, [item.loanId]: e.target.value }))}
                                                style={{ width: "70px", padding: "0.45rem", textAlign: "center", fontSize: "0.9rem" }} />
                                            <button className="btn btn-primary" style={{ padding: "0.45rem" }} onClick={() => handleEntry(item)}>
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
