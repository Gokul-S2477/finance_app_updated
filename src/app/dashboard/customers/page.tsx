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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>Customers</h1>
                <button className="btn btn-primary" onClick={() => setIsSheetOpen(true)}>
                    <Plus size={18} /> Add Customer
                </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.6rem 1rem", marginBottom: "2rem" }}>
                <Search size={18} style={{ opacity: 0.4, flexShrink: 0 }} />
                <input type="text" placeholder="Search by ID or Name…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ border: "none", background: "none", outline: "none", color: "white", width: "100%", fontSize: "0.95rem" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>Connecting to database…</div>
                ) : customersList.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "4rem", opacity: 0.5 }}>
                        <User size={48} style={{ margin: "0 auto 1.5rem", opacity: 0.2 }} />
                        <p>No customers found. Start by adding one!</p>
                    </div>
                ) : customersList.map((c: any) => (
                    <div key={c.id} className="card" style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem" }}
                        onClick={() => window.location.href = `/dashboard/customers/${c.id}`}>
                        <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <User size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: "1.1rem" }}>{c.name}</h3>
                                <p style={{ fontSize: "0.8rem", opacity: 0.5, marginTop: "2px" }}>ID: {c.own_id || c.id}</p>
                            </div>
                        </div>
                        <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: "1.5rem" }}>
                            <div style={{ display: "none" }} className="desktop-only text-right">
                                <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>{c.mobile_no}</p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                {c.status ? <CheckCircle2 color="var(--success)" size={18} /> : <XCircle color="var(--error)" size={18} />}
                                <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{c.status ? "Active" : "Inactive"}</span>
                            </div>
                            <ArrowRight size={18} style={{ opacity: 0.2 }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── ADD CUSTOMER SIDE SHEET ── */}
            <div className={`sheet-overlay ${isSheetOpen ? "open" : ""}`} onClick={e => e.target === e.currentTarget && setIsSheetOpen(false)}>
                <div className="sheet-content">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
                        <div>
                            <h2 style={{ fontSize: "1.5rem" }}>Add New Customer</h2>
                            <p style={{ fontSize: "0.85rem", opacity: 0.5, marginTop: "4px" }}>Fill in the details to create a new loan</p>
                        </div>
                        <button onClick={() => setIsSheetOpen(false)}
                            style={{ background: "var(--input)", border: "none", color: "white", padding: "0.5rem", borderRadius: "10px", cursor: "pointer" }}>
                            <XCircle size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleAddCustomer} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div>
                            <label>FULL NAME *</label>
                            <input type="text" className="input" required value={form.name} onChange={e => updateField("name", e.target.value)} placeholder="e.g. Rahul Kumar" />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1rem" }}>
                            <div>
                                <label>OWN ID (OPTIONAL)</label>
                                <input type="text" className="input" value={form.ownId} onChange={e => updateField("ownId", e.target.value)} placeholder="ID" />
                            </div>
                            <div>
                                <label>MOBILE NUMBER *</label>
                                <input type="tel" className="input" required value={form.mobile} onChange={e => updateField("mobile", e.target.value)} placeholder="10-digit mobile" />
                            </div>
                        </div>

                        <div>
                            <label>FULL ADDRESS *</label>
                            <textarea className="input" required value={form.address} onChange={e => updateField("address", e.target.value)} placeholder="Complete home/work address" rows={3} style={{ resize: "none" }} />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                                <label>ID PROOF TYPE *</label>
                                <select className="input" value={form.idProof} onChange={e => updateField("idProof", e.target.value)}>
                                    <option value="Aadhar">Aadhar Card</option>
                                    <option value="PAN">PAN Card</option>
                                    <option value="VoterID">Voter ID</option>
                                    <option value="DrivingLicense">Driving License</option>
                                </select>
                            </div>
                            <div>
                                <label>ID NUMBER *</label>
                                <input type="text" className="input" required value={form.idNumber} onChange={e => updateField("idNumber", e.target.value)} placeholder="Enter ID digits" />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                                <label>DATE OF BIRTH *</label>
                                <input type="date" className="input" required value={form.dob} onChange={e => updateField("dob", e.target.value)} />
                            </div>
                            <div>
                                <label>LOAN AMOUNT (₹) *</label>
                                <input type="number" className="input" required min="1" value={form.loanAmount} onChange={e => updateField("loanAmount", e.target.value)} />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                                <label>START DATE *</label>
                                <input type="date" className="input" required value={form.startDate} onChange={e => updateField("startDate", e.target.value)} />
                            </div>
                            <div>
                                <label>END DATE (100 DAYS)</label>
                                <input type="text" className="input" disabled value={endDate} />
                            </div>
                        </div>

                        {loanAmt > 0 && (
                            <div style={{ background: "var(--input)", borderRadius: "12px", padding: "1.25rem", border: "1px solid var(--border)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "0.85rem", opacity: 0.5 }}>Starting Loan:</span>
                                    <span style={{ fontWeight: 600 }}>₹{loanAmt.toLocaleString()}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "0.85rem", opacity: 0.5 }}>Given (Cash In Hand):</span>
                                    <span style={{ fontWeight: 700, color: "var(--warning)" }}>₹{(loanAmt * 0.88).toLocaleString()}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: "0.85rem", opacity: 0.5 }}>Expected Profit:</span>
                                    <span style={{ fontWeight: 700, color: "var(--success)" }}>₹{(loanAmt * 0.12).toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", paddingBottom: "2rem" }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: "1rem" }} disabled={saving}>
                                {saving ? "SAVING..." : "CREATE CUSTOMER ✓"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
        @media (min-width: 1024px) {
          .desktop-only { display: block !important; }
        }
      `}</style>
        </div>
    );
}
