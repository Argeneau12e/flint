"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface ReceiptData {
  id: string;
  title: string;
  amount: number;
  token: string;
  memo: string;
  recipientWallet: string;
  payerWallet: string;
  txSignature: string;
  paidAt: number;
  network: string;
  explorerUrl: string;
}

export default function VerifyPage() {
  const params = useParams();
  const router = useRouter();
  const signature = params.signature as string;
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const findReceipt = async () => {
      try {
        const res = await fetch(`/api/verify?signature=${signature}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        if (data.txSignature) {
          setReceipt(data);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    findReceipt();
  }, [signature]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p style={{ color: "#888888" }}>Verifying payment...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl"
            style={{ background: "#1a0a0a", border: "1px solid #3a0a0a" }}
          >
            ?
          </div>
          <h1 className="text-xl font-medium mb-2" style={{ color: "var(--chalk)" }}>
            Receipt not found
          </h1>
          <p className="text-sm mb-6" style={{ color: "#888888" }}>
            This transaction signature was not found in the Flint receipt registry.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl text-white text-sm font-medium"
            style={{ background: "var(--spark)" }}
          >
            Back to Flint
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full">

        <div className="flex items-center justify-center gap-2 mb-8">
          <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
            <polygon points="32,6 54,18 54,46 32,58 10,46 10,18"
              stroke="white" strokeWidth="2.5" fill="none" />
            <polyline points="48,8 60,8 60,20"
              stroke="#FF6B2B" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <rect x="24" y="24" width="6" height="20" rx="2" fill="white" />
            <rect x="30" y="24" width="14" height="6" rx="2" fill="white" />
            <rect x="30" y="34" width="10" height="5" rx="2" fill="white" />
          </svg>
          <span className="text-sm font-medium tracking-widest"
            style={{ color: "#888888" }}>FLINT</span>
        </div>

        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"
            style={{ background: "#0a1a0a", border: "2px solid #4ade80" }}
          >
            ✓
          </div>
          <h1 className="text-2xl font-medium mb-1" style={{ color: "#4ade80" }}>
            Payment Verified
          </h1>
          <p className="text-sm" style={{ color: "#888888" }}>
            This payment is confirmed on the Solana blockchain
          </p>
        </div>

        <div
          className="rounded-2xl p-6 mb-4"
          style={{ background: "#111111", border: "1px solid #1f1f1f" }}
        >
          <p className="text-xs mb-4" style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Receipt Details
          </p>
          <div className="flex flex-col gap-3">
            {receipt?.title && (
              <div className="flex justify-between">
                <p className="text-sm" style={{ color: "#555555" }}>Invoice</p>
                <p className="text-sm" style={{ color: "var(--chalk)" }}>{receipt.title}</p>
              </div>
            )}
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>Amount</p>
              <p className="text-sm font-medium" style={{ color: "#4ade80" }}>
                {receipt?.amount} {receipt?.token}
              </p>
            </div>
            {receipt?.memo && (
              <div className="flex justify-between">
                <p className="text-sm" style={{ color: "#555555" }}>Memo</p>
                <p className="text-sm" style={{ color: "var(--chalk)" }}>{receipt.memo}</p>
              </div>
            )}
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>From</p>
              <p className="text-sm font-mono" style={{ color: "var(--chalk)" }}>
                {receipt?.payerWallet?.slice(0, 4)}...{receipt?.payerWallet?.slice(-4)}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>To</p>
              <p className="text-sm font-mono" style={{ color: "var(--chalk)" }}>
                {receipt?.recipientWallet?.slice(0, 4)}...{receipt?.recipientWallet?.slice(-4)}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>Date</p>
              <p className="text-sm" style={{ color: "var(--chalk)" }}>
                {receipt?.paidAt ? new Date(receipt.paidAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric"
                }) : "Unknown"}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>Network</p>
              <p className="text-sm" style={{ color: "#4ade80" }}>Solana Devnet</p>
            </div>
            <div style={{ borderTop: "1px solid #1f1f1f", paddingTop: "12px" }}>
              <p className="text-xs mb-2" style={{ color: "#555555" }}>Transaction Signature</p>
              <p className="text-xs font-mono break-all" style={{ color: "var(--spark)" }}>
                {receipt?.txSignature}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.open(
            `https://explorer.solana.com/tx/${receipt?.txSignature}?cluster=devnet`,
            "_blank"
          )}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 mb-3"
          style={{ background: "#111111", border: "1px solid #1f1f1f", color: "var(--chalk)" }}
        >
          View on Solana Explorer
        </button>

        <button
          onClick={() => router.push("/")}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
          style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#888888" }}
        >
          Back to Flint
        </button>

        <p className="text-center text-xs mt-6" style={{ color: "#333333" }}>
          Powered by Flint · Verified on Solana
        </p>
      </div>
    </main>
  );
}