"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const session = localStorage.getItem("ganapathi_session");
        if (session === "true") {
            router.push("/dashboard");
        }
    }, [router]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (userId === "agr" && password === "2477") {
            localStorage.setItem("ganapathi_session", "true");
            router.push("/dashboard");
        } else {
            setError("Invalid ID or Password");
        }
    };

    return (
        <div className="flex-center animate-fade-in" style={{ minHeight: "100vh" }}>
            <div className="card glass" style={{ width: "90%", maxWidth: "400px", textAlign: "center" }}>
                <div style={{ marginBottom: "2rem" }}>
                    <Image
                        src="/logo.png"
                        alt="Ganapathi Finance Logo"
                        width={120}
                        height={120}
                        style={{ borderRadius: "50%", border: "2px solid var(--primary)" }}
                        priority
                    />
                    <h1 style={{ marginTop: "1rem", fontSize: "1.5rem", letterSpacing: "1px" }}>GANAPATHI FINANCE</h1>
                </div>

                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                    <div style={{ textAlign: "left" }}>
                        <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.4rem", display: "block" }}>User ID</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Enter ID"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ textAlign: "left" }}>
                        <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.4rem", display: "block" }}>Password</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p style={{ color: "var(--error)", fontSize: "0.9rem" }}>{error}</p>}

                    <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                        LOGIN
                    </button>
                </form>
            </div>
        </div>
    );
}
