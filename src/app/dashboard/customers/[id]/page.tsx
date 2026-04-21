"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCustomerDetails, closeLoan, createNewLoanForCustomer, updateCustomer, deleteCustomer } from "@/db/actions";
import { format, eachDayOfInterval, isSameDay } from "date-fns";
import { ArrowLeft, User, Phone, MapPin, Calendar, CreditCard, CheckCircle, XCircle, PlusCircle, Edit, Trash2 } from "lucide-react";

export default function CustomerDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [newLoanAmount, setNewLoanAmount] = useState("10000");
    const [showNewLoan, setShowNewLoan] = useState(false);

    // Edit Sheet State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>(null);

    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const d = await getCustomerDetails(Number(id));
        setData(d);
        if (d && d.customer) {
            setEditForm({
                name: d.customer.name,
                ownId: d.customer.own_id || "",
                mobile: d.customer.mobile_no,
                address: d.customer.address,
                idProof: d.customer.id_proof,
                idNumber: d.customer.id_number,
                dob: d.customer.dob ? format(new Date(d.customer.dob), "yyyy-MM-dd") : "",
                loanAmount: d.activeLoan ? d.activeLoan.loan_amount.toString() : ""
            });
        }
        setLoading(false);
    };

    const handleCloseAccount = async () => {
        if (!confirm("Close this loan account? This cannot be undone.")) return;
        await closeLoan(data.activeLoan.id);
        fetchData();
    };

    const handleNewLoan = async () => {
        await createNewLoanForCustomer(Number(id), newLoanAmount);
        setShowNewLoan(false);
        fetchData();
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this customer? They will be moved to the archive.")) {
            await deleteCustomer(Number(id));
            router.push("/dashboard/customers");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditing(true);
        await updateCustomer(Number(id), editForm);
        setEditing(false);
        setIsEditOpen(false);
        fetchData();
    };

    if (loading || !data) return (
        <div style={{ padding: "2rem", opacity: 0.5, textAlign: "center" }}>Loading customer details…</div>
    );

    const { customer, activeLoan, collections } = data;

    // Calculate if loan amount is editable (within 2 days)
    let canEditLoanAmount = false;
    if (activeLoan) {
        const createdAt = new Date(activeLoan.created_at);
        const diffDays = Math.ceil(Math.abs(new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        canEditLoanAmount = diffDays <= 2;
    }

    const historyDays = activeLoan ? eachDayOfInterval({
        start: new Date(activeLoan.start_date),
        end: new Date(),
    }).reverse() : [];

    const InfoRow = ({ icon: Icon, text }: { icon: any; text: string }) => (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", fontSize: "0.9rem" }}>
            <Icon size={16} style={{ opacity: 0.45, marginTop: "2px", flexShrink: 0 }} />
            <span>{text}</span>
        </div>
    );

    return (
        <div className="animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <button className="btn" onClick={() => router.back()} style={{ background: "none", color: "rgba(255,255,255,0.7)", paddingLeft: 0 }}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn" style={{ background: "var(--input)", color: "white" }} onClick={() => setIsEditOpen(true)}>
                        <Edit size={16} /> Edit
                    </button>
                    <button className="btn" style={{ background: "rgba(239, 68, 68, 0.12)", color: "var(--error)" }} onClick={handleDelete}>
                        <Trash2 size={16} /> Delete
                    </button>
                </div>
            </div>

            {/* Top grid: customer info + loan */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                <div className="card">
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.25rem" }}>
                        <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <User size={26} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: "1.2rem" }}>{customer.name}</h2>
                            <p style={{ fontSize: "0.75rem", opacity: 0.45 }}>ID: {customer.own_id || customer.id}</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                        <InfoRow icon={Phone} text={customer.mobile_no} />
                        <InfoRow icon={MapPin} text={customer.address} />
                        <InfoRow icon={CreditCard} text={`${customer.id_proof}: ${customer.id_number}`} />
                        <InfoRow icon={Calendar} text={`DOB: ${customer.dob ? format(new Date(customer.dob), "dd MMM yyyy") : "-"}`} />
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: "1rem" }}>Loan Status</h3>
                    {activeLoan && activeLoan.status === "active" ? (
                        <>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                                {[
                                    ["Loan Amount", `₹${parseFloat(activeLoan.loan_amount).toLocaleString()}`],
                                    ["Given Amount", `₹${parseFloat(activeLoan.given_amount).toLocaleString()}`],
                                    ["Start Date", format(new Date(activeLoan.start_date), "dd MMM yyyy")],
                                    ["End Date", format(new Date(activeLoan.end_date), "dd MMM yyyy")],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <p style={{ fontSize: "0.68rem", opacity: 0.5 }}>{label}</p>
                                        <p style={{ fontWeight: 600, marginTop: "2px" }}>{value}</p>
                                    </div>
                                ))}
                            </div>
                            <button className="btn" style={{ width: "100%", background: "rgba(239,68,68,0.1)", color: "var(--error)", border: "none", fontWeight: 700 }} onClick={handleCloseAccount}>
                                <XCircle size={16} /> CLOSE ACCOUNT
                            </button>
                        </>
                    ) : (
                        <div>
                            <p style={{ opacity: 0.5, marginBottom: "1rem", fontSize: "0.9rem" }}>No active loan.</p>
                            {!showNewLoan ? (
                                <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setShowNewLoan(true)}>
                                    <PlusCircle size={16} /> New Loan
                                </button>
                            ) : (
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <input type="number" className="input" value={newLoanAmount} onChange={e => setNewLoanAmount(e.target.value)} placeholder="Amount" />
                                    <button className="btn btn-primary" onClick={handleNewLoan}>Create</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Collection History */}
            <div className="card">
                <h3 style={{ marginBottom: "1.25rem" }}>Collection History</h3>
                {historyDays.length === 0 ? (
                    <p style={{ opacity: 0.5, textAlign: "center", padding: "2rem" }}>No history yet.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table>
                            <thead>
                                <tr style={{ fontSize: "0.78rem" }}>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: "right" }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyDays.map((day, idx) => {
                                    const coll = collections.find((c: any) => isSameDay(new Date(c.payment_date), day));
                                    return (
                                        <tr key={idx}>
                                            <td style={{ fontSize: "0.875rem" }}>{format(day, "dd MMM yyyy")}</td>
                                            <td>{coll ? <CheckCircle size={15} color="var(--success)" /> : <span style={{ opacity: 0.2 }}>-</span>}</td>
                                            <td style={{ textAlign: "right", fontSize: "0.875rem" }}>{coll ? `₹${parseFloat(coll.amount_collected).toLocaleString()}` : ""}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── EDIT SIDE SHEET ── */}
            <div className={`sheet-overlay ${isEditOpen ? "open" : ""}`} onClick={e => e.target === e.currentTarget && setIsEditOpen(false)}>
                <div className="sheet-content">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                        <h2>Edit Customer</h2>
                        <button onClick={() => setIsEditOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><XCircle size={24} /></button>
                    </div>

                    <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <div>
                            <label>FULL NAME</label>
                            <input type="text" className="input" required value={editForm?.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                                <label>OWN ID</label>
                                <input type="text" className="input" value={editForm?.ownId} onChange={e => setEditForm({ ...editForm, ownId: e.target.value })} />
                            </div>
                            <div>
                                <label>MOBILE</label>
                                <input type="tel" className="input" required value={editForm?.mobile} onChange={e => setEditForm({ ...editForm, mobile: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label>ADDRESS</label>
                            <textarea className="input" required value={editForm?.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} rows={2} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                                <label>ID PROOF</label>
                                <select className="input" value={editForm?.idProof} onChange={e => setEditForm({ ...editForm, idProof: e.target.value })}>
                                    <option value="Aadhar">Aadhar</option>
                                    <option value="PAN">PAN</option>
                                </select>
                            </div>
                            <div>
                                <label>ID NUMBER</label>
                                <input type="text" className="input" required value={editForm?.idNumber} onChange={e => setEditForm({ ...editForm, idNumber: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label>LOAN AMOUNT (Only within 2 days of creation)</label>
                            <input
                                type="number"
                                className="input"
                                disabled={!canEditLoanAmount}
                                value={editForm?.loanAmount}
                                onChange={e => setEditForm({ ...editForm, loanAmount: e.target.value })}
                                style={{ opacity: canEditLoanAmount ? 1 : 0.5 }}
                            />
                            {!canEditLoanAmount && <p style={{ fontSize: "0.7rem", color: "var(--warning)", marginTop: "4px" }}>Editing locked (Limit: 2 days)</p>}
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem", padding: "1rem" }} disabled={editing}>
                            {editing ? "SAVING..." : "UPDATE PROFILE ✓"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
