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
  escrowAddress?: string;
  webhookUrl?: string;
  condition?: string;
}

export default function InvoicePage() {
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [copied, setCopied] = useState(false);
  const [auditLog, setAuditLog] = useState<Array<{id: string, action: string, details: string, timestamp: number}>>([]);
  const [releasingEscrow, setReleasingEscrow] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState("");
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoice/create?id=${id}`);
        const data = await res.json();
        if (data.id) {
          setInvoice(data);
        }
        const auditRes = await fetch(`/api/audit?invoiceId=${id}`);
        const auditData = await auditRes.json();
        if (auditData.entries) setAuditLog(auditData.entries);
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

        {/* Audit log */}
        {auditLog.length > 0 && (
          <div
            className="rounded-2xl p-6 mb-4"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          >
            <p
              className="text-xs mb-4"
              style={{
                color: "#555555",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Activity Log
            </p>
            <div className="flex flex-col gap-3">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{
                      background: entry.action === "paid" ? "#4ade80" : "var(--spark)",
                    }}
                  />
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--chalk)" }}>
                      {entry.action === "created" ? "Invoice created" : "Payment received"}
                    </p>
                    <p className="text-xs" style={{ color: "#555555" }}>
                      {entry.details}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#333333" }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Escrow release */}
        {invoice?.escrowAddress && invoice?.status !== "paid" && (
          <div
            className="rounded-2xl p-6 mb-4"
            style={{ background: "#1a1500", border: "1px solid #3a3000" }}
          >
            <p className="text-xs mb-2 font-medium" style={{ color: "#FFB800" }}>
              FUNDS IN ESCROW
            </p>
            <p className="text-xs font-mono mb-4" style={{ color: "#888888" }}>
              {invoice.escrowAddress.slice(0, 8)}...{invoice.escrowAddress.slice(-8)}
            </p>
            <p className="text-xs mb-4" style={{ color: "#888888" }}>
              Condition: {invoice.condition || "none"}
            </p>
            <button
              onClick={async () => {
                if (!window.solana) return;
                setReleasingEscrow(true);
                try {
                  await window.solana.connect();
                  const res = await fetch("/api/escrow", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      invoiceId: id,
                      payerAddress: window.solana.publicKey.toString(),
                      action: "release",
                    }),
                  });
                  const data = await res.json();
                  if (data.transaction) {
                    const { Transaction, Connection, clusterApiUrl } = await import("@solana/web3.js");
                    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
                    const tx = Transaction.from(Buffer.from(data.transaction, "base64"));
                    const { signature } = await window.solana.signAndSendTransaction(tx);
                    try { await connection.confirmTransaction(signature, "confirmed"); } catch {}
                    window.location.reload();
                  }
                } catch (err) {
                  console.error(err);
                } finally {
                  setReleasingEscrow(false);
                }
              }}
              disabled={releasingEscrow}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#FFB800", color: "#0f0f0f" }}
            >
              {releasingEscrow ? "Releasing..." : "Release Escrow to Recipient"}
            </button>
          </div>
        )}

        {/* Webhook test */}
        {invoice?.webhookUrl && (
          <div
            className="rounded-2xl p-6 mb-4"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          >
            <p className="text-xs mb-2" style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Webhook
            </p>
            <p className="text-xs font-mono mb-4" style={{ color: "#888888" }}>
              {invoice.webhookUrl}
            </p>
            <button
              onClick={async () => {
                setTestingWebhook(true);
                setWebhookResult("");
                try {
                  const res = await fetch(invoice.webhookUrl!, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "X-Flint-Event": "test" },
                    body: JSON.stringify({ event: "test", invoiceId: id, timestamp: Date.now() }),
                  });
                  setWebhookResult(res.ok ? "Webhook delivered successfully" : `Failed: ${res.status}`);
                } catch {
                  setWebhookResult("Webhook delivery failed — check URL");
                } finally {
                  setTestingWebhook(false);
                }
              }}
              disabled={testingWebhook}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#111111", border: "1px solid #2a2a2a", color: "#888888" }}
            >
              {testingWebhook ? "Testing..." : "Test Webhook"}
            </button>
            {webhookResult && (
              <p className="text-xs mt-2 text-center"
                style={{ color: webhookResult.includes("success") ? "#4ade80" : "#ff6b6b" }}>
                {webhookResult}
              </p>
            )}
          </div>
        )}

        {/* Export */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => window.open(`/api/ubl?id=${id}`, "_blank")}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "#111111", border: "1px solid #1f1f1f", color: "#888888" }}
          >
            Export UBL XML
          </button>
          <button
            onClick={() => window.open(`/api/receipt/${id}`, "_blank")}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "#111111", border: "1px solid #1f1f1f", color: "#888888" }}
          >
            View Receipt JSON
          </button>
        </div>

        {/* Share buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => window.open(
              `https://wa.me/?text=Hi! I sent you a payment request for ${invoice?.amount} ${invoice?.token}. Pay here: ${paymentLink}`,
              "_blank"
            )}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "#0a1f0a", border: "1px solid #1a3a1a", color: "#4ade80" }}
          >
            Share on WhatsApp
          </button>
          <button
            onClick={() => window.open(
              `mailto:?subject=Payment Request: ${invoice?.title}&body=Hi! I sent you a payment request for ${invoice?.amount} ${invoice?.token}.%0A%0APay here: ${paymentLink}`,
              "_blank"
            )}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "#111111", border: "1px solid #1f1f1f", color: "#888888" }}
          >
            Send via Email
          </button>
        </div>

        <p className="text-center text-xs" style={{ color: "#333333" }}>
          The payer needs only a Solana wallet. No account required.
        </p>

      </div>
    </main>
  );
}