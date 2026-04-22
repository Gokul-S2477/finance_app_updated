import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
    title: "Ganapathi Finance",
    description: "High Performance Finance Management",
    manifest: "/manifest.json",
    appleWebApp: {
        statusBarStyle: "black-translucent",
        title: "Ganapathi",
    },
};

export const viewport: Viewport = {
    themeColor: "#070b14",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/icon.png" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}
