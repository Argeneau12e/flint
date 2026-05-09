"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FlintLoader from "@/components/flint-loader";
import { PublicKey } from "@solana/web3.js";

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
  status: string;
  totalAmount: number;
  fundingDeadline?: number;
}

export default function FundPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<EscrowInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [funding, setFunding] = useState(false);
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
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const connectWallet = async () => {
    try {
      const provider = (window as any).solana;
      if (!provider) {
        setError("Phantom wallet not found. Please install Phantom.");
        return;
      }

      const response = await provider.connect();
      const walletPubkey = response.publicKey.toString();
      setUserWallet(walletPubkey);
      setWalletConnected(true);
      setError("");
      console.log('Wallet connected:', walletPubkey);
    } catch (err: any) {
      console.error('Connect error:', err);
      setError(err.message || "Failed to connect wallet");
    }
  };

  const handleFund = async () => {
    // If not connected, connect first
    if (!walletConnected) {
      await connectWallet();
      return;
    }

    setFunding(true);
    try {
      // Step 1: Get escrow details
      const statusRes = await fetch(`/api/escrow/status?id=${id}`);
      const statusData = await statusRes.json();
      
      if (!statusData.escrow) {
        setError('Escrow not found');
        setFunding(false);
        return;
      }

      const escrow = statusData.escrow;
      
      // Step 2: Connect to Solana
      const provider = (window as any).solana;
      if (!provider) {
        setError('Phantom wallet not found');
        setFunding(false);
        return;
      }

      const connection = new (await import('@solana/web3.js')).Connection(
        'https://api.devnet.solana.com'
      );

      // Step 3: Create and send transaction
      const { createEscrowPaymentInstruction, getEscrowAta } = await import('@/lib/solana/simple-escrow');
      
      // Map escrow fields (database uses different names than expected)
      const tokenSymbol = escrow.token || 'USDC';
      const sellerWallet = escrow.creator || escrow.creator_wallet;
      
      // Use USDC devnet mint address
      const USDC_DEVNET_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const mint = new PublicKey(USDC_DEVNET_MINT);
      const seller = new PublicKey(sellerWallet);
      const buyer = new PublicKey(userWallet);
      
      if (!sellerWallet) {
        setError('Invalid escrow: missing creator');
        setFunding(false);
        return;
      }
      
      const escrowAta = await getEscrowAta(mint, id, seller);
      
      // Convert amount to smallest units (6 decimals for USDC)
      const amountInSmallestUnits = Math.floor(escrow.totalAmount * 1000000);
      
      console.log('Creating escrow transaction:', {
        tokenSymbol,
        mint: mint.toString(),
        seller: seller.toString(),
        buyer: buyer.toString(),
        amount: amountInSmallestUnits,
        escrowId: id,
      });
      
      const transaction = await createEscrowPaymentInstruction(
        connection,
        {
          amount: amountInSmallestUnits,
          mint,
          seller,
          buyer,
          escrowId: id,
        },
        escrowAta
      );

      // Fetch latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = buyer;

      // Step 4: Sign and send transaction
      const signature = await provider.signAndSendTransaction(transaction);
      
      // Step 5: Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature.signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed on-chain');
      }

      // Step 6: Update backend with tx signature
      const res = await fetch("/api/escrow/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escrowId: id,
          buyerWallet: userWallet,
          txSignature: signature.signature,
        }),
      });

      const data = await res.json();
      if (data.success || res.ok) {
        sessionStorage.setItem(`funded_${id}`, 'true');
        router.push(`/pay/${id}`);
      } else {
        setError(data.error || 'Failed to fund escrow');
      }
    } catch (err: any) {
      console.error('Fund error:', err);
      setError(err.message || 'Failed to fund escrow');
    } finally {
      setFunding(false);
    }
  };

  const formatAmount = (amount: number, token: string) => {
    return `${amount.toLocaleString()} ${token}`;
  };

  const formatDeadline = (timestamp?: number) => {
    if (!timestamp) return "7 days";
    const diff = timestamp - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Expired";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0f0f" }}>
        <FlintLoader message="Loading escrow..." />
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <main className="min-h-screen px-5 sm:px-8 py-10 sm:py-14">
        <div className="max-w-lg mx-auto text-center">
          <div className="glass-medium rounded-2xl p-8">
            <h1 className="text-2xl font-medium mb-4" style={{ color: "#f7f7f5" }}>Escrow Not Found</h1>
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
          onClick={() => router.push(`/pay/${id}`)}
          className="back-btn mb-6 flex items-center gap-2"
          style={{ background: "none", border: "none", color: "var(--spark)", cursor: "pointer" }}
        >
          <ChevronLeft />
          <span>Back</span>
        </button>

        <div className="glass-medium rounded-2xl p-6 sm:p-8">
          {/* Title */}
          <h1 className="text-2xl font-medium mb-2" style={{ color: "#f7f7f5" }}>
            Fund Escrow
          </h1>

          <p className="text-sm mb-6" style={{ color: "#888" }}>
            Review the details and fund the escrow to proceed.
          </p>

          {/* Amount */}
          <div className="mb-6">
            <div className="text-4xl font-medium mb-1" style={{ color: "#FF6B2B" }}>
              {formatAmount(invoice.totalAmount, invoice.token)}
            </div>
            <div className="text-sm" style={{ color: "#888" }}>
              Total amount to fund
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 mb-8">
            <div>
              <div className="text-xs mb-1" style={{ color: "#666" }}>Invoice</div>
              <div className="text-sm" style={{ color: "#f7f7f5" }}>{invoice.title}</div>
            </div>

            <div>
              <div className="text-xs mb-1" style={{ color: "#666" }}>Funding Deadline</div>
              <div className="text-sm" style={{ color: formatDeadline(invoice.fundingDeadline) === "Expired" ? "#ff4444" : "#888" }}>
                {formatDeadline(invoice.fundingDeadline)}
              </div>
            </div>
          </div>

          {/* Escrow Info */}
          <div
            className="p-4 rounded-xl mb-6"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(59,130,246,0.2)" }}>
                <svg className="w-3 h-3 text-[#3b82f6]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "#3b82f6" }}>How Escrow Works</p>
                <ul className="text-xs mt-2 space-y-1" style={{ color: "#888" }}>
                  <li>• Your funds are held securely in escrow</li>
                  <li>• Seller delivers the work</li>
                  <li>• You review and approve (7 days)</li>
                  <li>• Funds released to seller, or refunded if disputed</li>
                </ul>
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
          <button
            onClick={handleFund}
            disabled={funding}
            className="w-full py-4 rounded-xl font-medium text-white transition-all active:scale-95 disabled:opacity-50 liquid-btn"
            style={{ fontSize: "15px", minHeight: "54px" }}
          >
            {funding ? "Funding Escrow..." : walletConnected ? `Fund ${formatAmount(invoice.totalAmount, invoice.token)}` : "Connect Wallet to Fund"}
          </button>

          <p className="text-xs text-center mt-4" style={{ color: "#666" }}>
            By funding this escrow, you agree to Flint's escrow terms.
          </p>
        </div>
      </div>
    </main>
  );
}
