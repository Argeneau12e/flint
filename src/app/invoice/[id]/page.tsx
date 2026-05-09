"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import FlintLoader from "@/components/flint-loader";

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

function InvoiceCreatedPageInner() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const invoiceUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/pay/${params.id}` 
    : "";

  useEffect(() => {
    if (!params.id) return;
    
    fetch(`/api/escrow/status?id=${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.escrow) {
          setInvoice(data.escrow);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [params.id]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(invoiceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent("Payment Request");
    const body = encodeURIComponent(
      `Hi,\n\nPlease complete the payment using this secure link:\n\n${invoiceUrl}\n\nThanks!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0f0f" }}>
        <FlintLoader message="Loading invoice..." />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen px-5 sm:px-8 py-10 sm:py-14 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-medium mb-4" style={{ color: "var(--chalk)" }}>Invoice Not Found</h1>
          <button
            onClick={() => router.push("/")}
            className="mt-6 px-6 py-3 rounded-xl text-sm font-medium liquid-btn"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-5 sm:px-8 py-10 sm:py-14">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(74,222,128,0.15)', border: '2px solid rgba(74,222,128,0.3)' }}
          >
            <div className="text-[#4ade80]">
              <CheckIcon />
            </div>
          </div>
          <h1 className="text-3xl font-medium mb-2" style={{ color: "var(--chalk)" }}>
            Invoice Created
          </h1>
          <p style={{ color: "#888" }}>
            Share this link with your client to request payment
          </p>
        </div>

        {/* Invoice Summary */}
        <div className="p-6 rounded-2xl glass-medium mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm" style={{ color: "#888" }}>{invoice.title}</p>
              <p className="text-2xl font-bold" style={{ color: "var(--spark)" }}>
                {invoice.amount} {invoice.tokenSymbol}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider" style={{ color: "#666" }}>Fee</p>
              <p className="text-sm font-medium" style={{ color: "#888" }}>
                {invoice.feeAmount?.toFixed(2)} {invoice.tokenSymbol}
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-xs" style={{ color: "#666" }}>
              You'll receive: {(invoice.amount - (invoice.feeAmount || 0)).toFixed(2)} {invoice.tokenSymbol} (after fee)
            </p>
          </div>
        </div>

        {/* Shareable Link */}
        <div className="mb-6">
          <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color: "#666" }}>
            Payment Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={invoiceUrl}
              readOnly
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none font-mono"
              style={{ 
                background: "rgba(15,15,15,0.6)", 
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#888",
              }}
            />
            <button
              onClick={copyLink}
              className="px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2"
              style={{ 
                background: copied ? "rgba(74,222,128,0.2)" : "rgba(255,107,43,0.15)",
                border: "1px solid rgba(255,107,43,0.3)",
                color: copied ? "#4ade80" : "var(--spark)",
              }}
            >
              {copied ? (
                <>
                  <CheckIcon />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share Options */}
        <div className="mb-8">
          <button
            onClick={shareViaEmail}
            className="w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            style={{ 
              background: "rgba(15,15,15,0.5)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#888",
            }}
          >
            <ShareIcon />
            Share via Email
          </button>
        </div>

        {/* What Happens Next */}
        <div className="p-5 rounded-2xl" style={{ background: "rgba(15,15,15,0.5)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: "#666" }}>
            What Happens Next?
          </h2>
          <ol className="space-y-3 text-sm" style={{ color: "#888" }}>
            <li className="flex items-start gap-3">
              <span 
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: "rgba(255,107,43,0.2)", color: "var(--spark)" }}
              >
                1
              </span>
              <span>Share the link with your client via email, chat, or any method</span>
            </li>
            <li className="flex items-start gap-3">
              <span 
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: "rgba(255,107,43,0.2)", color: "var(--spark)" }}
              >
                2
              </span>
              <span>Client clicks the link and completes the secure payment</span>
            </li>
            <li className="flex items-start gap-3">
              <span 
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: "rgba(255,107,43,0.2)", color: "var(--spark)" }}
              >
                3
              </span>
              <span>Once funded, you deliver the work by the deadline</span>
            </li>
            <li className="flex items-start gap-3">
              <span 
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: "rgba(255,107,43,0.2)", color: "var(--spark)" }}
              >
                4
              </span>
              <span>Client reviews and approves — you get paid automatically</span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 py-4 rounded-xl font-medium text-white liquid-btn"
            style={{ fontSize: "15px", minHeight: "54px" }}
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push("/create")}
            className="flex-1 py-4 rounded-xl font-medium transition-all"
            style={{ 
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#888",
              fontSize: "15px",
              minHeight: "54px",
            }}
          >
            Create Another
          </button>
        </div>
      </div>
    </main>
  );
}

export default function InvoiceCreatedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0f0f" }}>
        <FlintLoader message="Loading..." />
      </div>
    }>
      <InvoiceCreatedPageInner />
    </Suspense>
  );
}
