"use client";

declare global {
  interface Window {
    solana?: {
      connect: () => Promise<void>;
      publicKey: { toString: () => string };
      signAndSendTransaction: (tx: unknown) => Promise<{ signature: string }>;
    };
  }
}

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Logo from "@/components/logo";

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
}
export default function PayPage() {
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [txSig, setTxSig] = useState("");
  const [escrowMode, setEscrowMode] = useState(false);
  const [escrowed, setEscrowed] = useState(false);
  const [escrowAddress, setEscrowAddress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoice/status?id=${id}`);
        const data = await res.json();
        if (data.invoice) {
          setInvoice(data.invoice);
          if (data.status === "paid") {
            setTxSig(data.invoice.txSignature || "");
            setPaid(true);
          }
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
      try {
        const res = await fetch(`/api/invoice/status?id=${id}`);
        const data = await res.json();
        if (data.invoice) {
          setInvoice(data.invoice);
          if (data.status === "paid") {
            setTxSig(data.invoice.txSignature || "");
            setPaid(true);
            clearInterval(interval);
          }
        }
      } catch {
        console.error("Polling error");
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [id]);

  const handlePay = async () => {
    setError("");
    setPaying(true);
    try {
      if (!window.solana) {
        setError("No Solana wallet found. Please install Phantom wallet.");
        setPaying(false);
        return;
      }
      await window.solana.connect();
      const res = await fetch(`/api/pay/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: window.solana.publicKey.toString(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setPaying(false);
        return;
      }
      const transaction = data.transaction;
      const { Transaction, Connection, clusterApiUrl } = await import("@solana/web3.js");
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const tx = Transaction.from(Buffer.from(transaction, "base64"));
      const { signature } = await window.solana.signAndSendTransaction(tx);
      console.log("Transaction signature:", signature);
      try {
        await connection.confirmTransaction(signature, "confirmed");
      } catch {
        console.log("Confirmation timeout — transaction likely succeeded");
      }

      await fetch(`/api/receipt/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txSignature: signature,
          payerWallet: window.solana.publicKey.toString(),
        }),
      });

      setTxSig(signature);
      setPaid(true);
    } catch (err) {
      console.error(err);
      setError("Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const isExpired = invoice ? Date.now() > invoice.expiresAt : false;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p style={{ color: "#888888" }}>Loading payment request...</p>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-2" style={{ color: "var(--chalk)" }}>
            Payment request not found
          </p>
          <a href="/" style={{ color: "var(--spark)", fontSize: "14px" }}>
            Back to Flint
          </a>
        </div>
      </main>
    );
  }

  if (paid) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <div className="verified-badge-lg animate-scale-in mx-auto mb-4">
              ✓
            </div>
            <h1 className="text-2xl font-medium mb-1" style={{ color: "#4ade80" }}>
              Payment Confirmed
            </h1>
            <p className="text-sm" style={{ color: "#888888" }}>
              On-chain receipt generated
            </p>
          </div>

          <div
            className="rounded-2xl p-6 mb-4 flex flex-col gap-3"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          >
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>Amount</p>
              <p className="text-sm font-medium" style={{ color: "#4ade80" }}>
                {invoice?.amount} {invoice?.token}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>Invoice</p>
              <p className="text-sm" style={{ color: "var(--chalk)" }}>
                {invoice?.title}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>Network</p>
              <p className="text-sm" style={{ color: "#888888" }}>
                Solana Devnet
              </p>
            </div>
            <div style={{ borderTop: "1px solid #1f1f1f", paddingTop: "12px" }}>
              <p className="text-xs mb-2" style={{ color: "#555555" }}>
                Transaction Signature
              </p>
              <p className="text-xs font-mono break-all" style={{ color: "var(--spark)" }}>
                {txSig}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.open(
                `https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
                "_blank"
              )}
              className="w-full py-3 rounded-2xl text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "#111111", border: "1px solid #1f1f1f", color: "var(--chalk)" }}
            >
              View on Solana Explorer
            </button>
            <button
              onClick={() => window.open(`/verify/${txSig}`, "_blank")}
              className="w-full py-3 rounded-2xl text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "#0a1a0a", border: "1px solid #1a3a1a", color: "#4ade80" }}
            >
              Share Verified Receipt
            </button>
            <button
              onClick={() => {
                const msg = `Payment confirmed on Solana. Verify here: ${window.location.origin}/verify/${txSig}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
              }}
              className="w-full py-3 rounded-2xl text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "#0a1f0a", border: "1px solid #1a3a1a", color: "#4ade80" }}
            >
              Share via WhatsApp
            </button>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "#333333" }}>
            Powered by Flint · Secured by Solana
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full">

        {/* Flint branding */}
        <div className="flex items-center justify-center mb-8">
          <Logo size={32} />
        </div>

        {/* Payment card */}
        <div
          className="glass-medium rounded-2xl p-8 mb-4"
        >
          <p className="text-xs mb-1" style={{ color: "#555555" }}>
            PAYMENT REQUEST
          </p>
          <h1
            className="text-xl font-medium mb-6"
            style={{ color: "var(--chalk)" }}
          >
            {invoice.title}
          </h1>

          {/* Amount */}
          <div
            className="glass-light flex items-center justify-center py-8 mb-6 rounded-xl"
          >
            <span
              className="text-5xl font-medium"
              style={{ color: "var(--spark)" }}
            >
              {invoice.amount}
            </span>
            <span
              className="text-xl ml-3 mt-2"
              style={{ color: "#888888" }}
            >
              {invoice.token}
            </span>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-3 mb-6">
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
            {invoice.condition && (
              <div
                className="px-4 py-3 rounded-xl"
                style={{ background: "#1a1500", border: "1px solid #3a3000" }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: "#FFB800" }}>
                  CONDITION
                </p>
                <p className="text-sm" style={{ color: "#FFB800" }}>
                  {invoice.condition}
                </p>
              </div>
            )}
            
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>
                To
              </p>
              <p className="text-sm font-mono" style={{ color: "var(--chalk)" }}>
                {invoice.recipientWallet.slice(0, 4)}...
                {invoice.recipientWallet.slice(-4)}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm" style={{ color: "#555555" }}>
                Network
              </p>
              <p className="text-sm" style={{ color: "#888888" }}>
                Solana Devnet
              </p>
            </div>
          </div>

          {isExpired ? (
            <div
              className="w-full py-4 rounded-xl text-center font-medium"
              style={{ background: "#1a0a0a", color: "#ff6b6b" }}
            >
              This payment request has expired
            </div>
          ) : escrowed ? (
            <div
              className="flex flex-col gap-3"
            >
              <div
                className="w-full py-4 rounded-xl text-center"
                style={{ background: "#1a1500", border: "1px solid #3a3000", color: "#FFB800" }}
              >
                Funds held in escrow
              </div>
              <p className="text-xs text-center font-mono" style={{ color: "#555555" }}>
                {escrowAddress.slice(0, 8)}...{escrowAddress.slice(-8)}
              </p>
            </div>
          ) : invoice.condition ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full py-4 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--spark)" }}
              >
                {paying ? "Confirming..." : `Pay ${invoice.amount} ${invoice.token}`}
              </button>
              <button
                onClick={async () => {
                  if (!window.solana) return;
                  setPaying(true);
                  try {
                    await window.solana.connect();
                    const res = await fetch("/api/escrow", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        invoiceId: id,
                        payerAddress: window.solana.publicKey.toString(),
                        action: "fund",
                      }),
                    });
                    const data = await res.json();
                    if (data.transaction) {
                      const { Transaction, Connection, clusterApiUrl } = await import("@solana/web3.js");
                      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
                      const tx = Transaction.from(Buffer.from(data.transaction, "base64"));
                      const { signature } = await window.solana.signAndSendTransaction(tx);
                      try { await connection.confirmTransaction(signature, "confirmed"); } catch {}
                      setEscrowAddress(data.escrowAddress);
                      setEscrowed(true);
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setPaying(false);
                  }
                }}
                disabled={paying}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "#1a1500", border: "1px solid #3a3000", color: "#FFB800" }}
              >
                {paying ? "Processing..." : "Hold in Escrow Until Condition Met"}
              </button>
            </div>
          ) : (
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full py-4 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: "var(--spark)" }}
            >
              {paying ? "Confirming payment..." : `Pay ${invoice.amount} ${invoice.token}`}
            </button>
          )}

          {error && (
            <p
              className="text-sm mt-3 px-4 py-3 rounded-xl"
              style={{ background: "#1a0a0a", color: "#ff6b6b" }}
            >
              {error}
            </p>
          )}
        </div>

        <p className="text-center text-xs" style={{ color: "#333333" }}>
          Powered by Flint · Secured by Solana
        </p>

      </div>
    </main>
  );
}