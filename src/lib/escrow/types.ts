/**
 * Flint Escrow Smart Contract - Types & Constants
 * 
 * REAL FLINT FLOW State Machine (Simplified):
 * DRAFT → FUNDED_ACTIVE (Alice funds) → DELIVERED_REVIEW (Bob delivers)
 * DELIVERED_REVIEW → RELEASED_COMPLETE (Alice approves)
 * DELIVERED_REVIEW → AUTO_APPROVED (7 days, Alice ghosts)
 * DRAFT → AUTO_CANCELLED (link expires)
 * DRAFT → DECLINED (Alice declines)
 * FUNDED_ACTIVE → AUTO_CANCELLED (Bob misses deadline)
 * DELIVERED_REVIEW → DISPUTED (Alice disputes)
 * 
 * CRITICAL: Alice doesn't know about Flint. She's just paying Bob.
 */

// Escrow States (REAL Flint Flow - Simplified)
export enum EscrowState {
  DRAFT = 'draft',                      // Bob created, waiting for Alice to fund
  FUNDED_ACTIVE = 'funded_active',      // Alice funded, Bob working
  DELIVERED_REVIEW = 'delivered_review', // Bob delivered, Alice reviewing
  RELEASED_COMPLETE = 'released_complete', // Alice approved, Bob paid
  AUTO_APPROVED = 'auto_approved',      // Alice ghosted (7 days), auto-released to Bob
  AUTO_CANCELLED = 'auto_cancelled',    // Bob missed deadline or link expired, refunded to Alice
  DISPUTED = 'disputed',                // Alice disputed, under review
  DECLINED = 'declined',                // Alice declined the invoice (NEW)
}

// Timeout durations (in milliseconds for frontend compatibility)
export const ESCROW_DEADLINES = {
  LINK_EXPIRY: 3 * 24 * 60 * 60 * 1000,     // 3 days for Alice to fund
  DELIVERY: 7 * 24 * 60 * 60 * 1000,        // 7 days for Bob to deliver (configurable)
  REVIEW: 7 * 24 * 60 * 60 * 1000,          // 7 days for Alice to review
};

// Fee tiers (REAL Flint Flow: Seller pays fee, NOT added to buyer's payment)
// Buyer pays exact amount. Fee is deducted from seller's payout.
// Matches pricing page: https://flint-rust.vercel.app/pricing
export const FEE_TIERS = {
  FREE: { rate: 0.01, maxVolume: 1000, name: 'Free' },        // 1%
  PRO: { rate: 0.005, maxVolume: 10000, name: 'Pro' },        // 0.5%
  BUSINESS: { rate: 0.0025, maxVolume: 50000, name: 'Business' }, // 0.25%
};

// Fee caps (in USD)
export const FEE_CAPS = {
  CAP_50K: { threshold: 50000, cap: 250 }, // >$50K → cap at $250
  CAP_100K: { threshold: 100000, cap: 400 }, // >$100K → cap at $400
};

// Minimums (in USD)
export const MINIMUMS = {
  MIN_INVOICE_USD: 5, // Minimum invoice amount
  MIN_FEE_USD: 0.50, // Minimum fee (ensures profitability)
};

// SOL price config
export const SOL_PRICE_CONFIG = {
  COINGECKO_URL: 'https://api.coingecko.com/api/v3/simple/price',
  CACHE_DURATION_MS: 60000, // 1 minute cache
};

// Escrow PDA seed prefix
export const ESCROW_PDA_SEED = 'flint_escrow';

// Treasury wallet (Flint revenue)
export const TREASURY_WALLET = '2c3TBCrtoaRz81JcqVLKQ3X9xA81YwJeziqQeUiTESF'; // Flint Treasury

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
