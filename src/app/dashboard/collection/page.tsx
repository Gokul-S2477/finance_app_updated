"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Calendar as CalendarIcon, CheckCircle2, Circle, Edit2, Loader2, X } from "lucide-react";
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
    const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    useEffect(() => { fetchStatus(); }, [date, search]);

    const fetchStatus = async () => {
        setLoading(true);
        const data = await getCollectionStatus(date, search);
        setCustomers(data as any[]);
        setLoading(false);
    };

    const startEditing = (item: any) => {
        const next = new Set(editingIds);
        next.add(item.loanId);
        setEditingIds(next);
        setAmounts(prev => ({ ...prev, [item.loanId]: item.isProcessed ? item.collectedAmount : "" }));
        // Focus input after render
        setTimeout(() => inputRefs.current[item.loanId]?.focus(), 50);
    };

    const cancelEditing = (loanId: number) => {
        const next = new Set(editingIds);
        next.delete(loanId);
        setEditingIds(next);
        setAmounts(prev => { const n = { ...prev }; delete n[loanId]; return n; });
    };

    const handleEntry = async (item: any) => {
        // Allow 0 — treat as "visited, nothing collected"
        const rawAmount = amounts[item.loanId];
        const amount = rawAmount !== undefined && rawAmount !== "" ? rawAmount : item.amountToCollect;
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount < 0) return;

        setSaving(item.loanId);

        try {
            await recordCollection(item.loanId, date, amount);

            // Update local state immediately for responsiveness
            const newEditing = new Set(editingIds);
            newEditing.delete(item.loanId);
            setEditingIds(newEditing);
            setAmounts(prev => { const n = { ...prev }; delete n[item.loanId]; return n; });
            setSaving(null);

            // Fetch fresh data after save
            const freshData = await getCollectionStatus(date, search);
            setCustomers(freshData as any[]);
        } catch (e) {
            setSaving(null);
            alert("Failed to save. Please try again.");
        }
    };

    const processedCount = customers.filter(c => c.isProcessed && !editingIds.has(c.loanId)).length;
    const totalCount = customers.length;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ marginBottom: "0.2rem" }}>Collection</h1>
                    {!loading && totalCount > 0 && (
                        <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>
                            {processedCount}/{totalCount} collected
                        </p>
                    )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.6rem 0.9rem" }}>
                    <CalendarIcon size={14} style={{ opacity: 0.5 }} />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                        style={{ border: "none", background: "none", outline: "none", color: "white", fontSize: "0.9rem", width: "130px" }} />
                </div>
            </div>

            {/* Progress bar */}
            {!loading && totalCount > 0 && (
                <div style={{ height: "4px", background: "var(--border)", borderRadius: "4px", marginBottom: "1.5rem", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(processedCount / totalCount) * 100}%`, background: "var(--success)", borderRadius: "4px", transition: "width 0.4s ease" }} />
                </div>
            )}

            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.6rem 1rem", marginBottom: "1.5rem" }}>
                <Search size={18} style={{ opacity: 0.4, flexShrink: 0 }} />
                <input type="text" placeholder="Search by name or ID…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ border: "none", background: "none", outline: "none", color: "white", width: "100%", fontSize: "0.95rem" }} />
                {search && (
                    <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <X size={16} style={{ opacity: 0.4 }} />
                    </button>
                )}
            </div>

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {loading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "3rem", opacity: 0.5 }}>
                        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                        <span>Loading list…</span>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>
                        <p>No active loans found for this date.</p>
                    </div>
                ) : customers.map((item: any) => {
                    const isEditing = editingIds.has(item.loanId);
                    const isDone = item.isProcessed && !isEditing;
                    const isSavingThis = saving === item.loanId;

                    return (
                        <div key={item.loanId} className="card" style={{
                            borderLeft: `4px solid ${isDone ? "var(--success)" : "var(--primary)"}`,
                            padding: "0.85rem 1rem",
                            opacity: isSavingThis ? 0.7 : 1,
                            transition: "opacity 0.2s"
                        }}>
                            {/* Top row: ID + Name + Status icon */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, flex: 1 }}>
                                    {isDone
                                        ? <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                                        : <Circle size={16} style={{ opacity: 0.25, flexShrink: 0 }} />
                                    }
                                    <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--primary)", flexShrink: 0 }}>
                                        {item.ownId || `#${item.loanId}`}
                                    </span>
                                    <span style={{ fontSize: "0.9rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {item.name}
                                    </span>
                                </div>
                                {isDone && (
                                    <button onClick={() => startEditing(item)} style={{ background: "var(--input)", border: "none", borderRadius: "8px", padding: "0.3rem 0.5rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", flexShrink: 0 }}>
                                        <Edit2 size={12} /> Edit
                                    </button>
                                )}
                            </div>

                            {/* Bottom row: Due amount + input OR collected amount */}
                            {isDone ? (
                                /* Already collected */
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "1.5rem" }}>
                                    <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>Collected today</span>
                                    <span style={{ fontWeight: 700, color: "var(--success)", fontSize: "1rem" }}>
                                        ₹{parseFloat(item.collectedAmount).toLocaleString()}
                                    </span>
                                </div>
                            ) : (
                                /* Entry row */
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", paddingLeft: "1.5rem" }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{ fontSize: "0.7rem", opacity: 0.5 }}>Daily due</span>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>₹{parseFloat(item.amountToCollect).toLocaleString()}</div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                                        <input
                                            ref={el => { inputRefs.current[item.loanId] = el; }}
                                            type="number"
                                            inputMode="numeric"
                                            className="input"
                                            placeholder={item.amountToCollect}
                                            value={amounts[item.loanId] ?? ""}
                                            min="0"
                                            onChange={e => setAmounts(prev => ({ ...prev, [item.loanId]: e.target.value }))}
                                            onKeyDown={e => e.key === "Enter" && handleEntry(item)}
                                            style={{ width: "80px", padding: "0.5rem 0.4rem", textAlign: "center", fontSize: "0.95rem" }}
                                        />
                                        {isEditing && (
                                            <button
                                                onClick={() => cancelEditing(item.loanId)}
                                                style={{ background: "var(--input)", border: "none", borderRadius: "8px", padding: "0.5rem", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}>
                                                <X size={16} />
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem", fontWeight: 600 }}
                                            disabled={isSavingThis}
                                            onClick={() => handleEntry(item)}>
                                            {isSavingThis ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Save"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
