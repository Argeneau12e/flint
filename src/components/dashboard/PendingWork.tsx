"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Escrow {
  id: string;
  title: string;
  amount: number;
  token_symbol: string;
  state: string;
  created_at: string;
  funded_at?: string;
  delivery_deadline?: number;
  client_email?: string;
  description?: string;
}

interface PendingWorkProps {
  walletAddress: string;
}

export default function PendingWork({ walletAddress }: PendingWorkProps) {
  const router = useRouter();
  const [pendingWork, setPendingWork] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) return;
    fetchPendingWork();
  }, [walletAddress]);

  const fetchPendingWork = async () => {
    try {
      const res = await fetch(`/api/escrow/pending?wallet=${walletAddress}`);
      const data = await res.json();
      setPendingWork(data.escrows || []);
    } catch (err) {
      console.error('Fetch pending work error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDeadlineText = (deadline?: number) => {
    if (!deadline) return "No deadline";
    const diff = deadline - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Overdue!";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'funded_active':
        return { bg: 'rgba(255, 107, 43, 0.15)', text: '#FF6B2B', border: 'rgba(255, 107, 43, 0.3)' };
      case 'delivered_review':
        return { bg: 'rgba(107, 139, 255, 0.15)', text: '#6B8BFF', border: 'rgba(107, 139, 255, 0.3)' };
      default:
        return { bg: 'rgba(136, 136, 136, 0.15)', text: '#888', border: 'rgba(136, 136, 136, 0.3)' };
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center" style={{ color: '#666' }}>
        Loading pending work...
      </div>
    );
  }

  if (pendingWork.length === 0) {
    return (
      <div className="p-8 text-center" style={{ color: '#666' }}>
        <div className="text-4xl mb-4">🎉</div>
        <p>No pending work!</p>
        <p className="text-sm mt-2">New funded projects will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingWork.map((escrow) => {
        const stateColors = getStateColor(escrow.state);
        return (
          <div
            key={escrow.id}
            className="p-5 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${stateColors.border}`,
            }}
            onClick={() => router.push(`/deliver/${escrow.id}`)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-base font-semibold" style={{ color: '#f7f7f5' }}>
                  {escrow.title}
                </h3>
                <p className="text-sm mt-1" style={{ color: '#888' }}>
                  Client: {escrow.client_email || 'Private'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold" style={{ color: '#f7f7f5' }}>
                  {escrow.amount.toLocaleString()} {escrow.token_symbol}
                </div>
                <div 
                  className="text-xs px-2 py-1 rounded-full mt-1 inline-block"
                  style={{ background: stateColors.bg, color: stateColors.text }}
                >
                  {escrow.state.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-xs" style={{ color: '#666' }}>
                {getDeadlineText(escrow.delivery_deadline)}
              </div>
              <button
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                style={{
                  background: stateColors.text,
                  color: '#0a0a0a',
                }}
              >
                {escrow.state === 'funded_active' ? 'Start Work' : 'Review Delivery'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
