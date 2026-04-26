import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const dmMono = DM_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Flint — Programmable Payments on Solana",
  description: "The open payment request protocol for Solana. Human-shareable. Agent-executable.",
  manifest: "/manifest.json",
  themeColor: "#FF6B2B",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Flint",
  },
  openGraph: {
    title: "Flint — Programmable Payments on Solana",
    description: "Create shareable payment requests. Pay with any Solana wallet. Receipts on-chain.",
    url: "https://flint-rust.vercel.app",
    siteName: "Flint",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flint — Programmable Payments on Solana",
    description: "Create shareable payment requests. Pay with any Solana wallet. Receipts on-chain.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B2B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Flint" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}