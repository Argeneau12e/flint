'use client';

import { useState, useEffect } from 'react';
import { calculateTotal } from '@/lib/escrow/utils';
import { FEE_TIERS, FEE_CAPS } from '@/lib/escrow/types';

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

  useEffect(() => {
    if (amount > 0) {
      const info = calculateTotal(amount, feeTier);
      setFeeInfo(info);
    }
  }, [amount, token, feeTier]);

  // Fee cap indicator
  const feeCapInfo = amount >= FEE_CAPS.CAP_100K.threshold 
    ? FEE_CAPS.CAP_100K 
    : amount >= FEE_CAPS.CAP_50K.threshold 
    ? FEE_CAPS.CAP_50K 
    : null;

  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h3 className="text-sm font-medium mb-3" style={{ color: '#f7f7f5' }}>
        Fee Breakdown
      </h3>

      {feeInfo ? (
        <div className="space-y-2 text-sm">
          {/* Amount */}
          <div className="flex justify-between">
            <span style={{ color: '#888' }}>Invoice Amount</span>
            <span style={{ color: '#f7f7f5' }}>
              {amount.toLocaleString()} {token}
            </span>
          </div>

          {/* Fee */}
          <div className="flex justify-between">
            <span style={{ color: '#888' }}>
              Flint Fee ({FEE_TIERS[feeTier].rate * 100}%)
            </span>
            <span style={{ color: '#f7f7f5' }}>
              {feeInfo.fee.toLocaleString()} {token}
            </span>
          </div>

          {/* Fee Cap Indicator */}
          {feeCapInfo && (
            <div className="text-xs" style={{ color: '#4ade80' }}>
              ✓ Fee cap applied (max {feeCapInfo.cap} USD)
            </div>
          )}

          {/* First Invoice Free */}
          {isFirstInvoice && (
            <div className="text-xs" style={{ color: '#4ade80' }}>
              ✓ First invoice free! (-{feeInfo.fee.toLocaleString()} {token})
            </div>
          )}

          {/* Divider */}
          <div style={{ border: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />

          {/* Total */}
          <div className="flex justify-between font-medium">
            <span style={{ color: '#f7f7f5' }}>Total (incl. fee)</span>
            <span style={{ color: '#FF6B2B' }}>
              {feeInfo.total.toLocaleString()} {token}
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
        </div>
      )}
    </div>
  );
}
