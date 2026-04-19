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
}

export default function HandlePage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/invoice/create?handle=${handle}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        if (data.id) {
          setInvoice(data);
          router.push(`/pay/${data.id}`);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [handle, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-2" style={{ color: "var(--chalk)" }}>
            flint.pay/{handle}
          </p>
          <p className="text-sm" style={{ color: "#888888" }}>
            Loading payment request...
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
              <polygon
                points="32,6 54,18 54,46 32,58 10,46 10,18"
                stroke="white"
                strokeWidth="2.5"
                fill="none"
              />
              <polyline
                points="48,8 60,8 60,20"
                stroke="#FF6B2B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <rect x="24" y="24" width="6" height="20" rx="2" fill="white" />
              <rect x="30" y="24" width="14" height="6" rx="2" fill="white" />
              <rect x="30" y="34" width="10" height="5" rx="2" fill="white" />
            </svg>
          </div>
          <h1
            className="text-2xl font-medium mb-2"
            style={{ color: "var(--chalk)" }}
          >
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
    <main className="min-h-screen flex items-center justify-center">
      <p style={{ color: "#888888" }}>Redirecting...</p>
    </main>
  );
}