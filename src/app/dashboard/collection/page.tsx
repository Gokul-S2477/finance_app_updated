"use client";

import { useState, useEffect } from "react";
import { Search, Calendar as CalendarIcon, CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { getCollectionStatus, recordCollection } from "@/db/actions";
import { format } from "date-fns";

export default function CollectionPage() {
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [search, setSearch] = useState("");
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [amounts, setAmounts] = useState<Record<number, string>>({});
    const [saving, setSaving] = useState<number | null>(null);

    useEffect(() => { fetchStatus(); }, [date, search]);

    const fetchStatus = async () => {
        setLoading(true);
        const data = await getCollectionStatus(date, search);
        setCustomers(data as any[]);
        setLoading(false);
    };

    const handleEntry = async (loanId: number, defaultAmt: string) => {
        const amount = amounts[loanId] || defaultAmt;
        if (!amount || parseFloat(amount) <= 0) return;
        setSaving(loanId);
        await recordCollection(loanId, date, amount);
        setSaving(null);
        setAmounts(prev => { const n = { ...prev }; delete n[loanId]; return n; });
        fetchStatus();
    };

    return (
        <div className="animate-fade-in">

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <h1>Daily Collection</h1>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.55rem 1rem" }}>
                    <CalendarIcon size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
                    <input
                        type="date" value={date} onChange={e => setDate(e.target.value)}
                        style={{ border: "none", background: "none", outline: "none", color: "white", fontSize: "0.9rem" }}
                    />
                </div>
            </div>

            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.6rem 1rem", marginBottom: "1.5rem" }}>
                <Search size={18} style={{ opacity: 0.4, flexShrink: 0 }} />
                <input
                    type="text" placeholder="Search by ID or Name…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ border: "none", background: "none", outline: "none", color: "white", width: "100%", fontSize: "0.9rem" }}
                />
            </div>

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {loading ? (
                    <p style={{ opacity: 0.5, padding: "2rem", textAlign: "center" }}>Loading…</p>
                ) : customers.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>
                        <p>No active loans found for this date.</p>
                    </div>
                ) : customers.map((item: any) => (
                    <div
                        key={item.loanId}
                        className="card"
                        style={{
                            padding: "0.85rem 1.1rem",
                            borderLeft: `4px solid ${item.isProcessed ? "var(--success)" : "var(--primary)"}`,
                            opacity: item.isProcessed ? 0.65 : 1,
                            transition: "opacity 0.2s",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                            {/* Name & ID */}
                            <div style={{ flex: 1, minWidth: "120px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    {item.isProcessed
                                        ? <CheckCircle2 size={15} color="var(--success)" />
                                        : <Circle size={15} style={{ opacity: 0.3 }} />
                                    }
                                    <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{item.name}</span>
                                </div>
                                <p style={{ fontSize: "0.72rem", opacity: 0.45, marginTop: "2px", paddingLeft: "21px" }}>
                                    {item.ownId || `#${item.customerId}`}
                                </p>
                            </div>

                            {/* Due amount + input + confirm */}
                            {item.isProcessed ? (
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <p style={{ fontSize: "0.7rem", opacity: 0.5 }}>Collected</p>
                                    <p style={{ fontWeight: 700, color: "var(--success)", fontSize: "1rem" }}>₹{parseFloat(item.collectedAmount).toLocaleString()}</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                                    <div style={{ textAlign: "right", marginRight: "0.25rem" }}>
                                        <p style={{ fontSize: "0.65rem", opacity: 0.5 }}>Due</p>
                                        <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>₹{parseFloat(item.amountToCollect).toLocaleString()}</p>
                                    </div>
                                    <input
                                        type="number" inputMode="numeric"
                                        className="input"
                                        placeholder={item.amountToCollect}
                                        value={amounts[item.loanId] || ""}
                                        onChange={e => setAmounts(prev => ({ ...prev, [item.loanId]: e.target.value }))}
                                        style={{ width: "90px", padding: "0.5rem 0.6rem", textAlign: "center" }}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        style={{ padding: "0.5rem 0.6rem", flexShrink: 0 }}
                                        disabled={saving === item.loanId}
                                        onClick={() => handleEntry(item.loanId, item.amountToCollect)}
                                    >
                                        {saving === item.loanId ? "…" : <ChevronRight size={18} />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
