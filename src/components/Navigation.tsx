"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LayoutDashboard, CalendarCheck, LogOut, Trash2, Wallet } from "lucide-react";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Customers", href: "/dashboard/customers", icon: Users },
    { name: "Collection", href: "/dashboard/collection", icon: CalendarCheck },
    { name: "Ledger", href: "/dashboard/ledger", icon: Wallet },
    { name: "Deleted", href: "/dashboard/deleted", icon: Trash2 },
];

export default function Navigation() {
    const pathname = usePathname();

    const logout = () => {
        localStorage.removeItem("ganapathi_session");
        window.location.href = "/";
    };

    const NavItem = ({ item }: { item: typeof navItems[0] }) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
            <Link
                href={item.href}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.65rem 1rem",
                    borderRadius: "12px",
                    background: active ? "var(--primary)" : "transparent",
                    color: active ? "white" : "rgba(255,255,255,0.65)",
                    fontWeight: active ? 600 : 400,
                    fontSize: "0.9rem",
                    transition: "all 0.15s ease",
                }}
            >
                <Icon size={20} />
                <span>{item.name}</span>
            </Link>
        );
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <nav className="sidebar">
                <div style={{ marginBottom: "2.5rem", paddingLeft: "0.5rem" }}>
                    <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)" }}>Ganapathi</p>
                    <p style={{ fontSize: "0.75rem", opacity: 0.45, marginTop: "2px" }}>Finance Management</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                    {navItems.map((item) => <NavItem key={item.href} item={item} />)}
                </div>

                <button
                    onClick={logout}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.65rem 1rem",
                        borderRadius: "12px",
                        border: "none",
                        background: "rgba(239, 68, 68, 0.12)",
                        color: "var(--error)",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        width: "100%",
                        transition: "all 0.15s ease",
                    }}
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </nav>

            {/* Mobile Bottom Navigation */}
            <nav className="bottom-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "4px",
                                color: active ? "var(--primary)" : "rgba(255,255,255,0.45)",
                                fontSize: "0.65rem",
                                fontWeight: active ? 600 : 400,
                                minWidth: "60px",
                            }}
                        >
                            <Icon size={22} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
                <button
                    onClick={logout}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                        background: "none",
                        border: "none",
                        color: "rgba(239, 68, 68, 0.8)",
                        fontSize: "0.65rem",
                        cursor: "pointer",
                        minWidth: "60px",
                    }}
                >
                    <LogOut size={22} />
                    <span>Logout</span>
                </button>
            </nav>
        </>
    );
}
