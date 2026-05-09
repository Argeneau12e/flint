"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Escrow {
  id: string;
  title: string;
  amount: number;
  token_symbol: string;
  state: string;
  description: string;
  conditions: string;
  client_email?: string;
  delivery_deadline?: number;
}

export default function DeliverPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [delivering, setDelivering] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    fetchEscrow();
    checkWallet();
  }, []);

  const checkWallet = async () => {
    if ((window as any).solana) {
      try {
        const resp = await (window as any).solana.connect();
        setWalletAddress(resp.publicKey.toString());
      } catch (err) {
        console.error('Wallet not connected');
      }
    }
  };

  const fetchEscrow = async () => {
    try {
      const res = await fetch(`/api/escrow/status?id=${id}`);
      const data = await res.json();
      setEscrow(data.escrow);
    } catch (err) {
      console.error('Fetch escrow error:', err);
      setError('Failed to load escrow');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (!deliveryNotes && !deliveryUrl) {
      setError('Please add delivery notes or a delivery link');
      return;
    }

    setDelivering(true);
    setError("");

    try {
      const res = await fetch("/api/escrow/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escrowId: id,
          sellerWallet: walletAddress,
          deliveryNotes,
          deliveryUrl,
        }),
      });

      const data = await res.json();
      
      if (data.success || res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to submit delivery');
      }
    } catch (err: any) {
      console.error('Deliver error:', err);
      setError('Failed to submit delivery');
    } finally {
      setDelivering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: '#888' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center" style={{ color: '#888' }}>
          <p>Escrow not found</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 rounded-lg"
            style={{ background: '#FF6B2B', color: '#0a0a0a' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0a0a' }}>
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#f7f7f5' }}>
            Delivery Submitted!
          </h1>
          <p className="mb-6" style={{ color: '#888' }}>
            {escrow.client_email} has been notified and will review your work.
          </p>
          
          <div 
            className="p-4 rounded-xl mb-6 text-left"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <p className="text-sm mb-2" style={{ color: '#888' }}>Share this link with your client:</p>
            <p className="text-xs break-all" style={{ color: '#FF6B2B' }}>
              {typeof window !== 'undefined' ? window.location.origin : ''}/review/{id}
            </p>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 rounded-xl font-semibold"
            style={{ background: '#FF6B2B', color: '#0a0a0a' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ background: '#0a0a0a' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6"
          style={{ color: '#888' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#f7f7f5' }}>
          Submit Delivery
        </h1>
        <p className="mb-6" style={{ color: '#888' }}>
          {escrow.title}
        </p>

        {/* Escrow Details */}
        <div 
          className="p-4 rounded-xl mb-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex justify-between items-center mb-3">
            <span style={{ color: '#888' }}>Payment Amount</span>
            <span className="text-xl font-bold" style={{ color: '#f7f7f5' }}>
              {escrow.amount.toLocaleString()} {escrow.token_symbol}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ color: '#888' }}>Client</span>
            <span style={{ color: '#f7f7f5' }}>
              {escrow.client_email || 'Private'}
            </span>
          </div>
        </div>

        {/* Conditions */}
        {escrow.conditions && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#888' }}>
              Project Requirements
            </h3>
            <div 
              className="p-4 rounded-xl text-sm"
              style={{ background: 'rgba(255,255,255,0.03)', color: '#ccc' }}
            >
              {escrow.conditions}
            </div>
          </div>
        )}

        {/* Delivery Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#888' }}>
              Delivery Notes *
            </label>
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Describe what you're delivering, any instructions for the client, etc."
              rows={4}
              className="w-full p-3 rounded-xl resize-none"
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f7f7f5',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#888' }}>
              Delivery Link (Optional)
            </label>
            <input
              type="url"
              value={deliveryUrl}
              onChange={(e) => setDeliveryUrl(e.target.value)}
              placeholder="https://drive.google.com/..., https://figma.com/..., etc."
              className="w-full p-3 rounded-xl"
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f7f7f5',
              }}
            />
            <p className="text-xs mt-2" style={{ color: '#666' }}>
              Link to Google Drive, Figma, Dropbox, or any file sharing service
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(255,0,0,0.1)', color: '#ff4444' }}>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleDeliver}
          disabled={delivering}
          className="w-full mt-6 py-4 rounded-xl font-semibold transition-all"
          style={{ 
            background: delivering ? '#666' : '#FF6B2B', 
            color: delivering ? '#999' : '#0a0a0a',
          }}
        >
          {delivering ? 'Submitting...' : 'Submit Delivery'}
        </button>

        <p className="text-xs text-center mt-4" style={{ color: '#666' }}>
          Once submitted, the client will be notified and can review your work.
        </p>
      </div>
    </div>
  );
}
