"use client";

import { useState, useEffect } from "react";
import { Plus, Search, User, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { getCustomers, createCustomer } from "@/db/actions";
import { format, addDays } from "date-fns";

export default function CustomersPage() {
    const [customersList, setCustomersList] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const blankForm = { ownId: "", name: "", address: "", idProof: "Aadhar", idNumber: "", dob: "", mobile: "", loanAmount: "10000", startDate: format(new Date(), "yyyy-MM-dd") };
    const [form, setForm] = useState(blankForm);
    const updateField = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    useEffect(() => { loadCustomers(); }, [search]);

    const loadCustomers = async () => {
        setLoading(true);
        const data = await getCustomers(search);
        setCustomersList(data as any[]);
        setLoading(false);
    };

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await createCustomer(form);
        setSaving(false);
        setIsSheetOpen(false);
        setForm(blankForm);
        loadCustomers();
    };

    const endDate = form.startDate ? format(addDays(new Date(form.startDate), 100), "dd MMM yyyy") : "";
    const loanAmt = parseFloat(form.loanAmount || "0");

    return (
        <div className="animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
                <h1>Customers</h1>
                <button className="btn btn-primary" onClick={() => setIsSheetOpen(true)}>
                    <Plus size={18} /> <span className="hide-on-mobile">Add Customer</span><span className="show-on-mobile">Add</span>
                </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.6rem 1rem", marginBottom: "1.5rem" }}>
                <Search size={18} style={{ opacity: 0.4, flexShrink: 0 }} />
                <input type="text" placeholder="Search by ID or Name…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ border: "none", background: "none", outline: "none", color: "white", width: "100%", fontSize: "0.95rem" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>Connecting…</div>
                ) : customersList.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>
                        <User size={40} style={{ margin: "0 auto 1rem", opacity: 0.2 }} />
                        <p>No customers found.</p>
                    </div>
                ) : customersList.map((c: any) => (
                    <div key={c.id} className="card" style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem" }}
                        onClick={() => window.location.href = `/dashboard/customers/${c.id}`}>
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center", minWidth: 0 }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <User size={20} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <h3 style={{ fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</h3>
                                <p style={{ fontSize: "0.75rem", opacity: 0.5 }}>{c.own_id || `#${c.id}`}</p>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                {c.status ? <CheckCircle2 color="var(--success)" size={16} /> : <XCircle color="var(--error)" size={16} />}
                                <span style={{ fontSize: "0.8rem", fontWeight: 500 }} className="hide-on-small">{c.status ? "Active" : "Inactive"}</span>
                            </div>
                            <ArrowRight size={16} style={{ opacity: 0.2 }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── ADD CUSTOMER SIDE SHEET ── */}
            <div className={`sheet-overlay ${isSheetOpen ? "open" : ""}`} onClick={e => e.target === e.currentTarget && setIsSheetOpen(false)}>
                <div className="sheet-content">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h2 style={{ fontSize: "1.25rem" }}>Add Customer</h2>
                        <button onClick={() => setIsSheetOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
                            <XCircle size={24} style={{ opacity: 0.5 }} />
                        </button>
                    </div>

                    <form onSubmit={handleAddCustomer} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <div>
                            <label>FULL NAME *</label>
                            <input type="text" className="input" required value={form.name} onChange={e => updateField("name", e.target.value)} placeholder="Enter name" />
                        </div>

                        <div className="responsive-grid cols-2">
                            <div>
                                <label>OWN ID (OPTIONAL)</label>
                                <input type="text" className="input" value={form.ownId} onChange={e => updateField("ownId", e.target.value)} placeholder="ID" />
                            </div>
                            <div>
                                <label>MOBILE NUMBER *</label>
                                <input type="tel" className="input" required value={form.mobile} onChange={e => updateField("mobile", e.target.value)} placeholder="10-digit number" />
                            </div>
                        </div>

                        <div>
                            <label>FULL ADDRESS *</label>
                            <textarea className="input" required value={form.address} onChange={e => updateField("address", e.target.value)} placeholder="Complete address" rows={2} style={{ resize: "none" }} />
                        </div>

                        <div className="responsive-grid cols-2">
                            <div>
                                <label>ID PROOF *</label>
                                <select className="input" value={form.idProof} onChange={e => updateField("idProof", e.target.value)}>
                                    <option value="Aadhar">Aadhar</option>
                                    <option value="PAN">PAN</option>
                                </select>
                            </div>
                            <div>
                                <label>ID NUMBER *</label>
                                <input type="text" className="input" required value={form.idNumber} onChange={e => updateField("idNumber", e.target.value)} placeholder="ID number" />
                            </div>
                        </div>

                        <div className="responsive-grid cols-2">
                            <div>
                                <label>DATE OF BIRTH *</label>
                                <input type="date" className="input" required value={form.dob} onChange={e => updateField("dob", e.target.value)} />
                            </div>
                            <div>
                                <label>LOAN AMOUNT (₹) *</label>
                                <input type="number" className="input" required min="1" value={form.loanAmount} onChange={e => updateField("loanAmount", e.target.value)} />
                            </div>
                        </div>

                        <div className="responsive-grid cols-2">
                            <div>
                                <label>START DATE *</label>
                                <input type="date" className="input" required value={form.startDate} onChange={e => updateField("startDate", e.target.value)} />
                            </div>
                            <div>
                                <label>END DATE</label>
                                <input type="text" className="input" disabled value={endDate} />
                            </div>
                        </div>

                        <div style={{ background: "var(--input)", borderRadius: "12px", padding: "1rem", border: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>Given (Cash In Hand):</span>
                                <span style={{ fontWeight: 600, color: "var(--warning)" }}>₹{(loanAmt * 0.88).toLocaleString()}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>Profit (12%):</span>
                                <span style={{ fontWeight: 600, color: "var(--success)" }}>₹{(loanAmt * 0.12).toLocaleString()}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: "0.5rem" }}>
                            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "1rem" }} disabled={saving}>
                                {saving ? "SAVING..." : "CREATE CUSTOMER"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
        @media (max-width: 480px) {
          .hide-on-mobile { display: none; }
          .show-on-mobile { display: inline; }
          .hide-on-small { display: none; }
        }
        @media (min-width: 481px) {
          .show-on-mobile { display: none; }
        }
      `}</style>
        </div>
    );
}
