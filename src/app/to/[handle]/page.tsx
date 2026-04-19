"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Invoice {
  id: string;
  title: string;
  amount: number;
  token: string;
  memo: string;
  recipientWallet: string;
  expiresAt: number;
  status: string;
  handle?: string;
}

export default function HandlePage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoice/create?handle=${handle}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        if (data.id) {
          setInvoice(data);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [handle]);

  const isExpired = invoice ? Date.now() > invoice.expiresAt : false;
  const isActive = invoice && invoice.status === "pending" && !isExpired;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-2" style={{ color: "var(--chalk)" }}>
            flint.pay/{handle}
          </p>
          <p className="text-sm" style={{ color: "#888888" }}>
            Loading...
          </p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          >
            <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
              <polygon points="32,6 54,18 54,46 32,58 10,46 10,18"
                stroke="white" strokeWidth="2.5" fill="none" />
              <polyline points="48,8 60,8 60,20"
                stroke="#FF6B2B" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <rect x="24" y="24" width="6" height="20" rx="2" fill="white" />
              <rect x="30" y="24" width="14" height="6" rx="2" fill="white" />
              <rect x="30" y="34" width="10" height="5" rx="2" fill="white" />
            </svg>
          </div>
          <h1 className="text-2xl font-medium mb-2" style={{ color: "var(--chalk)" }}>
            flint.pay/{handle}
          </h1>
          <p className="text-sm mb-6" style={{ color: "#888888" }}>
            This handle has no active payment request.
          </p>
          <button
            onClick={() => router.push("/create")}
            className="px-6 py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "var(--spark)" }}
          >
            Claim this handle
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full">

        {/* Profile header */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-medium"
            style={{ background: "var(--spark)", color: "white" }}
          >
            {handle.slice(0, 2).toUpperCase()}
          </div>
          <h1 className="text-2xl font-medium mb-1" style={{ color: "var(--chalk)" }}>
            @{handle}
          </h1>
          <p className="text-sm font-mono" style={{ color: "#555555" }}>
            {invoice?.recipientWallet.slice(0, 6)}...{invoice?.recipientWallet.slice(-6)}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: isActive ? "#4ade80" : "#ff6b6b" }}
            />
            <p className="text-xs" style={{ color: isActive ? "#4ade80" : "#ff6b6b" }}>
              {isActive ? "Active payment request" : invoice?.status === "paid" ? "Already paid" : "Expired"}
            </p>
          </div>
        </div>

        {/* Invoice card */}
        {invoice && (
          <div
            className="rounded-2xl p-6 mb-4"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          >
            <p className="text-xs mb-1" style={{ color: "#555555" }}>
              PAYMENT REQUEST
            </p>
            <h2 className="text-lg font-medium mb-4" style={{ color: "var(--chalk)" }}>
              {invoice.title}
            </h2>

            <div
              className="flex items-center justify-center py-6 mb-4 rounded-xl"
              style={{ background: "#0f0f0f" }}
            >
              <span className="text-4xl font-medium" style={{ color: "var(--spark)" }}>
                {invoice.amount}
              </span>
              <span className="text-lg ml-2 mt-1" style={{ color: "#888888" }}>
                {invoice.token}
              </span>
            </div>

            {invoice.memo && (
              <div className="flex justify-between mb-3">
                <p className="text-sm" style={{ color: "#555555" }}>Memo</p>
                <p className="text-sm" style={{ color: "var(--chalk)" }}>{invoice.memo}</p>
              </div>
            )}

            <div className="flex justify-between mb-3">
              <p className="text-sm" style={{ color: "#555555" }}>Network</p>
              <p className="text-sm" style={{ color: "#4ade80" }}>Solana Devnet</p>
            </div>

            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>Expires</p>
              <p className="text-sm" style={{ color: isExpired ? "#ff6b6b" : "#888888" }}>
                {new Date(invoice.expiresAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isActive && (
            <button
              onClick={() => router.push(`/pay/${invoice?.id}`)}
              className="w-full py-4 rounded-xl font-medium text-white transition-all hover:opacity-90"
              style={{ background: "var(--spark)" }}
            >
              Pay {invoice?.amount} {invoice?.token}
            </button>
          )}

          {invoice?.status === "paid" && (
            <div
              className="w-full py-4 rounded-xl text-center font-medium"
              style={{ background: "#0a1a0a", color: "#4ade80" }}
            >
              Already paid
            </div>
          )}

          {isExpired && invoice?.status !== "paid" && (
            <div
              className="w-full py-4 rounded-xl text-center font-medium"
              style={{ background: "#1a0a0a", color: "#ff6b6b" }}
            >
              This request has expired
            </div>
          )}

          <button
            onClick={() => router.push("/create")}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#888888" }}
          >
            Create your own Flint handle
          </button>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#333333" }}>
          Powered by Flint · Secured by Solana
        </p>
      </div>
    </main>
  );
}