"use client";

import { useState, useEffect } from "react";
import { Trash2, RotateCcw, User, Search } from "lucide-react";
import { getDeletedCustomers, restoreCustomer } from "@/db/actions";
import { format } from "date-fns";

export default function DeletedPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchDeleted();
    }, []);

    const fetchDeleted = async () => {
        setLoading(true);
        const data = await getDeletedCustomers();
        setCustomers(data);
        setLoading(false);
    };

    const handleRestore = async (id: number) => {
        if (confirm("Restore this customer?")) {
            await restoreCustomer(id);
            fetchDeleted();
        }
    };

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.own_id && c.own_id.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: "2rem" }}>
                <h1>Archive (Deleted)</h1>
                <p style={{ opacity: 0.5, fontSize: "0.9rem" }}>Viewing deleted customer records. You can restore them if needed.</p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.6rem 1rem", marginBottom: "2rem" }}>
                <Search size={18} style={{ opacity: 0.4, flexShrink: 0 }} />
                <input type="text" placeholder="Search deleted records…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ border: "none", background: "none", outline: "none", color: "white", width: "100%", fontSize: "0.95rem" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {loading ? (
                    <p style={{ textAlign: "center", opacity: 0.5 }}>Loading archive…</p>
                ) : filtered.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "4rem", opacity: 0.5 }}>
                        <Trash2 size={48} style={{ margin: "0 auto 1.5rem", opacity: 0.2 }} />
                        <p>No deleted customers found.</p>
                    </div>
                ) : filtered.map((c: any) => (
                    <div key={c.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", opacity: 0.8 }}>
                        <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <User size={24} style={{ opacity: 0.5 }} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: "1.1rem" }}>{c.name}</h3>
                                <p style={{ fontSize: "0.8rem", opacity: 0.5, marginTop: "2px" }}>ID: {c.own_id || c.id}</p>
                                <p style={{ fontSize: "0.7rem", opacity: 0.4, marginTop: "4px" }}>Deleted on: {c.deleted_at ? format(new Date(c.deleted_at), "dd MMM yyyy HH:mm") : "Unknown"}</p>
                            </div>
                        </div>
                        <button className="btn" onClick={() => handleRestore(c.id)} style={{ background: "var(--input)", color: "var(--success)", border: "none" }}>
                            <RotateCcw size={18} />
                            <span className="desktop-only text-white">Restore</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
