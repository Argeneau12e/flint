"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG as QRCode } from "qrcode.react";

interface Invoice {
  id: string;
  title: string;
  amount: number;
  token: string;
  memo: string;
  recipientWallet: string;
  createdAt: number;
  expiresAt: number;
  status: string;
}

export default function InvoicePage() {
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoice/create?id=${id}`);
        const data = await res.json();
        if (data.id) {
          setInvoice(data);
        }
      } catch {
        console.error("Failed to fetch invoice");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const paymentLink = typeof window !== "undefined"
    ? `${window.location.origin}/pay/${id}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const timeLeft = (expiresAt: number) => {
    const diff = expiresAt - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Expired";
    if (days === 1) return "Expires tomorrow";
    return `Expires in ${days} days`;
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p style={{ color: "#888888" }}>Loading invoice...</p>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-2" style={{ color: "var(--chalk)" }}>
            Invoice not found
          </p>
          <a href="/" style={{ color: "var(--spark)", fontSize: "14px" }}>
            Back to Flint
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-lg mx-auto">

        <a href="/" style={{ color: "var(--spark)", fontSize: "14px" }}>
          Back to Flint
        </a>

        {/* Success banner */}
        <div
          className="mt-6 mb-8 px-6 py-4 rounded-2xl flex items-center gap-4"
          style={{ background: "#0a1a0a", border: "1px solid #1a3a1a" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: "#1a3a1a" }}
          >
            ✓
          </div>
          <div>
            <p className="font-medium" style={{ color: "#4ade80" }}>
              Payment request created
            </p>
            <p className="text-sm" style={{ color: "#2d6a2d" }}>
              Share the link below to get paid
            </p>
          </div>
        </div>

        {/* Invoice card */}
        <div
          className="rounded-2xl p-8 mb-6"
          style={{ background: "#111111", border: "1px solid #1f1f1f" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs mb-1" style={{ color: "#555555" }}>
                INVOICE
              </p>
              <h1
                className="text-2xl font-medium"
                style={{ color: "var(--chalk)" }}
              >
                {invoice.title}
              </h1>
            </div>
            <div className="text-right">
              <p
                className="text-3xl font-medium"
                style={{ color: "var(--spark)" }}
              >
                {invoice.amount}
              </p>
              <p className="text-sm" style={{ color: "#888888" }}>
                {invoice.token}
              </p>
            </div>
          </div>

          <div
            style={{ borderTop: "1px solid #1f1f1f", paddingTop: "20px" }}
            className="flex flex-col gap-3"
          >
            {invoice.memo && (
              <div className="flex justify-between">
                <p className="text-sm" style={{ color: "#555555" }}>
                  Memo
                </p>
                <p className="text-sm" style={{ color: "var(--chalk)" }}>
                  {invoice.memo}
                </p>
              </div>
            )}
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>
                Created
              </p>
              <p className="text-sm" style={{ color: "var(--chalk)" }}>
                {formatDate(invoice.createdAt)}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>
                Expiry
              </p>
              <p
                className="text-sm"
                style={{
                  color:
                    Date.now() > invoice.expiresAt ? "#ff6b6b" : "#4ade80",
                }}
              >
                {timeLeft(invoice.expiresAt)}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>
                Recipient
              </p>
              <p
                className="text-sm font-mono"
                style={{ color: "var(--chalk)" }}
              >
                {invoice.recipientWallet.slice(0, 4)}...
                {invoice.recipientWallet.slice(-4)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment link */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{ background: "#111111", border: "1px solid #1f1f1f" }}
        >
          <p
            className="text-xs mb-3"
            style={{
              color: "#555555",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Payment Link
          </p>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
            style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}
          >
            <p
              className="text-sm font-mono flex-1 truncate"
              style={{ color: "var(--spark)" }}
            >
              {paymentLink}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="w-full py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              background: copied ? "#1a3a1a" : "var(--spark)",
              color: copied ? "#4ade80" : "white",
            }}
          >
            {copied ? "Copied!" : "Copy Payment Link"}
          </button>
        </div>

        {/* QR Code */}
        <div
          className="rounded-2xl p-6 mb-4 flex flex-col items-center gap-4"
          style={{ background: "#111111", border: "1px solid #1f1f1f" }}
        >
          <p
            className="text-xs"
            style={{
              color: "#555555",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Scan to Pay
          </p>
          <div className="p-4 rounded-xl" style={{ background: "white" }}>
            <QRCode
              value={paymentLink}
              size={180}
              bgColor="#ffffff"
              fgColor="#0f0f0f"
              level="H"
            />
          </div>
          <p className="text-xs text-center" style={{ color: "#444444" }}>
            Payer scans this with their Solana wallet app
          </p>
        </div>

        {/* Share hint */}
        <p className="text-center text-xs" style={{ color: "#333333" }}>
          Share this link via WhatsApp, email, or any messaging app.
          The payer needs only a Solana wallet.
        </p>

      </div>
    </main>
  );
}