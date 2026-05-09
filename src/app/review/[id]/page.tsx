"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import FlintLoader from "@/components/flint-loader";

const ShieldCheck = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

function ReviewPageInner() {
  const params = useParams();
  const router = useRouter();
  const [escrow, setEscrow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    
    fetch(`/api/escrow/status?id=${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setEscrow(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load invoice");
        setLoading(false);
      });
  }, [params.id]);

  const handleApprove = async () => {
    if (!confirm("Approve payment to Bob? This will release the funds.")) return;
    
    setActionLoading(true);
    try {
      const res = await fetch("/api/escrow/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrowId: params.id }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/review/success");
      } else {
        setError(data.error || "Failed to approve");
      }
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      setError("Please explain the issue");
      return;
    }
    
    setActionLoading(true);
    try {
      const res = await fetch("/api/escrow/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          escrowId: params.id, 
          reason: disputeReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/review/dispute-submitted");
      } else {
        setError(data.error || "Failed to submit dispute");
      }
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0f0f" }}>
        <FlintLoader message="Loading invoice..." />
      </div>
    );
  }

  if (error || !escrow) {
    return (
      <div className="min-h-screen px-5 sm:px-8 py-10 sm:py-14 flex items-center justify-center">
        <div className="max-w-md w-full p-6 rounded-2xl glass-medium text-center">
          <h1 className="text-2xl font-medium mb-4" style={{ color: "var(--chalk)" }}>Error</h1>
          <p style={{ color: "#888" }}>{error || "Invoice not found"}</p>
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

  // Calculate review deadline
  const reviewDeadline = escrow.review_deadline ? new Date(escrow.review_deadline) : null;
  const daysLeft = reviewDeadline 
    ? Math.max(0, Math.ceil((reviewDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 7;

  return (
    <main className="min-h-screen px-5 sm:px-8 py-10 sm:py-14">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium tracking-wide mt-1 mb-2" style={{ color: "var(--chalk)" }}>
            Review Work
          </h1>
          <p style={{ color: "#888888", fontSize: "14px" }}>
            {escrow.title}
          </p>
        </div>

        {/* Protection Badge */}
        <div 
          className="p-4 rounded-xl flex items-center gap-3 mb-6"
          style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}
        >
          <ShieldCheck />
          <div>
            <p className="text-sm font-medium" style={{ color: '#4ade80' }}>Payment Protected</p>
            <p className="text-xs" style={{ color: '#888' }}>
              Bob receives payment only after you approve
            </p>
          </div>
        </div>

        {/* Seller Info */}
        <div className="p-5 rounded-2xl glass-medium mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: "#666", marginBottom: "4px" }}>From</p>
              <p className="text-lg font-medium" style={{ color: "var(--chalk)" }}>
                {escrow.creator?.slice(0, 6)}...{escrow.creator?.slice(-4)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider" style={{ color: "#666", marginBottom: "4px" }}>Amount</p>
              <p className="text-2xl font-bold" style={{ color: "var(--spark)" }}>
                {escrow.amount} {escrow.token}
              </p>
            </div>
          </div>
        </div>

        {/* Deliverables */}
        <div className="p-5 rounded-2xl glass-medium mb-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--chalk)" }}>Deliverables</h2>
          
          {escrow.description && (
            <div className="mb-4 p-4 rounded-xl" style={{ background: "rgba(15,15,15,0.5)" }}>
              <p className="text-sm" style={{ color: "#ccc" }}>{escrow.description}</p>
            </div>
          )}

          {/* Deliverables list (placeholder - would be populated from escrow data) */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(15,15,15,0.3)" }}>
              <FileIcon />
              <span className="text-sm" style={{ color: "#888" }}>Files delivered by Bob</span>
              <span className="text-xs ml-auto" style={{ color: "#666" }}>Just now</span>
            </div>
          </div>
        </div>

        {/* Deadline Warning */}
        <div 
          className="p-4 rounded-xl mb-6 text-center"
          style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)' }}
        >
          <p className="text-sm" style={{ color: '#FFB800' }}>
            ⏱️ {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left to review
          </p>
          <p className="text-xs mt-1" style={{ color: '#888' }}>
            If you don't respond, payment will auto-release to Bob
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!showDisputeForm ? (
            <>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="w-full py-4 rounded-xl font-medium text-white transition-all active:scale-95 disabled:opacity-50 liquid-btn"
                style={{ 
                  fontSize: "15px", 
                  minHeight: "54px",
                  background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                }}
              >
                {actionLoading ? "Processing..." : "✅ Approve & Release Payment"}
              </button>
              
              <button
                onClick={() => setShowDisputeForm(true)}
                disabled={actionLoading}
                className="w-full py-4 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50"
                style={{ 
                  fontSize: "15px", 
                  minHeight: "54px",
                  background: 'rgba(255,107,107,0.1)',
                  border: '1px solid rgba(255,107,107,0.3)',
                  color: '#ff6b6b',
                }}
              >
                🚩 Report an Issue
              </button>
            </>
          ) : (
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)' }}>
              <h3 className="text-lg font-semibold mb-3" style={{ color: '#ff6b6b' }}>Report an Issue</h3>
              <p className="text-sm mb-4" style={{ color: '#888' }}>
                Explain what's wrong with the delivery. Our AI will review and help resolve.
              </p>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="What's the issue? (be specific)"
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-3"
                style={{ 
                  background: 'rgba(15,15,15,0.6)', 
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'var(--chalk)',
                  resize: 'none',
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisputeForm(false)}
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-xl font-medium transition-all"
                  style={{ 
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#888',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispute}
                  disabled={actionLoading || !disputeReason.trim()}
                  className="flex-1 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50"
                  style={{ 
                    background: '#ff6b6b',
                  }}
                >
                  {actionLoading ? "Submitting..." : "Submit Dispute"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <p className="text-xs mt-6 text-center" style={{ color: "#333333" }}>
          Questions? Contact support@flint.pay
        </p>
      </div>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0f0f" }}>
        <FlintLoader message="Loading..." />
      </div>
    }>
      <ReviewPageInner />
    </Suspense>
  );
}
