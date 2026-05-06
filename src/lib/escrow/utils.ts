import { FEE_TIERS, FEE_CAPS, ESCROW_TIMEOUTS, EscrowState, MINIMUMS, SOL_PRICE_CONFIG } from './types';

// SOL price cache
let solPriceCache: { price: number; timestamp: number } | null = null;

/**
 * Fetch SOL price from CoinGecko (cached)
 */
export async function getSOLPrice(): Promise<number> {
  // Return cached price if fresh (< 1 min)
  if (solPriceCache && Date.now() - solPriceCache.timestamp < SOL_PRICE_CONFIG.CACHE_DURATION_MS) {
    return solPriceCache.price;
  }

  try {
    const response = await fetch(`${SOL_PRICE_CONFIG.COINGECKO_URL}?ids=solana&vs_currencies=usd`);
    const data = await response.json();
    const price = data.solana?.usd || 175; // Fallback to $175
    
    solPriceCache = { price, timestamp: Date.now() };
    return price;
  } catch {
    return solPriceCache?.price || 175; // Fallback
  }
}

/**
 * Validate minimum invoice amount
 */
export function validateMinimumAmount(amountUsd: number): {
  valid: boolean;
  error?: string;
} {
  if (amountUsd < MINIMUMS.MIN_INVOICE_USD) {
    return {
      valid: false,
      error: `Minimum invoice amount is $${MINIMUMS.MIN_INVOICE_USD} USD`,
    };
  }
  return { valid: true };
}

/**
 * Calculate Flint fee based on amount and tier (with minimums)
 * IMPORTANT: amount is in token units, but fee logic is in USD
 * Returns fee in TOKEN units (not USD)
 */
export function calculateFee(
  amount: number,
  tier: keyof typeof FEE_TIERS = 'FREE',
  amountUsd?: number,
  tokenPrice: number = 1 // SOL price, or 1 for stablecoins
): {
  fee: number;
  feeUsd: number;
  effectiveRate: number;
  capApplied: boolean;
  minimumApplied: boolean;
} {
  const tierConfig = FEE_TIERS[tier];
  const amountInUsd = amountUsd || (amount * tokenPrice);
  
  // Calculate fee in USD first
  let feeUsd = amountInUsd * tierConfig.rate;
  let capApplied = false;
  let minimumApplied = false;
  
  // Apply fee caps (in USD)
  if (amountInUsd >= FEE_CAPS.CAP_100K.threshold) {
    feeUsd = Math.min(feeUsd, FEE_CAPS.CAP_100K.cap);
    capApplied = true;
  } else if (amountInUsd >= FEE_CAPS.CAP_50K.threshold) {
    feeUsd = Math.min(feeUsd, FEE_CAPS.CAP_50K.cap);
    capApplied = true;
  }
  
  // Apply minimum fee (in USD)
  if (feeUsd < MINIMUMS.MIN_FEE_USD) {
    feeUsd = MINIMUMS.MIN_FEE_USD;
    minimumApplied = true;
  }
  
  // Convert fee back to token units
  const feeInToken = feeUsd / tokenPrice;
  const effectiveRate = feeUsd / amountInUsd;
  
  return {
    fee: Number(feeInToken.toFixed(6)), // 6 decimals for SOL precision
    feeUsd: Number(feeUsd.toFixed(2)),
    effectiveRate,
    capApplied,
    minimumApplied,
  };
}

/**
 * Calculate total amount (amount + fee)
 */
export function calculateTotal(
  amount: number,
  tier?: keyof typeof FEE_TIERS,
  amountUsd?: number,
  tokenPrice: number = 1
): {
  amount: number;
  fee: number;
  feeUsd: number;
  total: number;
  tier: string;
  minimumApplied: boolean;
  capApplied: boolean;
} {
  const { fee, feeUsd, effectiveRate, capApplied, minimumApplied } = calculateFee(amount, tier, amountUsd, tokenPrice);
  const tierConfig = FEE_TIERS[tier || 'FREE'];
  
  return {
    amount,
    fee,
    feeUsd,
    total: Number((amount + fee).toFixed(6)),
    tier: tierConfig.name,
    minimumApplied,
    capApplied,
  };
}

/**
 * Check if escrow has timed out
 */
export function checkTimeout(
  state: EscrowState,
  deadline: number,
  currentTime: number = Date.now() / 1000
): {
  isTimedOut: boolean;
  timeRemaining: number;
  nextState: EscrowState | null;
} {
  const timeRemaining = deadline - currentTime;
  
  if (timeRemaining <= 0) {
    // Determine next state based on current state
    let nextState: EscrowState | null = null;
    
    switch (state) {
      case EscrowState.PENDING_ACCEPTANCE:
        nextState = EscrowState.AUTO_CANCELLED;
        break;
      case EscrowState.ACCEPTED_WAITING_FUNDING:
        nextState = EscrowState.AUTO_CANCELLED;
        break;
      case EscrowState.DELIVERED_REVIEW:
        nextState = EscrowState.AUTO_APPROVED;
        break;
    }
    
    return {
      isTimedOut: true,
      timeRemaining: 0,
      nextState,
    };
  }
  
  return {
    isTimedOut: false,
    timeRemaining,
    nextState: null,
  };
}

/**
 * Format timeout for display
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Get state display info
 */
export function getStateInfo(state: EscrowState): {
  label: string;
  color: string;
  description: string;
} {
  const stateInfo: Record<EscrowState, { label: string; color: string; description: string }> = {
    [EscrowState.DRAFT]: {
      label: 'Draft',
      color: '#888888',
      description: 'Invoice created, not yet sent',
    },
    [EscrowState.PENDING_ACCEPTANCE]: {
      label: 'Pending Acceptance',
      color: '#FFB800',
      description: 'Waiting for buyer to accept',
    },
    [EscrowState.ACCEPTED_WAITING_FUNDING]: {
      label: 'Waiting Funding',
      color: '#FFB800',
      description: 'Accepted, waiting for escrow funding',
    },
    [EscrowState.FUNDED_ACTIVE]: {
      label: 'Active',
      color: '#3b82f6',
      description: 'Funds secured in escrow',
    },
    [EscrowState.DELIVERED_REVIEW]: {
      label: 'In Review',
      color: '#8b5cf6',
      description: 'Work delivered, awaiting approval',
    },
    [EscrowState.RELEASED_COMPLETE]: {
      label: 'Complete',
      color: '#4ade80',
      description: 'Funds released to seller',
    },
    [EscrowState.DISPUTED]: {
      label: 'Disputed',
      color: '#ff4444',
      description: 'Under dispute resolution',
    },
    [EscrowState.AUTO_APPROVED]: {
      label: 'Auto-Approved',
      color: '#4ade80',
      description: 'Auto-approved after review timeout',
    },
    [EscrowState.AUTO_CANCELLED]: {
      label: 'Cancelled',
      color: '#888888',
      description: 'Auto-cancelled due to timeout',
    },
    [EscrowState.REFUNDED]: {
      label: 'Refunded',
      color: '#ff4444',
      description: 'Funds refunded to buyer',
    },
  };
  
  return stateInfo[state] || {
    label: 'Unknown',
    color: '#888888',
    description: 'Unknown state',
  };
}

/**
 * Check if first invoice (for fee waiver)
 */
export async function isFirstInvoice(walletAddress: string): Promise<boolean> {
  try {
    // Check Supabase for existing invoices
    const response = await fetch(`/api/invoice/count?wallet=${walletAddress}`);
    const data = await response.json();
    return data.count === 0;
  } catch {
    return false;
  }
}

/**
 * Apply first invoice free logic
 */
export function applyFirstInvoiceFree(
  fee: number,
  isFirst: boolean
): {
  originalFee: number;
  discount: number;
  finalFee: number;
} {
  if (isFirst) {
    return {
      originalFee: fee,
      discount: fee,
      finalFee: 0,
    };
  }
  
  return {
    originalFee: fee,
    discount: 0,
    finalFee: fee,
  };
}
