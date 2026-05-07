'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getUserByWallet, getUserByUsername } from '@/lib/supabase';
import { getTierFromPoints as getBadgeTier } from '@/components/account/ReputationBadge';

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  walletAddress: string;
  email?: string;
  badgeTier: 'gray' | 'green' | 'blue' | 'gold';
  reputationPoints: number;
  createdAt: string;
}

export function useAccount() {
  const { publicKey, connected } = useWallet();
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch account when wallet connects
  useEffect(() => {
    async function fetchAccount() {
      if (!publicKey || !connected) {
        setAccount(null);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const walletAddress = publicKey.toString();
        const user = await getUserByWallet(walletAddress);

        if (user) {
          setAccount({
            id: user.id,
            username: user.username,
            displayName: user.display_name || user.username,
            walletAddress: user.wallet_address,
            email: user.email,
            badgeTier: user.reputation?.[0]?.badge_tier || getBadgeTier(user.reputation?.[0]?.points || 0),
            reputationPoints: user.reputation?.[0]?.points || 0,
            createdAt: user.created_at,
          });
        } else {
          setAccount(null);
        }
      } catch (err: any) {
        console.error('Fetch account error:', err);
        setError(err.message || 'Failed to load account');
        setAccount(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAccount();
  }, [publicKey, connected]);

  // Refresh account data
  const refresh = useCallback(async () => {
    if (!publicKey) return;

    try {
      const walletAddress = publicKey.toString();
      const user = await getUserByWallet(walletAddress);

      if (user) {
        setAccount({
          id: user.id,
          username: user.username,
          displayName: user.display_name || user.username,
          walletAddress: user.wallet_address,
          email: user.email,
          badgeTier: user.reputation?.[0]?.badge_tier || getBadgeTier(user.reputation?.[0]?.points || 0),
          reputationPoints: user.reputation?.[0]?.points || 0,
          createdAt: user.created_at,
        });
      }
    } catch (err) {
      console.error('Refresh error:', err);
    }
  }, [publicKey]);

  return {
    account,
    loading,
    error,
    refresh,
    hasAccount: !!account,
    isConnected: connected,
  };
}
