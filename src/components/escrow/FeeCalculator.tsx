'use client';

import { useState, useEffect } from 'react';
import { calculateTotal, getSOLPrice, validateMinimumAmount } from '@/lib/escrow/utils';
import { FEE_TIERS, MINIMUMS, SUPPORTED_TOKENS } from '@/lib/escrow/types';

interface FeeCalculatorProps {
  amount: number;
  token: 'SOL' | 'USDC' | 'USDT';
  feeTier?: keyof typeof FEE_TIERS;
  showDisclosure?: boolean;
}

export default function FeeCalculator({ 
  amount, 
  token, 
  feeTier = 'FREE',
  showDisclosure = true 
}: FeeCalculatorProps) {
  const [feeInfo, setFeeInfo] = useState<ReturnType<typeof calculateTotal> | null>(null);
  const [isFirstInvoice, setIsFirstInvoice] = useState(false);
  const [solPrice, setSolPrice] = useState<number>(175); // Fallback price
  const [minimumApplied, setMinimumApplied] = useState(false);
  const [minimumError, setMinimumError] = useState<string | null>(null);

  // Fetch SOL price when SOL is selected
  useEffect(() => {
    if (token === 'SOL' && amount > 0) {
      getSOLPrice().then(setSolPrice);
    }
  }, [token, amount]);

  // Calculate fee with minimums
  useEffect(() => {
    if (amount > 0) {
      // Calculate USD amount for SOL
      let amountUsd = amount;
      if (token === 'SOL') {
        amountUsd = amount * solPrice;
      }

      // Validate minimum invoice
      const minValidation = validateMinimumAmount(amountUsd);
      if (!minValidation.valid) {
        setMinimumError(minValidation.error || null);
        setFeeInfo(null);
        return;
      }
      setMinimumError(null);

      // Calculate fee (pass tokenPrice for proper conversion)
      const tokenPrice = token === 'SOL' ? solPrice : 1;
      const info = calculateTotal(amount, feeTier, amountUsd, tokenPrice);
      setFeeInfo(info);
      setMinimumApplied(info.minimumApplied);
    }
  }, [amount, token, feeTier, solPrice]);

  // USD equivalent display
  const usdEquivalent = token === 'SOL' ? (amount * solPrice).toFixed(2) : amount.toFixed(2);

  // Use feeUsd from feeInfo (already calculated correctly)
  const feeUsd = feeInfo?.feeUsd.toFixed(2) || '0.00';
  
  // Calculate total in USD for display
  const totalUsd = feeInfo && token === 'SOL'
    ? (feeInfo.total * solPrice).toFixed(2)
    : feeInfo?.total.toFixed(2) || '0.00';

  // Minimum fee indicator
  const minimumFeeApplied = minimumApplied && feeInfo;

  // Fee cap indicator
  const feeCapInfo = amount >= 50000 
    ? amount >= 100000
      ? { threshold: 100000, cap: 400 }
      : { threshold: 50000, cap: 250 }
    : null;

  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h3 className="text-sm font-medium mb-3" style={{ color: '#f7f7f5' }}>
        Fee Breakdown
      </h3>

      {minimumError ? (
        <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)' }}>
          <div className="flex items-start gap-2">
            {/* Warning Icon (SVG - no emoji) */}
            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span style={{ color: '#ff4444' }}>{minimumError}</span>
          </div>
        </div>
      ) : feeInfo ? (
        <div className="space-y-2 text-sm">
          {/* Amount */}
          <div className="flex justify-between">
            <span style={{ color: '#888' }}>Invoice Amount</span>
            <span style={{ color: '#f7f7f5' }}>
              {amount.toLocaleString()} {token}
              {token === 'SOL' && (
                <span className="ml-2 text-xs" style={{ color: '#666' }}>
                  (~${usdEquivalent} USD)
                </span>
              )}
            </span>
          </div>

          {/* Fee */}
          <div className="flex justify-between">
            <span style={{ color: '#888' }}>
              Flint Fee ({FEE_TIERS[feeTier].rate * 100}%)
              {minimumFeeApplied && (
                <span className="ml-1 text-xs" style={{ color: '#FF6B2B' }}>(min ${MINIMUMS.MIN_FEE_USD})</span>
              )}
            </span>
            <span style={{ color: '#f7f7f5' }}>
              {feeInfo.fee.toFixed(2)} {token}
              {token === 'SOL' && (
                <span className="ml-2 text-xs" style={{ color: '#666' }}>
                  (~${feeUsd} USD)
                </span>
              )}
            </span>
          </div>

          {/* Minimum Fee Applied */}
          {minimumFeeApplied && (
            <div className="text-xs" style={{ color: '#FF6B2B' }}>
              <div className="flex items-center gap-1">
                {/* Check Icon (SVG - no emoji) */}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Minimum fee applied (${MINIMUMS.MIN_FEE_USD})
              </div>
            </div>
          )}

          {/* Fee Cap Indicator */}
          {feeCapInfo && (
            <div className="text-xs" style={{ color: '#4ade80' }}>
              <div className="flex items-center gap-1">
                {/* Check Icon (SVG - no emoji) */}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Fee cap applied (max ${feeCapInfo.cap} USD)
              </div>
            </div>
          )}

          {/* First Invoice Free */}
          {isFirstInvoice && (
            <div className="text-xs" style={{ color: '#4ade80' }}>
              <div className="flex items-center gap-1">
                {/* Check Icon (SVG - no emoji) */}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                First invoice free! (-${feeUsd} USD)
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ border: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />

          {/* Total */}
          <div className="flex justify-between font-medium">
            <span style={{ color: '#f7f7f5' }}>Total (incl. fee)</span>
            <span style={{ color: '#FF6B2B' }}>
              {feeInfo.total.toFixed(2)} {token}
              {token === 'SOL' && (
                <span className="ml-2 text-xs" style={{ color: '#666' }}>
                  (~${totalUsd} USD)
                </span>
              )}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm" style={{ color: '#888' }}>
          Enter an amount to calculate fees
        </p>
      )}

      {/* Fee Disclosure */}
      {showDisclosure && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs" style={{ color: '#666' }}>
            <span style={{ color: '#888' }}>Fees support Flint&apos;s development. </span>
            <span style={{ color: '#888' }}>
              First invoice is free! Pro (0.5%) and Business (0.25%) tiers available.
            </span>
          </p>
          <div className="flex gap-4 mt-2 text-xs" style={{ color: '#444' }}>
            <div>
              <span style={{ color: '#888' }}>Minimum invoice: </span>
              <span style={{ color: '#888' }}>${MINIMUMS.MIN_INVOICE_USD} USD</span>
            </div>
            <div>
              <span style={{ color: '#888' }}>Minimum fee: </span>
              <span style={{ color: '#888' }}>${MINIMUMS.MIN_FEE_USD} USD</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
