'use client';

import { useState, useEffect } from 'react';
import { supabase, checkUsernameAvailable, createUserRecord } from '@/lib/supabase';

interface UsernameSignupProps {
  walletAddress: string;
  onSuccess: (username: string) => void;
  onCancel: () => void;
}

export default function UsernameSignup({ walletAddress, onSuccess, onCancel }: UsernameSignupProps) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debounced username availability check
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (username.length >= 3) {
        setChecking(true);
        try {
          console.log('Checking username:', username);
          const isAvailable = await checkUsernameAvailable(username);
          console.log('Username available:', isAvailable);
          setAvailable(isAvailable);
        } catch (err: any) {
          console.error('Username check error:', err);
          console.error('Error details:', {
            message: err?.message,
            code: err?.code,
            details: err?.details,
            hint: err?.hint,
          });
          setAvailable(null);
        } finally {
          setChecking(false);
        }
      } else {
        setAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (username.length > 30) {
      setError('Username must be 30 characters or less');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (!available) {
      setError('This username is not available');
      return;
    }

    setLoading(true);

    try {
      console.log('Starting signup:', { walletAddress, username, email });
      
      // Create user record in Supabase
      console.log('Creating user record...');
      const user = await createUserRecord(walletAddress, username, email || undefined);
      console.log('User created:', user);

      // Initialize reputation and settings
      console.log('Creating reputation record...');
      const repResult = await supabase.from('reputation').insert([{
        user_id: user.id,
        points: 0,
        badge_tier: 'gray',
        completed_as_seller: 0,
        completed_as_buyer: 0,
        disputes_lost: 0,
      }]);
      console.log('Reputation result:', repResult);

      console.log('Creating settings record...');
      const settingsResult = await supabase.from('settings').insert([{
        user_id: user.id,
        auto_release_enabled: false,
        auto_release_threshold: 90,
        email_notifications: true,
      }]);
      console.log('Settings result:', settingsResult);

      onSuccess(username);
    } catch (err: any) {
      console.error('Signup error:', err);
      console.error('Error details:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        stack: err?.stack,
      });
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div 
        className="glass-medium rounded-2xl p-8 max-w-md w-full"
        style={{ background: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <h2 className="text-2xl font-medium mb-2" style={{ color: '#f7f7f5' }}>
          Create Your Flint Account
        </h2>
        <p className="text-sm mb-6" style={{ color: '#888' }}>
          Choose a unique username to get started. This will be permanently tied to your wallet.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs mb-2" style={{ color: '#888' }}>
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border outline-none transition-all"
                style={{ 
                  borderColor: available === false ? 'rgba(255,68,68,0.5)' : available === true ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.1)',
                  color: '#f7f7f5'
                }}
                autoComplete="off"
                disabled={loading}
              />
              {checking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[#FF6B2B] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {available === true && !checking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4ade80]">✓</div>
              )}
              {available === false && !checking && username.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">✗</div>
              )}
            </div>
            {available === false && username.length >= 3 && (
              <p className="text-xs mt-1 text-red-400">This username is taken</p>
            )}
          </div>

          {/* Display Name (Optional) */}
          <div>
            <label className="block text-xs mb-2" style={{ color: '#888' }}>
              Display Name <span className="text-[#666]">(optional)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Same as username"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none transition-all"
              style={{ color: '#f7f7f5' }}
              disabled={loading}
            />
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-xs mb-2" style={{ color: '#888' }}>
              Email <span className="text-[#666]">(optional, for notifications)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none transition-all"
              style={{ color: '#f7f7f5' }}
              disabled={loading}
            />
          </div>

          {/* Warning */}
          <div 
            className="p-3 rounded-lg text-xs"
            style={{ background: 'rgba(255,107,43,0.1)', border: '1px solid rgba(255,107,43,0.2)' }}
          >
            <span style={{ color: '#FF6B2B' }}>⚠️ Important:</span>{' '}
            <span style={{ color: '#888' }}>
              Username is permanent and cannot be changed. Choose carefully!
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)' }}>
              <span style={{ color: '#ff4444' }}>Error:</span>{' '}
              <span style={{ color: '#888' }}>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#f7f7f5' }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !available || username.length < 3}
              className="flex-1 px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#FF6B2B', color: 'white' }}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>

        {/* Wallet Address */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs mb-2" style={{ color: '#666' }}>Connected Wallet</p>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#888' }}>
            <div className="w-2 h-2 rounded-full bg-[#4ade80]" />
            {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
          </div>
        </div>
      </div>
    </div>
  );
}
