"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FlintLoader from "@/components/flint-loader";

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

interface EscrowInvoice {
  id: string;
  title: string;
  amount: number;
  token: string;
  memo: string;
  creator: string;
  recipient: string;
  status: string;
  feeAmount: number;
  totalAmount: number;
  createdAt: number;
  acceptanceDeadline?: number;
  fundingDeadline?: number;
  reviewDeadline?: number;
  expiresAt?: number;
}

export default function PayPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<EscrowInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userWallet, setUserWallet] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/escrow/status?id=${id}`);
        const data = await res.json();
        if (data.escrow) {
          setInvoice(data.escrow);
        } else {
          setError("Invoice not found");
        }
      } catch (err) {
        setError("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const connectWallet = async () => {
    try {
      // Check for Phantom
      const provider = (window as any).solana;
      if (!provider) {
        setError("Phantom wallet not found. Please install Phantom.");
        return;
      }

      const response = await provider.connect();
      setUserWallet(response.publicKey.toString());
      setWalletConnected(true);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    }
  };

  const handleAccept = async () => {
    if (!walletConnected) {
      await connectWallet();
      return;
    }

    setPaying(true);
    try {
      const res = await fetch("/api/escrow/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escrowId: id,
          buyerWallet: userWallet,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Redirect to funding page
        router.push(`/pay/${id}/fund`);
      } else {
        setError(data.error || "Failed to accept invoice");
      }
    } catch (err: any) {
      setError(err.message || "Failed to accept invoice");
    } finally {
      setPaying(false);
    }
  };

  const formatAmount = (amount: number, token: string) => {
    return `${amount.toLocaleString()} ${token}`;
  };

  const formatDeadline = (timestamp: number) => {
    // Timestamp is now in milliseconds (not seconds)
    const diff = timestamp - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Expired";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "#888888",
      pending_acceptance: "#FFB800",
      accepted_waiting_funding: "#FFB800",
      funded_active: "#3b82f6",
      delivered_review: "#8b5cf6",
      released_complete: "#4ade80",
      disputed: "#ff4444",
      auto_approved: "#4ade80",
      auto_cancelled: "#888888",
      refunded: "#ff4444",
    };
    return colors[status] || "#888888";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Draft",
      pending_acceptance: "Pending Acceptance",
      accepted_waiting_funding: "Waiting Funding",
      funded_active: "Active",
      delivered_review: "In Review",
      released_complete: "Complete",
      disputed: "Disputed",
      auto_approved: "Auto-Approved",
      auto_cancelled: "Cancelled",
      refunded: "Refunded",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0f0f" }}>
        <FlintLoader message="Loading invoice..." />
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <main className="min-h-screen px-5 sm:px-8 py-10 sm:py-14">
        <div className="max-w-lg mx-auto text-center">
          <div className="glass-medium rounded-2xl p-8">
            <h1 className="text-2xl font-medium mb-4" style={{ color: "#f7f7f5" }}>Invoice Not Found</h1>
            <p className="text-sm mb-6" style={{ color: "#888" }}>{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 rounded-xl font-medium liquid-btn"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!invoice) return null;

  return (
    <main className="min-h-screen px-5 sm:px-8 py-10 sm:py-14">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => router.push("/")}
          className="back-btn mb-6 flex items-center gap-2"
          style={{ background: "none", border: "none", color: "var(--spark)", cursor: "pointer" }}
        >
          <ChevronLeft />
          <span>Back</span>
        </button>

        <div className="glass-medium rounded-2xl p-6 sm:p-8">
          {/* Status Badge */}
          <div className="mb-6">
            <span
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{
                background: `${getStatusColor(invoice.status)}15`,
                color: getStatusColor(invoice.status),
                border: `1px solid ${getStatusColor(invoice.status)}30`,
              }}
            >
              {getStatusLabel(invoice.status)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-medium mb-2" style={{ color: "#f7f7f5" }}>
            {invoice.title}
          </h1>

          {/* Amount */}
          <div className="mb-6">
            <div className="text-4xl font-medium mb-1" style={{ color: "#FF6B2B" }}>
              {formatAmount(invoice.totalAmount, invoice.token)}
            </div>
            {invoice.feeAmount > 0 && (
              <div className="text-sm" style={{ color: "#888" }}>
                Includes {formatAmount(invoice.feeAmount, invoice.token)} Flint fee
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4 mb-8">
            <div>
              <div className="text-xs mb-1" style={{ color: "#666" }}>Recipient</div>
              <div className="text-sm font-mono" style={{ color: "#888" }}>
                {invoice.creator.slice(0, 6)}...{invoice.creator.slice(-4)}
              </div>
            </div>

            {invoice.memo && (
              <div>
                <div className="text-xs mb-1" style={{ color: "#666" }}>Description</div>
                <div className="text-sm" style={{ color: "#f7f7f5" }}>{invoice.memo}</div>
              </div>
            )}

            <div>
              <div className="text-xs mb-1" style={{ color: "#666" }}>Acceptance Deadline</div>
              <div className="text-sm" style={{ color: invoice.acceptanceDeadline && formatDeadline(invoice.acceptanceDeadline) === "Expired" ? "#ff4444" : "#888" }}>
                {invoice.acceptanceDeadline ? formatDeadline(invoice.acceptanceDeadline) : '7 days'}
              </div>
            </div>
          </div>

          {/* Escrow Info */}
          <div
            className="p-4 rounded-xl mb-6"
            style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(74,222,128,0.2)" }}>
                <svg className="w-3 h-3 text-[#4ade80]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "#4ade80" }}>Escrow Protected</p>
                <p className="text-xs mt-1" style={{ color: "#888" }}>
                  Your funds are held securely until you approve the work.
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.2)" }}>
              <p className="text-sm" style={{ color: "#ff4444" }}>{error}</p>
            </div>
          )}

          {/* Action Button */}
          {(invoice.status === "pending_acceptance" || invoice.status === "draft") && (
            <button
              onClick={handleAccept}
              disabled={paying}
              className="w-full py-4 rounded-xl font-medium text-white transition-all active:scale-95 disabled:opacity-50 liquid-btn"
              style={{ fontSize: "15px", minHeight: "54px" }}
            >
              {paying ? "Processing..." : walletConnected ? "Accept & Fund Escrow" : "Connect Wallet to Accept"}
            </button>
          )}

          {invoice.status === "draft" && (
            <p className="text-xs text-center mt-3" style={{ color: "#888" }}>
              This invoice is in draft status. Connect wallet to accept.
            </p>
          )}

          {invoice.status === "accepted_waiting_funding" && walletConnected && (
            <button
              onClick={() => router.push(`/pay/${id}/fund`)}
              className="w-full py-4 rounded-xl font-medium text-white transition-all active:scale-95 liquid-btn"
              style={{ fontSize: "15px", minHeight: "54px" }}
            >
              Fund Escrow
            </button>
          )}

          {invoice.status === "funded_active" && (
            <div className="text-center p-4 rounded-xl" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <p className="text-sm font-medium" style={{ color: "#3b82f6" }}>Escrow Funded - Waiting Delivery</p>
              <p className="text-xs mt-1" style={{ color: "#888" }}>The seller has been notified to deliver the work.</p>
            </div>
          )}

          {invoice.status === "delivered_review" && (
            <div className="space-y-3">
              <div className="text-center p-4 rounded-xl" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <p className="text-sm font-medium" style={{ color: "#8b5cf6" }}>Work Delivered - Review Period</p>
                <p className="text-xs mt-1" style={{ color: "#888" }}>Review the work and approve or dispute.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/pay/${id}/review`)}
                  className="flex-1 py-3 rounded-xl font-medium transition-all"
                  style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80" }}
                >
                  Approve
                </button>
                <button
                  onClick={() => router.push(`/pay/${id}/dispute`)}
                  className="flex-1 py-3 rounded-xl font-medium transition-all"
                  style={{ background: "rgba(255,68,68,0.15)", border: "1px solid rgba(255,68,68,0.3)", color: "#ff4444" }}
                >
                  Dispute
                </button>
              </div>
            </div>
          )}

          {["released_complete", "auto_approved", "auto_cancelled", "refunded", "disputed"].includes(invoice.status) && (
            <div className={`text-center p-4 rounded-xl`} style={{ background: `${getStatusColor(invoice.status)}15`, border: `1px solid ${getStatusColor(invoice.status)}30` }}>
              <p className="text-sm font-medium" style={{ color: getStatusColor(invoice.status) }}>
                {getStatusLabel(invoice.status)}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
