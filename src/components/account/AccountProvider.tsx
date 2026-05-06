'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from '@/hooks/useAccount';
import UsernameSignup from './UsernameSignup';

interface AccountProviderProps {
  children: ReactNode;
}

export function AccountProvider({ children }: AccountProviderProps) {
  const { connected, publicKey } = useWallet();
  const { account, loading, hasAccount } = useAccount();
  const [showSignup, setShowSignup] = useState(false);

  // Check if user needs to signup when wallet connects
  useEffect(() => {
    if (connected && !loading) {
      if (!hasAccount && publicKey) {
        // Wallet connected but no account exists - show signup
        setShowSignup(true);
      }
    }
  }, [connected, loading, hasAccount, publicKey]);

  const handleSignupSuccess = (username: string) => {
    setShowSignup(false);
    console.log('Account created:', username);
    // Could redirect to dashboard or show success message
  };

  const handleSignupCancel = () => {
    setShowSignup(false);
    // User cancelled signup - they can still browse but can't create invoices
  };

  return (
    <>
      {children}
      
      {showSignup && connected && publicKey && (
        <UsernameSignup
          walletAddress={publicKey.toString()}
          onSuccess={handleSignupSuccess}
          onCancel={handleSignupCancel}
        />
      )}
    </>
  );
}
