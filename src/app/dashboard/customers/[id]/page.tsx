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

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditing(true);
        await updateCustomer(Number(id), editForm);
        setEditing(false);
        setIsEditOpen(false);
        fetchData();
    };

    if (loading || !data) return <div style={{ padding: "3rem", opacity: 0.5, textAlign: "center" }}>Loading Profile...</div>;

    const { customer, activeLoan, collections, allLoans = [], allCollections = [] } = data;
    let canEditLoanAmount = false;
    if (activeLoan) {
        const createdAt = new Date(activeLoan.created_at);
        const diffDays = Math.ceil(Math.abs(new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        canEditLoanAmount = diffDays <= 2;
    }

    const loanAmount = activeLoan ? parseFloat(activeLoan.loan_amount) : 0;
    const totalCollected = collections.reduce((acc: number, c: any) => acc + parseFloat(c.amount_collected), 0);
    const pendingAmount = loanAmount - totalCollected;
    const remainingDays = activeLoan ? Math.max(0, Math.ceil((new Date(activeLoan.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

    const [expandedLoan, setExpandedLoan] = useState<number | null>(activeLoan ? activeLoan.id : null);

    return (
        <>
            <div className="animate-fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
                    <button className="btn" onClick={() => router.back()} style={{ background: "none", color: "rgba(255,255,255,0.6)", paddingLeft: 0 }}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn" style={{ background: "var(--input)", color: "white" }} onClick={() => setIsEditOpen(true)}><Edit size={16} /> Edit</button>
                        <button className="btn" style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--error)" }} onClick={async () => {
                            if (confirm("Delete this customer?")) { await deleteCustomer(Number(id)); router.push("/dashboard/customers"); }
                        }}><Trash2 size={16} /></button>
                    </div>
                </div>

                {/* Top Stats */}
                {activeLoan && (
                    <div className="responsive-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: "1.5rem", gap: "1rem" }}>
                        <div className="card" style={{ padding: "1rem", textAlign: "center" }}>
                            <p style={{ fontSize: "0.7rem", opacity: 0.6, marginBottom: "0.4rem" }}>Loan Amount</p>
                            <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--primary)" }}>₹{loanAmount.toLocaleString()}</p>
                        </div>
                        <div className="card" style={{ padding: "1rem", textAlign: "center" }}>
                            <p style={{ fontSize: "0.7rem", opacity: 0.6, marginBottom: "0.4rem" }}>Total Collected</p>
                            <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--success)" }}>₹{totalCollected.toLocaleString()}</p>
                        </div>
                        <div className="card" style={{ padding: "1rem", textAlign: "center" }}>
                            <p style={{ fontSize: "0.7rem", opacity: 0.6, marginBottom: "0.4rem" }}>Pending Amount</p>
                            <p style={{ fontSize: "1.2rem", fontWeight: 700, color: pendingAmount > 0 ? "var(--warning)" : "var(--success)" }}>₹{Math.max(0, pendingAmount).toLocaleString()}</p>
                        </div>
                        <div className="card" style={{ padding: "1rem", textAlign: "center" }}>
                            <p style={{ fontSize: "0.7rem", opacity: 0.6, marginBottom: "0.4rem" }}>Remaining Days</p>
                            <p style={{ fontSize: "1.2rem", fontWeight: 700 }}>{remainingDays} <span style={{fontSize: "0.8rem", fontWeight: 400}}>days</span></p>
                        </div>
                    </div>
                )}

                <div className="responsive-grid cols-2" style={{ marginBottom: "1.5rem" }}>
                    {/* Profile */}
                    <div className="card">
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.25rem" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <User size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: "1.1rem" }}>{customer.name}</h2>
                                <p style={{ fontSize: "0.75rem", opacity: 0.5 }}>ID: {customer.own_id || customer.id}</p>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
                            <div style={{ display: "flex", gap: "0.75rem" }}><Phone size={16} style={{ opacity: 0.4 }} /> {customer.mobile_no}</div>
                            <div style={{ display: "flex", gap: "0.75rem" }}><MapPin size={16} style={{ opacity: 0.4 }} /> {customer.address}</div>
                            <div style={{ display: "flex", gap: "0.75rem" }}><CreditCard size={16} style={{ opacity: 0.4 }} /> {customer.id_number} ({customer.id_proof})</div>
                        </div>
                    </div>

                    {/* Loan */}
                    <div className="card">
                        <h3 style={{ marginBottom: "1rem" }}>Loan Status</h3>
                        {activeLoan && activeLoan.status === "active" ? (
                            <>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                                    <div><p style={{ fontSize: "0.65rem", opacity: 0.5 }}>Loan Amount</p><p style={{ fontWeight: 600 }}>₹{parseFloat(activeLoan.loan_amount).toLocaleString()}</p></div>
                                    <div><p style={{ fontSize: "0.65rem", opacity: 0.5 }}>Interest (12%)</p><p style={{ fontWeight: 600 }}>₹{(parseFloat(activeLoan.loan_amount) * 0.12).toLocaleString()}</p></div>
                                    <div><p style={{ fontSize: "0.65rem", opacity: 0.5 }}>Duration</p><p style={{ fontWeight: 600 }}>100 Days</p></div>
                                    <div><p style={{ fontSize: "0.65rem", opacity: 0.5 }}>Ends On</p><p style={{ fontWeight: 600 }}>{format(new Date(activeLoan.end_date), "dd MMM yyyy")}</p></div>
                                </div>
                                <button className="btn" style={{ width: "100%", background: "rgba(239,68,68,0.1)", color: "var(--error)", border: "none" }} onClick={async () => {
                                    if (totalCollected < loanAmount) {
                                        alert("Cannot close loan. The full amount has not been collected yet.");
                                        return;
                                    }
                                    if (confirm("Close loan?")) { await closeLoan(activeLoan.id); fetchData(); }
                                }}><XCircle size={16} /> Close Loan</button>
                            </>
                        ) : (
                            <div style={{ textAlign: "center", padding: "1rem" }}>
                                <p style={{ opacity: 0.4, fontSize: "0.85rem", marginBottom: "0.75rem" }}>No active loan found.</p>
                                {!showNewLoan ? <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setShowNewLoan(true)}><PlusCircle size={16} /> New Loan</button>
                                    : <div style={{ display: "flex", gap: "0.5rem" }}><input type="number" className="input" value={newLoanAmount} onChange={e => setNewLoanAmount(e.target.value)} /><button className="btn btn-primary" onClick={async () => { await createNewLoanForCustomer(Number(id), newLoanAmount); setShowNewLoan(false); fetchData(); }}>Create</button></div>
                                }
                            </div>
                        )}
                    </div>
                </div>

                {/* History Accordions */}
                <h3 style={{ marginBottom: "1rem" }}>Collection History</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {allLoans.map((loan: any, lIndex: number) => {
                        const isExpanded = expandedLoan === loan.id || (expandedLoan === null && lIndex === 0);
                        const loanCollections = allCollections.filter((c: any) => c.loan_id === loan.id);
                        
                        let endDay = new Date();
                        if (loan.status === "closed") {
                            endDay = loan.closed_date ? new Date(loan.closed_date) : new Date(loan.end_date);
                        } else {
                            endDay = new Date() > new Date(loan.end_date) ? new Date() : new Date(loan.end_date);
                        }
                        
                        // Safety check in case dates are invalid or start > end
                        let daysForLoan = [];
                        try {
                             daysForLoan = eachDayOfInterval({ start: new Date(loan.start_date), end: endDay });
                        } catch(e) {
                             daysForLoan = [new Date(loan.start_date)];
                        }

                        let runningSum = 0;
                        const historyWithSums = daysForLoan.map(day => {
                            const coll = loanCollections.find((c: any) => isSameDay(new Date(c.payment_date), day));
                            const amt = coll ? parseFloat(coll.amount_collected) : 0;
                            runningSum += amt;
                            return { day, amt, runningSum, coll };
                        });

                        const reversedHistory = [...historyWithSums].reverse();

                        return (
                            <div key={loan.id} className="card" style={{ padding: "0" }}>
                                <div 
                                    style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderBottom: isExpanded ? "1px solid var(--border)" : "none" }}
                                    onClick={() => setExpandedLoan(isExpanded ? null : loan.id)}
                                >
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: "1rem" }}>Loan #{allLoans.length - lIndex} {loan.status === 'active' ? '(Active)' : '(Closed)'}</h4>
                                        <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.5 }}>{format(new Date(loan.start_date), "dd MMM yyyy")} - {loan.status === 'closed' ? "Closed" : "Present"}</p>
                                    </div>
                                    <div style={{ opacity: 0.5 }}>{isExpanded ? "▲" : "▼"}</div>
                                </div>
                                
                                {isExpanded && (
                                    <div style={{ padding: "1rem", overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead style={{ opacity: 0.5, fontSize: "0.75rem" }}>
                                                <tr>
                                                    <th style={{ textAlign: "left", paddingBottom: "1rem", whiteSpace: "nowrap" }}>Date</th>
                                                    <th style={{ textAlign: "center", paddingBottom: "1rem", whiteSpace: "nowrap" }}>Collected</th>
                                                    <th style={{ textAlign: "right", paddingBottom: "1rem", whiteSpace: "nowrap" }}>Running Sum</th>
                                                    <th style={{ textAlign: "right", paddingBottom: "1rem", whiteSpace: "nowrap" }}>Month Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reversedHistory.map((row, rIdx) => {
                                                    const originalIdx = daysForLoan.length - 1 - rIdx;
                                                    const isMonthEnd = originalIdx % 30 === 29 || originalIdx === daysForLoan.length - 1;
                                                    
                                                    return (
                                                        <tr key={originalIdx} style={{ fontSize: "0.85rem", borderBottom: "1px solid var(--border)" }}>
                                                            <td style={{ padding: "0.75rem 0", whiteSpace: "nowrap" }}>{format(row.day, "dd MMM")}</td>
                                                            <td style={{ textAlign: "center" }}>
                                                                {row.coll ? (
                                                                    <span style={{ color: "var(--success)", fontWeight: 600 }}>₹{row.amt.toLocaleString()}</span>
                                                                ) : (
                                                                    <span style={{ opacity: 0.2 }}>-</span>
                                                                )}
                                                            </td>
                                                            <td style={{ textAlign: "right", opacity: 0.8 }}>₹{row.runningSum.toLocaleString()}</td>
                                                            <td style={{ textAlign: "right", fontWeight: isMonthEnd ? 700 : 400, color: isMonthEnd ? "var(--primary)" : "inherit" }}>
                                                                {isMonthEnd ? `₹${row.runningSum.toLocaleString()}` : ""}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {reversedHistory.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} style={{ textAlign: "center", padding: "1rem", opacity: 0.5 }}>No history yet.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Edit Sheet (Outside animated div) */}
            <div className={`sheet-overlay ${isEditOpen ? "open" : ""}`} onClick={e => e.target === e.currentTarget && setIsEditOpen(false)}>
                <div className="sheet-content">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h2>Edit Profile</h2>
                        <button onClick={() => setIsEditOpen(false)} style={{ background: "none", border: "none", color: "white" }}><XCircle size={24} /></button>
                    </div>
                    <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <div><label>NAME</label><input type="text" className="input" required value={editForm?.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                        <div className="responsive-grid cols-2">
                            <div><label>OWN ID</label><input type="text" className="input" value={editForm?.ownId} onChange={e => setEditForm({ ...editForm, ownId: e.target.value })} /></div>
                            <div><label>MOBILE</label><input type="tel" className="input" required value={editForm?.mobile} onChange={e => setEditForm({ ...editForm, mobile: e.target.value })} /></div>
                        </div>
                        <div><label>ADDRESS</label><textarea className="input" required value={editForm?.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} rows={2} /></div>
                        <div className="responsive-grid cols-2">
                            <div><label>ID PROOF</label><select className="input" value={editForm?.idProof} onChange={e => setEditForm({ ...editForm, idProof: e.target.value })}><option value="Aadhar">Aadhar</option><option value="PAN">PAN</option></select></div>
                            <div><label>ID NUMBER</label><input type="text" className="input" required value={editForm?.idNumber} onChange={e => setEditForm({ ...editForm, idNumber: e.target.value })} /></div>
                        </div>
                        <div><label>LOAN AMOUNT (Limit: 2 days)</label><input type="number" className="input" disabled={!canEditLoanAmount} value={editForm?.loanAmount} onChange={e => setEditForm({ ...editForm, loanAmount: e.target.value })} style={{ opacity: canEditLoanAmount ? 1 : 0.5 }} /></div>
                        <button type="submit" className="btn btn-primary" style={{ padding: "1rem" }} disabled={editing}>{editing ? "Saving..." : "Update ✓"}</button>
                    </form>
                </div>
            </div>
        </>
    );
}
