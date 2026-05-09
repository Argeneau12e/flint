"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NotificationsBell from "@/components/dashboard/NotificationsBell";
import PendingWork from "@/components/dashboard/PendingWork";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [walletAddress, setWalletAddress] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "notifications">("pending");

  useEffect(() => {
    checkWallet();
    
    // Check for tab param from notifications
    const tab = searchParams.get('tab');
    if (tab === 'notifications') {
      setActiveTab('notifications');
    }
  }, [searchParams]);

  const checkWallet = async () => {
    if ((window as any).solana) {
      try {
        const resp = await (window as any).solana.connect();
        setWalletAddress(resp.publicKey.toString());
        setWalletConnected(true);
      } catch (err) {
        console.error('Wallet not connected');
      }
    }
  };

  const connectWallet = async () => {
    if ((window as any).solana) {
      try {
        const resp = await (window as any).solana.connect();
        setWalletAddress(resp.publicKey.toString());
        setWalletConnected(true);
      } catch (err) {
        console.error('Wallet connect error:', err);
      }
    } else {
      alert('Phantom wallet not found! Please install it.');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(10,10,10,0.8)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ color: '#f7f7f5' }}>
            Dashboard
          </h1>
          <div className="flex items-center gap-4">
            {walletConnected && <NotificationsBell walletAddress={walletAddress} />}
            <button
              onClick={connectWallet}
              className="px-4 py-2 rounded-xl font-semibold text-sm transition-all"
              style={{ 
                background: walletConnected ? 'rgba(255,255,255,0.1)' : '#FF6B2B',
                color: walletConnected ? '#888' : '#0a0a0a',
              }}
            >
              {walletConnected 
                ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
                : 'Connect Wallet'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === 'pending' ? 'rgba(255,107,43,0.15)' : 'transparent',
                color: activeTab === 'pending' ? '#FF6B2B' : '#666',
              }}
            >
              Pending Work
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === 'completed' ? 'rgba(255,107,43,0.15)' : 'transparent',
                color: activeTab === 'completed' ? '#FF6B2B' : '#666',
              }}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === 'notifications' ? 'rgba(255,107,43,0.15)' : 'transparent',
                color: activeTab === 'notifications' ? '#FF6B2B' : '#666',
              }}
            >
              Notifications
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {!walletConnected ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#f7f7f5' }}>
              Connect Your Wallet
            </h2>
            <p className="mb-6" style={{ color: '#888' }}>
              Connect to view your pending work and notifications
            </p>
            <button
              onClick={connectWallet}
              className="px-6 py-3 rounded-xl font-semibold"
              style={{ background: '#FF6B2B', color: '#0a0a0a' }}
            >
              Connect Phantom
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'pending' && <PendingWork walletAddress={walletAddress} />}
            
            {activeTab === 'completed' && (
              <div className="text-center py-12" style={{ color: '#666' }}>
                <div className="text-4xl mb-4">✅</div>
                <p>Completed projects will appear here</p>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="text-center py-12" style={{ color: '#666' }}>
                <div className="text-4xl mb-4">🔔</div>
                <p>Check the notification bell in the header!</p>
                <p className="text-sm mt-2">Notifications appear there in real-time</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
