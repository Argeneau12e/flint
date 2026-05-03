"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import FlintLoader from "@/components/flint-loader";

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

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
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();

    let pollCount = 0;
    const maxPolls = 10;
    const interval = setInterval(async () => {
      if (pollCount >= maxPolls) { clearInterval(interval); return; }
      pollCount++;
      try {
        const res = await fetch(`/api/invoice/status?id=${id}`);
        const data = await res.json();
        if (data.status === "paid") {
          setInvoice(data.invoice);
          clearInterval(interval);
          const auditRes = await fetch(`/api/audit?invoiceId=${id}`);
          const auditData = await auditRes.json();
          if (auditData.entries) setAuditLog(auditData.entries);
        }
      } catch { /* silent */ }
    }, 20000);

    return () => clearInterval(interval);
  }, [id]);

  const paymentLink = typeof window !== "undefined" ? `${window.location.origin}/pay/${id}` : "";
  const qrValue = typeof window !== "undefined"
    ? `solana:${window.location.origin}/api/pay/${id}`
    : `solana://api/pay/${id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const timeLeft = (expiresAt: number) => {
    const diff = expiresAt - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Expired";
    if (days === 1) return "Expires tomorrow";
    return `Expires in ${days} days`;
  };

  const downloadReceipt = async (format: "pdf" | "image") => {
    if (!invoice) return;
    const verifyUrl = `${window.location.origin}/verify/${invoice.txSignature}`;
    const shortTx = invoice.txSignature
      ? `${invoice.txSignature.slice(0, 28)}...${invoice.txSignature.slice(-8)}`
      : "";

    if (format === "image") {
      const W = 1000, H = 560;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, W, H);

      // Subtle gradient overlay
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "rgba(255,107,43,0.05)");
      grad.addColorStop(1, "rgba(26,26,46,0.3)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Left accent bar
      const barGrad = ctx.createLinearGradient(0, 0, 0, H);
      barGrad.addColorStop(0, "#FF6B2B");
      barGrad.addColorStop(1, "#cc4a15");
      ctx.fillStyle = barGrad;
      ctx.fillRect(0, 0, 6, H);

      // Header band
      ctx.fillStyle = "rgba(17,17,17,0.95)";
      ctx.fillRect(6, 0, W - 6, 80);

      // FLINT wordmark
      ctx.fillStyle = "#FF6B2B";
      ctx.font = "bold 32px Arial, sans-serif";
      ctx.fillText("FLINT", 40, 45);
      ctx.fillStyle = "#555555";
      ctx.font = "10px Arial, sans-serif";
      ctx.fillText("PAYMENT RECEIPT", 40, 65);

      // Paid badge (top-right)
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.roundRect(W - 130, 20, 100, 36, 8);
      ctx.fill();
      ctx.fillStyle = "#0d0d0d";
      ctx.font = "bold 13px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✓  PAID", W - 80, 43);
      ctx.textAlign = "left";

      // Divider
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(40, 90, W - 80, 1);

      // Invoice title
      ctx.fillStyle = "#999999";
      ctx.font = "10px Arial, sans-serif";
      ctx.fillText("INVOICE", 40, 120);
      ctx.fillStyle = "#f0f0ee";
      ctx.font = "bold 22px Arial, sans-serif";
      ctx.fillText(invoice.title.slice(0, 48), 40, 148);

      // Amount — big
      ctx.fillStyle = "#FF6B2B";
      ctx.font = "bold 58px Arial, sans-serif";
      const amtW = ctx.measureText(`${invoice.amount}`).width;
      ctx.fillText(`${invoice.amount}`, 40, 230);
      ctx.fillStyle = "#666666";
      ctx.font = "28px Arial, sans-serif";
      ctx.fillText(` ${invoice.token}`, 40 + amtW, 230);

      // Detail columns
      const detailY = 270;
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(40, detailY - 10, W - 80, 1);

      const cols = [
        { label: "DATE", value: invoice.paidAt ? formatDate(invoice.paidAt) : "—", x: 40 },
        { label: "STATUS", value: "Paid", x: 240, green: true },
        { label: "NETWORK", value: "Solana Devnet", x: 440 },
        { label: "RECIPIENT", value: `${invoice.recipientWallet.slice(0, 8)}...${invoice.recipientWallet.slice(-6)}`, x: 660 },
      ];

      cols.forEach(({ label, value, x, green }) => {
        ctx.fillStyle = "#555555";
        ctx.font = "9px Arial, sans-serif";
        ctx.fillText(label, x, detailY + 14);
        ctx.fillStyle = green ? "#4ade80" : "#e0e0de";
        ctx.font = "bold 13px Arial, sans-serif";
        ctx.fillText(value, x, detailY + 34);
      });

      // Second divider
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(40, detailY + 52, W - 80, 1);

      // TX signature
      ctx.fillStyle = "#555555";
      ctx.font = "9px Arial, sans-serif";
      ctx.fillText("TRANSACTION SIGNATURE", 40, detailY + 74);
      ctx.fillStyle = "#FF6B2B";
      ctx.font = "11px monospace";
      ctx.fillText(shortTx, 40, detailY + 94);

      // Verify link
      ctx.fillStyle = "#555555";
      ctx.font = "9px Arial, sans-serif";
      ctx.fillText("VERIFY ONLINE", 40, detailY + 122);
      ctx.fillStyle = "#4ade80";
      ctx.font = "11px monospace";
      ctx.fillText(verifyUrl.slice(0, 80), 40, detailY + 142);

      // Footer band
      ctx.fillStyle = "rgba(17,17,17,0.95)";
      ctx.fillRect(6, H - 46, W - 6, 46);
      ctx.fillStyle = "#333333";
      ctx.font = "10px Arial, sans-serif";
      ctx.fillText("Generated by Flint  ·  Secured by Solana Blockchain  ·  flint.pay", 40, H - 18);

      const link = document.createElement("a");
      link.download = `flint-receipt-${id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

    } else {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ format: "a4" });
      const W = 210, H = 297;

      // Background
      doc.setFillColor(13, 13, 13);
      doc.rect(0, 0, W, H, "F");

      // Accent gradient bar (left)
      doc.setFillColor(255, 107, 43);
      doc.rect(0, 0, 5, H, "F");

      // Header band
      doc.setFillColor(20, 20, 20);
      doc.rect(5, 0, W - 5, 44, "F");

      // FLINT wordmark
      doc.setTextColor(255, 107, 43);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("FLINT", 16, 22);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text("PAYMENT RECEIPT", 16, 32);

      // Paid badge
      doc.setFillColor(74, 222, 128);
      doc.roundedRect(W - 42, 10, 34, 13, 2, 2, "F");
      doc.setTextColor(13, 13, 13);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("✓  PAID", W - 37, 18.5);

      // Divider
      doc.setDrawColor(38, 38, 38);
      doc.setLineWidth(0.3);
      doc.line(16, 49, W - 16, 49);

      // Invoice title
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("INVOICE", 16, 60);
      doc.setTextColor(240, 240, 238);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.title.slice(0, 60), 16, 72);

      // Amount
      doc.setTextColor(255, 107, 43);
      doc.setFontSize(28);
      doc.text(`${invoice.amount} ${invoice.token}`, 16, 94);

      doc.setDrawColor(38, 38, 38);
      doc.line(16, 102, W - 16, 102);

      // Detail rows
      const detailItems: [string, string, boolean?][] = [
        ["Date", invoice.paidAt ? formatDate(invoice.paidAt) : "—"],
        ["Status", "Paid", true],
        ["Network", "Solana Devnet"],
        ["Recipient", `${invoice.recipientWallet.slice(0, 16)}...${invoice.recipientWallet.slice(-8)}`],
        ["Payer", invoice.payerWallet ? `${invoice.payerWallet.slice(0, 16)}...${invoice.payerWallet.slice(-8)}` : "—"],
      ];
      if (invoice.memo) detailItems.push(["Memo", invoice.memo]);

      let y = 116;
      detailItems.forEach(([label, value, green]) => {
        doc.setTextColor(85, 85, 85);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(label.toUpperCase(), 16, y);
        if (green) {
          doc.setTextColor(74, 222, 128);
        } else {
          doc.setTextColor(220, 220, 218);
        }
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(value, 16, y + 8);
        y += 20;
      });

      doc.setDrawColor(38, 38, 38);
      doc.line(16, y + 4, W - 16, y + 4);
      y += 14;

      // TX signature
      doc.setTextColor(85, 85, 85);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("TRANSACTION SIGNATURE", 16, y);
      doc.setTextColor(255, 107, 43);
      doc.setFontSize(6.5);
      doc.setFont("courier", "normal");
      const txLines = doc.splitTextToSize(invoice.txSignature || "—", W - 32);
      doc.text(txLines, 16, y + 8);
      y += 8 + txLines.length * 5 + 10;

      // Verify link
      doc.setTextColor(85, 85, 85);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("VERIFY ONLINE", 16, y);
      doc.setTextColor(74, 222, 128);
      doc.setFontSize(7);
      const verifyLines = doc.splitTextToSize(verifyUrl, W - 32);
      doc.text(verifyLines, 16, y + 8);

      // Footer
      doc.setFillColor(20, 20, 20);
      doc.rect(5, H - 22, W - 5, 22, "F");
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.text("Generated by Flint  ·  Secured by Solana Blockchain  ·  flint.pay", 16, H - 9);

      doc.save(`flint-receipt-${id.slice(0, 8)}.pdf`);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <FlintLoader message="Loading invoice..." />
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: "var(--chalk)" }}>Invoice not found</p>
          <button onClick={() => router.push("/")} className="back-btn mx-auto">
            <ChevronLeft /><span>Back to Flint</span>
          </button>
        </div>
      </main>
    );
  }

  const isPaid = invoice.status === "paid";

  return (
    <main className="min-h-screen px-5 sm:px-8 py-10 sm:py-14">
      <div className="max-w-lg mx-auto">

        <button onClick={() => router.push("/")} className="back-btn mb-7">
          <ChevronLeft /><span>Flint</span>
        </button>

        {/* Status banner */}
        <div
          className="glass-light mt-2 mb-7 px-5 py-4 rounded-2xl flex items-center gap-4"
          style={{ border: isPaid ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.06)" }}
        >
          <div style={isPaid ? {
            width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0,
            background: "#4ade80", display: "flex", alignItems: "center",
            justifyContent: "center", color: "white", fontSize: "20px", fontWeight: 700,
          } : {
            width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0,
            background: "rgba(255,107,43,0.1)", border: "1px solid rgba(255,107,43,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--spark)", fontSize: "20px",
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
        <div className="glass-medium rounded-2xl p-6 sm:p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-xs mb-1" style={{ color: "#555555", letterSpacing: "0.1em" }}>INVOICE</p>
              <h1 className="text-2xl font-medium" style={{ color: "var(--chalk)" }}>
                {invoice.title}
              </h1>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-3xl font-medium" style={{ color: "var(--spark)" }}>
                {invoice.amount}
              </p>
              <p className="text-sm" style={{ color: "#888888" }}>{invoice.token}</p>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px" }}
            className="flex flex-col gap-3">
            {invoice.memo && (
              <div className="flex justify-between gap-4">
                <p className="text-sm flex-shrink-0" style={{ color: "#555555" }}>Memo</p>
                <p className="text-sm text-right" style={{ color: "var(--chalk)" }}>{invoice.memo}</p>
              </div>
            )}
            {invoice.condition && (
              <div className="flex justify-between gap-4">
                <p className="text-sm flex-shrink-0" style={{ color: "#555555" }}>Condition</p>
                <p className="text-sm text-right" style={{ color: "#FFB800" }}>{invoice.condition}</p>
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
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
                <p className="text-xs mb-1" style={{ color: "#555555" }}>Transaction</p>
                <p className="text-xs font-mono break-all" style={{ color: "var(--spark)" }}>
                  {invoice.txSignature}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions — paid */}
        {isPaid ? (
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={() => window.open(`/verify/${invoice.txSignature}`, "_blank")}
              className="w-full py-4 rounded-2xl font-medium transition-all hover:opacity-90"
              style={{ background: "#4ade80", color: "#0f0f0f", minHeight: "54px" }}
            >
              View Verified Receipt
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => downloadReceipt("pdf")}
                className="flex-1 py-3 rounded-2xl text-sm font-medium transition-all hover:opacity-90"
                style={{ background: "#111111", border: "1px solid #1f1f1f", color: "#888888", minHeight: "48px" }}
              >
                Download PDF
              </button>
              <button
                onClick={() => downloadReceipt("image")}
                className="flex-1 py-3 rounded-2xl text-sm font-medium transition-all hover:opacity-90"
                style={{ background: "#111111", border: "1px solid #1f1f1f", color: "#888888", minHeight: "48px" }}
              >
                Download Image
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.open(
                  `https://wa.me/?text=${encodeURIComponent(`Payment confirmed! ${invoice.amount} ${invoice.token} for "${invoice.title}". Verify: ${window.location.origin}/verify/${invoice.txSignature}`)}`,
                  "_blank"
                )}
                className="flex-1 py-3 rounded-2xl text-sm font-medium transition-all hover:opacity-90"
                style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", minHeight: "48px" }}
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
                style={{ background: "#111111", border: "1px solid #1f1f1f", color: copied ? "#4ade80" : "#888888", minHeight: "48px" }}
              >
                {copied ? "Copied!" : "Copy Verify Link"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Payment link */}
            <div className="glass-card rounded-2xl p-6 mb-5">
              <p className="text-xs mb-3"
                style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Payment Link
              </p>
              <div className="glass-light flex items-center gap-3 px-4 py-3 rounded-xl mb-4 overflow-hidden">
                <p className="text-sm font-mono flex-1 truncate" style={{ color: "var(--spark)" }}>
                  {paymentLink}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="w-full py-3 rounded-xl font-medium transition-all hover:opacity-90 mb-4 liquid-btn"
                style={copied ? { background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80" } : {}}
              >
                {copied ? "Link Copied!" : "Copy Payment Link"}
              </button>

              {/* Share row */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => window.open(
                    `https://wa.me/?text=${encodeURIComponent(`Hi! I sent you a payment request for ${invoice.amount} ${invoice.token}. Pay here: ${paymentLink}`)}`,
                    "_blank"
                  )}
                  className="py-3 rounded-xl text-xs font-medium transition-all hover:opacity-90 flex flex-col items-center gap-1"
                  style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.18)", color: "#4ade80", minHeight: "56px" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.556 4.121 1.527 5.85L0 24l6.336-1.489A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.002-1.37l-.358-.214-3.763.884.897-3.665-.233-.375A9.77 9.77 0 0 1 2.182 12c0-5.416 4.402-9.818 9.818-9.818 5.416 0 9.818 4.402 9.818 9.818 0 5.416-4.402 9.818-9.818 9.818z"/></svg>
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Pay me ${invoice.amount} ${invoice.token} for "${invoice.title}": ${paymentLink}`)}`,
                    "_blank"
                  )}
                  className="py-3 rounded-xl text-xs font-medium transition-all hover:opacity-90 flex flex-col items-center gap-1"
                  style={{ background: "rgba(136,136,255,0.08)", border: "1px solid rgba(136,136,255,0.18)", color: "#8888ff", minHeight: "56px" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.635 5.904-5.635Zm-1.161 17.52h1.833L7.084 4.126H5.117Z"/></svg>
                  <span>Post on X</span>
                </button>
                <button
                  onClick={() => {
                    window.location.href = `mailto:?subject=${encodeURIComponent(`Payment Request: ${invoice.title}`)}&body=${encodeURIComponent(`Hi!\n\nPlease pay ${invoice.amount} ${invoice.token} for "${invoice.title}".\n\nPay here: ${paymentLink}\n\nThis link expires in a few days. You only need a Solana wallet to pay.`)}`;
                  }}
                  className="py-3 rounded-xl text-xs font-medium transition-all hover:opacity-90 flex flex-col items-center gap-1"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#888888", minHeight: "56px" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <span>Email</span>
                </button>
              </div>
            </div>

            {/* QR Code — dual color: orange left half, dark right half */}
            <div className="glass-card rounded-2xl p-6 mb-5 flex flex-col items-center gap-4">
              <p className="text-xs"
                style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Scan to Pay
              </p>
              <div style={{
                background: "white",
                borderRadius: "20px",
                padding: "20px",
                position: "relative",
                display: "inline-block",
                boxShadow: "0 6px 32px rgba(255,107,43,0.2), 0 2px 8px rgba(0,0,0,0.3)",
                lineHeight: 0,
              }}>
                {/* Base layer: orange */}
                <QRCode
                  value={qrValue}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#FF6B2B"
                  level="H"
                />
                {/* Top layer: dark, clipped to right half — creates the black+orange mix */}
                <div style={{
                  position: "absolute",
                  inset: "20px",
                  clipPath: "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)",
                  lineHeight: 0,
                }}>
                  <QRCode
                    value={qrValue}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#0f0f0f"
                    level="H"
                  />
                </div>
                {/* Flint logo centred — white halo keeps it readable */}
                <div style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "white",
                  borderRadius: "10px",
                  padding: "6px",
                  lineHeight: 0,
                  boxShadow: "0 0 0 4px white",
                }}>
                  <img
                    src="/flint-icon-32.png"
                    width="28"
                    height="28"
                    alt="Flint"
                    style={{ borderRadius: "5px", display: "block" }}
                  />
                </div>
              </div>
              <p className="text-xs text-center" style={{ color: "#555555" }}>
                Scan with Phantom or any Solana wallet
              </p>
            </div>
          </>
        )}

        {/* Escrow release */}
        {invoice.escrowAddress && invoice.status !== "paid" && (
          <div className="rounded-2xl p-6 mb-5"
            style={{ background: "#1a1500", border: "1px solid #3a3000" }}>
            <p className="text-xs mb-2 font-medium" style={{ color: "#FFB800" }}>FUNDS IN ESCROW</p>
            <p className="text-xs font-mono mb-3" style={{ color: "#888888" }}>
              {invoice.escrowAddress.slice(0, 8)}...{invoice.escrowAddress.slice(-8)}
            </p>
            <p className="text-xs mb-5" style={{ color: "#888888" }}>
              Condition: {invoice.condition || "none"}
            </p>
            <button
              onClick={async () => {
                setReleasingEscrow(true);
                try {
                  const { getSolanaProvider } = await import("@/lib/wallet");
                  const provider = getSolanaProvider();
                  if (!provider) return;
                  await provider.connect();
                  const res = await fetch("/api/escrow", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ invoiceId: id, payerAddress: provider.publicKey?.toString(), action: "release" }),
                  });
                  const data = await res.json();
                  if (data.transaction) {
                    const { Transaction, Connection, clusterApiUrl } = await import("@solana/web3.js");
                    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
                    const tx = Transaction.from(Buffer.from(data.transaction, "base64"));
                    const signedTx = await provider.signTransaction(tx);
                    const signature = await connection.sendRawTransaction(signedTx.serialize());
                    try { await connection.confirmTransaction(signature, "confirmed"); } catch {}
                    window.location.reload();
                  }
                } catch {
                  // silent
                } finally {
                  setReleasingEscrow(false);
                }
              }}
              disabled={releasingEscrow}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#2a2500", border: "1px solid #4a4000", color: "#FFB800", minHeight: "48px" }}
            >
              {releasingEscrow ? "Releasing..." : "Release Escrow to Recipient"}
            </button>
          </div>
        )}

        {/* Audit log */}
        {auditLog.length > 0 && (
          <div className="glass-card rounded-2xl p-5 mb-5">
            <p className="text-xs mb-4" style={{ color: "#555555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Activity Log
            </p>
            <div className="flex flex-col gap-3">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "var(--spark)", marginTop: "5px", flexShrink: 0,
                  }} />
                  <div>
                    <p className="text-sm" style={{ color: "var(--chalk)" }}>{entry.action}</p>
                    <p className="text-xs" style={{ color: "#555555" }}>{entry.details}</p>
                    <p className="text-xs mt-1" style={{ color: "#333333" }}>{formatDate(entry.timestamp)}</p>
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
