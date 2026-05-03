import type { Metadata } from "next";
import "./globals.css";
import { DM_Sans, Inter } from "next/font/google";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Flint",
  icons: {
    icon: [
      { url: "/flint-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/flint-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/flint-icon-512.png",
  },
  description: "The open payment request protocol for Solana. Human-shareable. Agent-executable.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Flint — Programmable Payments on Solana",
    description: "Create shareable payment requests. Pay with any Solana wallet. Receipts on-chain.",
    url: "https://flint-rust.vercel.app",
    siteName: "Flint",
    type: "website",
    images: [{ url: "https://flint-rust.vercel.app/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flint — Programmable Payments on Solana",
    description: "Create shareable payment requests. Pay with any Solana wallet. Receipts on-chain.",
    images: ["https://flint-rust.vercel.app/api/og"],
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
      className={`${dmSans.variable} ${inter.variable} h-full antialiased`}
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