"use client";

import { useState } from "react";

interface FeeDisclosureModalProps {
  amount: number;
  feeAmount: number;
  feeOriginal: number;
  feeDiscount: number;
  totalAmount: number;
  tokenSymbol: string;
  isFirstInvoice: boolean;
  feeTier: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function FeeDisclosureModal({
  amount,
  feeAmount,
  feeOriginal,
  feeDiscount,
  totalAmount,
  tokenSymbol,
  isFirstInvoice,
  feeTier,
  onConfirm,
  onCancel,
}: FeeDisclosureModalProps) {
  const [checked, setChecked] = useState(false);

  const feePercentage = feeOriginal > 0 
    ? ((feeOriginal / amount) * 100).toFixed(2) 
    : "0";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div 
        className="w-full max-w-md rounded-2xl p-6"
        style={{ 
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold" style={{ color: "#fff" }}>
            Fee Disclosure
          </h2>
          <p className="text-sm mt-1" style={{ color: "#888" }}>
            Please review before funding
          </p>
        </div>

        {/* First Invoice Free Badge */}
        {isFirstInvoice && (
          <div 
            className="mb-4 p-3 rounded-xl text-center"
            style={{ 
              background: "rgba(74,222,128,0.1)",
              border: "1px solid rgba(74,222,128,0.3)"
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "#4ade80" }}>
              🎉 First Invoice FREE!
            </p>
            <p className="text-xs mt-1" style={{ color: "#888" }}>
              You saved ${feeDiscount.toFixed(2)} in fees
            </p>
          </div>
        )}

        {/* Fee Breakdown */}
        <div 
          className="p-4 rounded-xl mb-4"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "#888" }}>Invoice Amount</span>
              <span style={{ color: "#fff" }}>
                {amount} {tokenSymbol}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span style={{ color: "#888" }}>
                Fee ({feePercentage}%)
              </span>
              <span style={{ color: feeDiscount > 0 ? "#4ade80" : "#fff" }}>
                {feeDiscount > 0 ? (
                  <>
                    <span className="line-through mr-2" style={{ color: "#888" }}>
                      {feeOriginal.toFixed(2)}
                    </span>
                    <span style={{ color: "#4ade80" }}>
                      {feeAmount.toFixed(2)} {tokenSymbol}
                    </span>
                  </>
                ) : (
                  `${feeAmount.toFixed(2)} ${tokenSymbol}`
                )}
              </span>
            </div>

            {feeDiscount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: "#888" }}>Discount Applied</span>
                <span className="text-xs" style={{ color: "#4ade80" }}>
                  -{feeDiscount.toFixed(2)} {tokenSymbol}
                </span>
              </div>
            )}

            <div 
              className="flex justify-between pt-3 border-t"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              <span className="font-semibold" style={{ color: "#fff" }}>
                Total to Fund
              </span>
              <span className="font-bold" style={{ color: "#4ade80" }}>
                {totalAmount.toFixed(2)} {tokenSymbol}
              </span>
            </div>
          </div>
        </div>

        {/* Fee Policy Notice */}
        <div 
          className="p-3 rounded-xl mb-4 text-xs"
          style={{ 
            background: "rgba(255,184,0,0.1)",
            border: "1px solid rgba(255,184,0,0.2)"
          }}
        >
          <p style={{ color: "#ffb800" }}>
            ⚠️ <strong>Important:</strong> The platform fee is non-refundable, even if the transaction is disputed or cancelled. This fee covers escrow protection and platform services.
          </p>
        </div>

        {/* Tier Info */}
        <div className="mb-4 text-xs text-center" style={{ color: "#888" }}>
          Current tier: <strong style={{ color: "#fff" }}>{feeTier}</strong>
          {feeTier === "FREE" && (
            <span className="ml-2">
              • Upgrade to PRO for 0.5% fees
            </span>
          )}
        </div>

        {/* Checkbox */}
        <label 
          className="flex items-start gap-3 mb-6 cursor-pointer"
          style={{ color: "#888" }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 w-4 h-4 rounded"
            style={{ 
              accentColor: "#4ade80",
              cursor: "pointer"
            }}
          />
          <span className="text-xs leading-relaxed">
            I understand and agree that the platform fee is{" "}
            <strong>non-refundable</strong> under any circumstances.
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-medium transition-all"
            style={{ 
              background: "rgba(255,255,255,0.05)",
              color: "#888",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!checked}
            className="flex-1 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              background: checked 
                ? "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)"
                : "rgba(255,255,255,0.1)",
              color: checked ? "#000" : "#888"
            }}
          >
            Confirm & Fund
          </button>
        </div>
      </div>
    </div>
  );
}
