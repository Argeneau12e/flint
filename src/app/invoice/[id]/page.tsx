"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";

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
  condition?: string;
  escrowAddress?: string;
  webhookUrl?: string;
  txSignature?: string;
  payerWallet?: string;
  paidAt?: number;
}

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [auditLog, setAuditLog] = useState<Array<{id: string, action: string, details: string, timestamp: number}>>([]);
  const [releasingEscrow, setReleasingEscrow] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState("");
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoice/status?id=${id}`);
        const data = await res.json();
        if (data.invoice) {
          setInvoice(data.invoice);
          const auditRes = await fetch(`/api/audit?invoiceId=${id}`);
          const auditData = await auditRes.json();
          if (auditData.entries) setAuditLog(auditData.entries);
        }
      } catch {
        console.error("Failed to fetch invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();

    let pollCount = 0;
    const maxPolls = 8;
    const interval = setInterval(async () => {
      if (invoice?.status === "paid") {
        clearInterval(interval);
        return;
      }
      try {
        const res = await fetch(`/api/invoice/status?id=${id}`);
        const data = await res.json();
        if (data.status === "paid" && invoice?.status !== "paid") {
          setInvoice(data.invoice);
          const auditRes = await fetch(`/api/audit?invoiceId=${id}`);
          const auditData = await auditRes.json();
          if (auditData.entries) setAuditLog(auditData.entries);
          clearInterval(interval);
        }
      } catch {
        console.error("Polling error");
      }
    }, 15000);

    return () => clearInterval(interval);
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
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const timeLeft = (expiresAt: number) => {
    const diff = expiresAt - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Expired";
    if (days === 1) return "Expires tomorrow";
    return `Expires in ${days} days`;
  };

  const downloadReceipt = async (format: "pdf" | "image") => {
    if (!invoice) return;
    const verifyUrl = `https://flint-rust.vercel.app/verify/${invoice.txSignature}`;
    const shortTx = invoice.txSignature
      ? `${invoice.txSignature.slice(0, 24)}...${invoice.txSignature.slice(-8)}`
      : "";

    if (format === "image") {
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = "#0f0f0f";
      ctx.fillRect(0, 0, 900, 500);

      // Left accent bar
      ctx.fillStyle = "#FF6B2B";
      ctx.fillRect(0, 0, 8, 500);

      // Header band
      ctx.fillStyle = "#111111";
      ctx.fillRect(8, 0, 892, 90);

      // FLINT
      ctx.fillStyle = "#FF6B2B";
      ctx.font = "bold 36px Arial, sans-serif";
      ctx.fillText("FLINT", 40, 48);

      // Receipt label
      ctx.fillStyle = "#888888";
      ctx.font = "12px Arial, sans-serif";
      ctx.letterSpacing = "3px";
      ctx.fillText("PAYMENT RECEIPT", 40, 72);

      // Verified circle
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.arc(840, 45, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✓", 840, 53);
      ctx.textAlign = "left";

      // Divider
      ctx.fillStyle = "#222222";
      ctx.fillRect(40, 100, 820, 1);

      // Invoice title
      ctx.fillStyle = "#f7f7f5";
      ctx.font = "bold 26px Arial, sans-serif";
      ctx.fillText(invoice.title.slice(0, 40), 40, 145);

      // Amount
      ctx.fillStyle = "#FF6B2B";
      ctx.font = "bold 52px Arial, sans-serif";
      const amtText = `${invoice.amount}`;
      ctx.fillText(amtText, 40, 220);
      ctx.fillStyle = "#888888";
      ctx.font = "24px Arial, sans-serif";
      ctx.fillText(` ${invoice.token}`, 40 + ctx.measureText(amtText).width, 220);

      // Details row
      const detailY = 265;
      ctx.fillStyle = "#555555";
      ctx.font = "11px Arial, sans-serif";
      ctx.fillText("DATE", 40, detailY);
      ctx.fillText("STATUS", 260, detailY);
      ctx.fillText("NETWORK", 480, detailY);

      ctx.fillStyle = "#f7f7f5";
      ctx.font = "bold 14px Arial, sans-serif";
      ctx.fillText(invoice.paidAt ? formatDate(invoice.paidAt) : "—", 40, detailY + 20);
      ctx.fillStyle = "#4ade80";
      ctx.fillText("Paid", 260, detailY + 20);
      ctx.fillStyle = "#f7f7f5";
      ctx.fillText("Solana Devnet", 480, detailY + 20);

      // Divider
      ctx.fillStyle = "#222222";
      ctx.fillRect(40, 305, 820, 1);

      // Transaction
      ctx.fillStyle = "#555555";
      ctx.font = "11px Arial, sans-serif";
      ctx.fillText("TRANSACTION SIGNATURE", 40, 330);
      ctx.fillStyle = "#FF6B2B";
      ctx.font = "11px monospace";
      ctx.fillText(shortTx, 40, 350);

      // Verify
      ctx.fillStyle = "#555555";
      ctx.font = "11px Arial, sans-serif";
      ctx.fillText("VERIFY AT", 40, 385);
      ctx.fillStyle = "#4ade80";
      ctx.font = "11px monospace";
      const shortVerify = `flint-rust.vercel.app/verify/${invoice.txSignature?.slice(0, 16)}...`;
      ctx.fillText(shortVerify, 40, 405);

      // Footer
      ctx.fillStyle = "#111111";
      ctx.fillRect(8, 455, 892, 45);
      ctx.fillStyle = "#444444";
      ctx.font = "11px Arial, sans-serif";
      ctx.fillText("Generated by Flint  ·  flint-rust.vercel.app  ·  Secured by Solana Blockchain", 40, 480);

      const link = document.createElement("a");
      link.download = `flint-receipt-${id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

    } else {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ format: "a4" });
      const w = 210;

      // Background
      doc.setFillColor(15, 15, 15);
      doc.rect(0, 0, w, 297, "F");

      // Left accent bar
      doc.setFillColor(255, 107, 43);
      doc.rect(0, 0, 4, 297, "F");

      // Header background
      doc.setFillColor(17, 17, 17);
      doc.rect(4, 0, w - 4, 40, "F");

      // FLINT
      doc.setTextColor(255, 107, 43);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("FLINT", 15, 22);

      // Receipt label
      doc.setTextColor(136, 136, 136);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("PAYMENT RECEIPT", 15, 33);

      // Verified badge
      doc.setFillColor(74, 222, 128);
      doc.circle(195, 20, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("✓", 192.5, 23.5);

      // Divider
      doc.setDrawColor(31, 31, 31);
      doc.setLineWidth(0.3);
      doc.line(15, 45, w - 15, 45);

      // Invoice title
      doc.setTextColor(247, 247, 245);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.title, 15, 60);

      // Amount
      doc.setTextColor(255, 107, 43);
      doc.setFontSize(32);
      doc.text(`${invoice.amount} ${invoice.token}`, 15, 85);

      // Divider
      doc.line(15, 95, w - 15, 95);

      // Details grid
      const details = [
        ["Date", invoice.paidAt ? formatDate(invoice.paidAt) : "—"],
        ["Status", "Paid"],
        ["Network", "Solana Devnet"],
        ["Recipient", `${invoice.recipientWallet.slice(0, 16)}...${invoice.recipientWallet.slice(-8)}`],
        ["Payer", invoice.payerWallet ? `${invoice.payerWallet.slice(0, 16)}...${invoice.payerWallet.slice(-8)}` : "—"],
      ];
      if (invoice.memo) details.push(["Memo", invoice.memo]);

      let y = 110;
      details.forEach(([label, value]) => {
        doc.setTextColor(85, 85, 85);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(label.toUpperCase(), 15, y);
        doc.setTextColor(value === "Paid" ? 74 : 247, value === "Paid" ? 222 : 247, value === "Paid" ? 128 : 245);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(value, 15, y + 8);
        y += 22;
      });

      // Transaction section
      doc.line(15, y + 5, w - 15, y + 5);
      y += 15;
      doc.setTextColor(85, 85, 85);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("TRANSACTION SIGNATURE", 15, y);
      doc.setTextColor(255, 107, 43);
      doc.setFontSize(7);
      doc.setFont("courier", "normal");
      const txLines = doc.splitTextToSize(invoice.txSignature || "", w - 30);
      doc.text(txLines, 15, y + 8);
      y += 8 + (txLines.length * 5) + 10;

      // Verify section
      doc.setTextColor(85, 85, 85);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("VERIFY ONLINE", 15, y);
      doc.setTextColor(74, 222, 128);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const verifyLines = doc.splitTextToSize(verifyUrl, w - 30);
      doc.text(verifyLines, 15, y + 8);

      // Footer
      doc.setFillColor(17, 17, 17);
      doc.rect(4, 275, w - 4, 22, "F");
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Generated by Flint · flint-rust.vercel.app · Secured by Solana Blockchain", 15, 287);

      doc.save(`flint-receipt-${id.slice(0, 8)}.pdf`);
    }
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
          <p className="text-xl mb-2" style={{ color: "var(--chalk)" }}>Invoice not found</p>
          <button onClick={() => router.push("/")}
            style={{ color: "var(--spark)", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}>
            Back to Flint
          </button>
        </div>
      </main>
    );
  }

  const isPaid = invoice.status === "paid";

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-lg mx-auto">

        <button onClick={() => router.push("/")}
          style={{ color: "var(--spark)", fontSize: "14px", background: "none", border: "none", cursor: "pointer" }}>
          Back to Flint
        </button>

        {/* Status banner */}
        <div
          className="glass-light mt-6 mb-8 px-6 py-4 rounded-2xl flex items-center gap-4"
          style={{
            border: isPaid ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={isPaid ? {
            width: "40px", height: "40px", borderRadius: "50%",
            background: "#4ade80", display: "flex", alignItems: "center",
            justifyContent: "center", color: "white", fontSize: "18px",
            fontWeight: 700, flexShrink: 0,
          } : {
            width: "40px", height: "40px", borderRadius: "50%",
            background: "#1a1a0a", border: "1px solid #2a2a0a",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--spark)", fontSize: "18px", flexShrink: 0,
          }}>
            {isPaid ? "✓" : "·"}
          </div>

          <div>
            <p className="font-medium" style={{ color: isPaid ? "#4ade80" : "var(--chalk)" }}>
              {isPaid ? "Payment received" : "Payment request created"}
            </p>
            <p className="text-sm" style={{ color: isPaid ? "#2d6a2d" : "#555555" }}>
              {isPaid ? `Paid on ${formatDate(invoice.paidAt || invoice.createdAt)}` : "Share the link below to get paid"}
            </p>
          </div>
        </div>

        {/* Invoice card */}
        <div className="glass-medium rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs mb-1" style={{ color: "#555555" }}>INVOICE</p>
              <h1 className="text-2xl font-medium" style={{ color: "var(--chalk)" }}>
                {invoice.title}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-3xl font-medium" style={{ color: "var(--spark)" }}>
                {invoice.amount}
              </p>
              <p className="text-sm" style={{ color: "#888888" }}>{invoice.token}</p>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #1f1f1f", paddingTop: "20px" }}
            className="flex flex-col gap-3">
            {invoice.memo && (
              <div className="flex justify-between">
                <p className="text-sm" style={{ color: "#555555" }}>Memo</p>
                <p className="text-sm" style={{ color: "var(--chalk)" }}>{invoice.memo}</p>
              </div>
            )}
            {invoice.condition && (
              <div className="flex justify-between">
                <p className="text-sm" style={{ color: "#555555" }}>Condition</p>
                <p className="text-sm" style={{ color: "#FFB800" }}>{invoice.condition}</p>
              </div>
            )}
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>Created</p>
              <p className="text-sm" style={{ color: "var(--chalk)" }}>{formatDate(invoice.createdAt)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>Expiry</p>
              <p className="text-sm" style={{ color: Date.now() > invoice.expiresAt ? "#ff6b6b" : "#4ade80" }}>
                {timeLeft(invoice.expiresAt)}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>Recipient</p>
              <p className="text-sm font-mono" style={{ color: "var(--chalk)" }}>
                {invoice.recipientWallet.slice(0, 4)}...{invoice.recipientWallet.slice(-4)}
              </p>
            </div>
            {isPaid && invoice.txSignature && (
              <div style={{ borderTop: "1px solid #1f1f1f", paddingTop: "12px" }}>
                <p className="text-xs mb-1" style={{ color: "#555555" }}>Transaction</p>
                <p className="text-xs font-mono break-all" style={{ color: "var(--spark)" }}>
                  {invoice.txSignature}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Primary action — paid vs unpaid */}
        {isPaid ? (
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={() => window.open(`/verify/${invoice.txSignature}`, "_blank")}
              className="w-full py-4 rounded-2xl font-medium text-white transition-all hover:opacity-90"
              style={{ background: "#4ade80", color: "#0f0f0f" }}
            >
              View Verified Receipt
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => downloadReceipt("pdf")}
                className="flex-1 py-3 rounded-2xl text-sm font-medium transition-all hover:opacity-90"
                style={{ background: "#111111", border: "1px solid #1f1f1f", color: "#888888" }}
              >
                Download PDF
              </button>
              <button
                onClick={() => downloadReceipt("image")}
                className="flex-1 py-3 rounded-2xl text-sm font-medium transition-all hover:opacity-90"
                style={{ background: "#111111", border: "1px solid #1f1f1f", color: "#888888" }}
              >
                Download Image
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.open(
                  `https://wa.me/?text=Payment confirmed! ${invoice.amount} ${invoice.token} for "${invoice.title}". Verify: ${window.location.origin}/verify/${invoice.txSignature}`,
                  "_blank"
                )}
                className="flex-1 py-3 rounded-2xl text-sm font-medium transition-all hover:opacity-90"
                style={{ background: "#0a1f0a", border: "1px solid #1a3a1a", color: "#4ade80" }}
              >
                Share via WhatsApp
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/verify/${invoice.txSignature}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 py-3 rounded-2xl text-sm font-medium transition-all hover:opacity-90"
                style={{ background: "#111111", border: "1px solid #1f1f1f", color: copied ? "#4ade80" : "#888888" }}
              >
                {copied ? "Copied!" : "Copy Verify Link"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Payment link */}
            <div className="glass-card rounded-2xl p-6 mb-6">
              <p className="text-xs mb-3"
                style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Payment Link
              </p>
              <div className="glass-light flex items-center gap-3 px-4 py-3 rounded-xl mb-4">
                <p className="text-sm font-mono flex-1 truncate" style={{ color: "var(--spark)" }}>
                  {paymentLink}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="w-full py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 mb-3"
                style={{ background: copied ? "#0a1a0a" : "var(--spark)", color: copied ? "#4ade80" : "white" }}
              >
                {copied ? "Link Copied!" : "Copy Payment Link"}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => window.open(
                    `https://wa.me/?text=Hi! I sent you a payment request for ${invoice.amount} ${invoice.token}. Pay here: ${paymentLink}`,
                    "_blank"
                  )}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: "#0a1f0a", border: "1px solid #1a3a1a", color: "#4ade80" }}
                >
                  Share on WhatsApp
                </button>
                <button
                  onClick={() => window.open(
                    `mailto:?subject=Payment Request: ${invoice.title}&body=Hi! Please pay ${invoice.amount} ${invoice.token} for "${invoice.title}".%0A%0APay here: ${paymentLink}`,
                    "_blank"
                  )}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: "#111111", border: "1px solid #1f1f1f", color: "#888888" }}
                >
                  Send via Email
                </button>
              </div>
            </div>

            {/* QR Code */}
            <div className="glass-card rounded-2xl p-6 mb-6 flex flex-col items-center gap-4">
              <p className="text-xs"
                style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Scan to Pay
              </p>
              <div className="p-4 rounded-xl" style={{ background: "white" }}>
                <QRCode
                value={paymentLink}
                size={160}
                bgColor="#ffffff"
                fgColor="#0f0f0f"
              />
              </div>
              <p className="text-xs text-center" style={{ color: "#444444" }}>
                Scan with Phantom mobile to pay instantly
              </p>
            </div>
          </>
        )}

        {/* Escrow release */}
        {invoice.escrowAddress && invoice.status !== "paid" && (
          <div className="rounded-2xl p-6 mb-4"
            style={{ background: "#1a1500", border: "1px solid #3a3000" }}>
            <p className="text-xs mb-2 font-medium" style={{ color: "#FFB800" }}>FUNDS IN ESCROW</p>
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
                } catch (err) { console.error(err); }
                finally { setReleasingEscrow(false); }
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
        {invoice.webhookUrl && (
          <div className="glass-card rounded-2xl p-6 mb-4">
            <p className="text-xs mb-2"
              style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Webhook
            </p>
            <p className="text-xs font-mono mb-4" style={{ color: "#888888" }}>{invoice.webhookUrl}</p>
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
                } finally { setTestingWebhook(false); }
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
        {!isPaid && (
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => window.open(`/api/ubl?id=${id}`, "_blank")}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "#111111", border: "1px solid #1f1f1f", color: "#555555" }}
            >
              Export UBL XML
            </button>
            <button
              onClick={() => window.open(`/api/receipt/${id}`, "_blank")}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "#111111", border: "1px solid #1f1f1f", color: "#555555" }}
            >
              View Receipt JSON
            </button>
          </div>
        )}

        {/* Audit log */}
        {auditLog.length > 0 && (
          <div className="rounded-2xl p-6 mb-4"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}>
            <p className="text-xs mb-4"
              style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Activity Log
            </p>
            <div className="flex flex-col gap-3">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="verified-badge flex-shrink-0 glass-light" style={{
                    width: "20px", height: "20px", fontSize: "10px",
                    background: entry.action === "paid" ? "#4ade80" : entry.action.includes("reject") ? "#ff6b6b" : "var(--spark)",
                  }}>
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--chalk)" }}>
                      {entry.action === "created" ? "Invoice created"
                        : entry.action === "paid" ? "Payment received"
                        : entry.action === "escrowed" ? "Funds held in escrow"
                        : entry.action === "released" ? "Escrow released"
                        : entry.action === "agent_approved" ? "Agent approved"
                        : entry.action === "agent_rejected" ? "Agent rejected"
                        : entry.action}
                    </p>
                    <p className="text-xs" style={{ color: "#555555" }}>{entry.details}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#333333" }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}