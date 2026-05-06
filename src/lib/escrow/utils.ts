import { FEE_TIERS, FEE_CAPS, ESCROW_TIMEOUTS, EscrowState } from './types';

/**
 * Calculate Flint fee based on amount and tier
 */
export function calculateFee(amount: number, tier: keyof typeof FEE_TIERS = 'FREE'): {
  fee: number;
  effectiveRate: number;
  capApplied: boolean;
} {
  const tierConfig = FEE_TIERS[tier];
  const rawFee = amount * tierConfig.rate;
  
  // Check fee caps
  let finalFee = rawFee;
  let capApplied = false;
  let effectiveRate = tierConfig.rate;
  
  if (amount >= FEE_CAPS.CAP_100K.threshold) {
    finalFee = Math.min(rawFee, FEE_CAPS.CAP_100K.cap);
    effectiveRate = finalFee / amount;
    capApplied = true;
  } else if (amount >= FEE_CAPS.CAP_50K.threshold) {
    finalFee = Math.min(rawFee, FEE_CAPS.CAP_50K.cap);
    effectiveRate = finalFee / amount;
    capApplied = true;
  }
  
  return {
    fee: Math.round(finalFee),
    effectiveRate,
    capApplied,
  };
}

/**
 * Calculate total amount (amount + fee)
 */
export function calculateTotal(amount: number, tier?: keyof typeof FEE_TIERS): {
  amount: number;
  fee: number;
  total: number;
  tier: string;
} {
  const { fee, effectiveRate, capApplied } = calculateFee(amount, tier);
  const tierConfig = FEE_TIERS[tier || 'FREE'];
  
  return {
    amount,
    fee,
    total: amount + fee,
    tier: tierConfig.name,
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
