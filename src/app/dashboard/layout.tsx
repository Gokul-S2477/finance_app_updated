"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [authorized, setAuthorized] = useState(false);
    const [dbReady, setDbReady] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const session = localStorage.getItem("ganapathi_session");
        if (session !== "true") {
            router.push("/");
        } else {
            setAuthorized(true);
            fetch("/api/init-db").finally(() => setDbReady(true));
        }
    }, [router]);

    if (!authorized) return null;

    return (
        <>
            <Navigation />
            <main className="main-content">
                {dbReady ? (
                    children
                ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", opacity: 0.5 }}>
                        Connecting to database…
                    </div>
                )}
            </main>
        </>
    );
}
