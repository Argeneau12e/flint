/**
 * Flint Escrow Smart Contract - Types & Constants
 * 
 * State Machine:
 * DRAFT → PENDING_ACCEPTANCE (7 days) → ACCEPTED_WAITING_FUNDING (3 days) → FUNDED_ACTIVE
 * FUNDED_ACTIVE → DELIVERED_REVIEW (7 days) → RELEASED_COMPLETE | DISPUTED | AUTO_APPROVED
 */

// Escrow States
export enum EscrowState {
  DRAFT = 'draft',
  PENDING_ACCEPTANCE = 'pending_acceptance',
  ACCEPTED_WAITING_FUNDING = 'accepted_waiting_funding',
  FUNDED_ACTIVE = 'funded_active',
  DELIVERED_REVIEW = 'delivered_review',
  RELEASED_COMPLETE = 'released_complete',
  DISPUTED = 'disputed',
  AUTO_APPROVED = 'auto_approved',
  AUTO_CANCELLED = 'auto_cancelled',
  REFUNDED = 'refunded',
}

// Timeout durations (in seconds)
export const ESCROW_TIMEOUTS = {
  ACCEPTANCE_TIMEOUT: 7 * 24 * 60 * 60, // 7 days
  FUNDING_TIMEOUT: 3 * 24 * 60 * 60, // 3 days
  REVIEW_TIMEOUT: 7 * 24 * 60 * 60, // 7 days
};

// Fee structure
export const FEE_TIERS = {
  FREE: { rate: 0.01, name: 'Free' }, // 1%
  PRO: { rate: 0.005, name: 'Pro' }, // 0.5%
  BUSINESS: { rate: 0.0025, name: 'Business' }, // 0.25%
};

// Fee caps (in USD)
export const FEE_CAPS = {
  CAP_50K: { threshold: 50000, cap: 250 }, // >$50K → cap at $250
  CAP_100K: { threshold: 100000, cap: 400 }, // >$100K → cap at $400
};

// Escrow PDA seed prefix
export const ESCROW_PDA_SEED = 'flint_escrow';

// Treasury wallet (Flint revenue) - TO BE UPDATED
export const TREASURY_WALLET = 'FLINT_TREASURY_WALLET_ADDRESS'; // Replace with actual address

// Supported tokens
export const SUPPORTED_TOKENS = {
  SOL: {
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    symbol: 'SOL',
  },
  USDC: {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    symbol: 'USDC',
  },
  USDT: {
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    symbol: 'USDT',
  },
};

// Escrow instruction types
export enum EscrowInstruction {
  CREATE = 'create',
  ACCEPT = 'accept',
  FUND = 'fund',
  MARK_DELIVERED = 'mark_delivered',
  RELEASE = 'release',
  DISPUTE = 'dispute',
  REFUND = 'refund',
  CANCEL = 'cancel',
}

// Dispute resolution
export interface DisputeResolution {
  winner: 'buyer' | 'seller';
  refundAmount: number;
  releaseAmount: number;
  reason: string;
  aiConfidence: number;
  timestamp: number;
}

// Escrow account structure (on-chain PDA)
export interface EscrowAccount {
  // Metadata
  id: string;
  version: number;
  bump: number;
  
  // Parties
  creator: string; // Seller (invoice creator)
  recipient: string; // Buyer (wallet to pay)
  
  // Financials
  amount: number; // In lamports or token units
  tokenMint: string; // SOL, USDC, or USDT
  feeAmount: number; // Flint fee
  feeTier: string; // Free/Pro/Business
  
  // State
  state: EscrowState;
  createdAt: number;
  acceptedAt?: number;
  fundedAt?: number;
  deliveredAt?: number;
  resolvedAt?: number;
  
  // Timeouts
  acceptanceDeadline: number;
  fundingDeadline: number;
  reviewDeadline: number;
  
  // Dispute (if applicable)
  dispute?: DisputeResolution;
  
  // AI Analysis
  aiAnalysis?: {
    confidenceScore: number;
    riskFactors: string[];
    summary: string;
  };
}
