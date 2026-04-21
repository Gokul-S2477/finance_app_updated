import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
    title: "Ganapathi Finance",
    description: "Daily Collection & Loan Management",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
