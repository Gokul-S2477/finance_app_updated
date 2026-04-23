"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Calendar as CalendarIcon, CheckCircle2, Circle, Edit2, Loader2, X } from "lucide-react";
import { getCollectionStatus, recordCollection } from "@/db/actions";
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

    // We use a separate state for tracking "Done" items locally to avoid jumping
    const [localDoneIds, setLocalDoneIds] = useState<Set<number>>(new Set());

    useEffect(() => { 
        fetchStatus(); 
        setLocalDoneIds(new Set()); // Reset local sorting when date changes
    }, [date, search]);

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
        setTimeout(() => inputRefs.current[item.loanId]?.focus(), 50);
    };

    const cancelEditing = (loanId: number) => {
        const next = new Set(editingIds);
        next.delete(loanId);
        setEditingIds(next);
    };

    const handleEntry = async (item: any) => {
        const amount = amounts[item.loanId] !== undefined && amounts[item.loanId] !== "" ? amounts[item.loanId] : item.amountToCollect;
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount < 0) return;

        setSaving(item.loanId);

        try {
            await recordCollection(item.loanId, date, amount);

            // Mark as done locally
            setLocalDoneIds(prev => new Set(prev).add(item.loanId));
            
            // Update local customer data without re-fetching yet (to avoid jumping)
            setCustomers(prev => prev.map(c => 
                c.loanId === item.loanId 
                ? { ...c, isProcessed: true, collectedAmount: amount } 
                : c
            ));

            const newEditing = new Set(editingIds);
            newEditing.delete(item.loanId);
            setEditingIds(newEditing);
            setSaving(null);
        } catch (e) {
            setSaving(null);
            alert("Failed to save. Please try again.");
        }
    };

    const processedCount = customers.filter(c => c.isProcessed).length;
    const totalCount = customers.length;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ marginBottom: "0.2rem" }}>Collection Entry</h1>
                    {!loading && totalCount > 0 && (
                        <p style={{ fontSize: "0.8rem", opacity: 0.5 }}>
                            {processedCount}/{totalCount} accounts collected
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
                <div style={{ height: "6px", background: "var(--border)", borderRadius: "4px", marginBottom: "1.5rem", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(processedCount / totalCount) * 100}%`, background: "var(--success)", borderRadius: "4px", transition: "width 0.4s ease" }} />
                </div>
            )}

            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.6rem 1rem", marginBottom: "1.5rem" }}>
                <Search size={18} style={{ opacity: 0.4, flexShrink: 0 }} />
                <input type="text" placeholder="Search customer..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ border: "none", background: "none", outline: "none", color: "white", width: "100%", fontSize: "0.95rem" }} />
            </div>

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {loading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "3rem", opacity: 0.5 }}>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Syncing list...</span>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>
                        <p>No accounts eligible for collection on this date.</p>
                    </div>
                ) : customers.map((item: any) => {
                    const isEditing = editingIds.has(item.loanId);
                    const isProcessed = item.isProcessed;
                    const isDone = isProcessed && !isEditing;
                    const isSavingThis = saving === item.loanId;
                    const recentlySaved = localDoneIds.has(item.loanId);

                    return (
                        <div key={item.loanId} className="card collection-row" style={{
                            borderLeft: `6px solid ${isDone ? "var(--success)" : recentlySaved ? "var(--success)" : "var(--primary)"}`,
                            background: recentlySaved ? "rgba(16, 185, 129, 0.05)" : isDone ? "rgba(255,255,255,0.02)" : "var(--card)",
                            padding: "1rem",
                            opacity: isSavingThis ? 0.7 : 1,
                            transition: "all 0.3s ease"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0, flex: 1 }}>
                                    {isDone || recentlySaved
                                        ? <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0 }} />
                                        : <Circle size={18} style={{ opacity: 0.25, flexShrink: 0 }} />
                                    }
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: "0.7rem", opacity: 0.5, fontWeight: 700 }}>{item.ownId || `#${item.loanId}`}</div>
                                        <div style={{ fontSize: "1.05rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {item.name}
                                        </div>
                                    </div>
                                </div>
                                {(isDone || recentlySaved) && (
                                    <button onClick={() => startEditing(item)} style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "8px", padding: "0.4rem 0.6rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--success)", fontSize: "0.75rem", fontWeight: 600 }}>
                                        <Edit2 size={14} /> Change
                                    </button>
                                )}
                            </div>

                            {isDone || recentlySaved ? (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "2.25rem" }}>
                                    <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>Amount Received</span>
                                    <span style={{ fontWeight: 800, color: "var(--success)", fontSize: "1.1rem" }}>
                                        ₹{parseFloat(item.collectedAmount).toLocaleString()}
                                    </span>
                                </div>
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem", paddingLeft: "2.25rem" }}>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: "0.7rem", opacity: 0.5, display: "block" }}>Daily Due</span>
                                        <div style={{ fontSize: "1rem", fontWeight: 700 }}>₹{parseFloat(item.amountToCollect).toLocaleString()}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <input
                                            ref={el => { inputRefs.current[item.loanId] = el; }}
                                            type="number"
                                            className="input"
                                            placeholder={item.amountToCollect}
                                            value={amounts[item.loanId] ?? ""}
                                            onChange={e => setAmounts(prev => ({ ...prev, [item.loanId]: e.target.value }))}
                                            onKeyDown={e => e.key === "Enter" && handleEntry(item)}
                                            style={{ width: "90px", textAlign: "center", fontSize: "1rem", fontWeight: 700 }}
                                        />
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: "0.5rem 1.25rem" }}
                                            disabled={isSavingThis}
                                            onClick={() => handleEntry(item)}>
                                            {isSavingThis ? <Loader2 size={18} className="animate-spin" /> : "Save"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
                .collection-row:hover { transform: scale(1.01); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
            `}</style>
        </div>
    );
}
