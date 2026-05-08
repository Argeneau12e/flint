/**
 * Flint Escrow State Machine (REAL Flint Flow)
 * 
 * Enforces state transitions, validates actions, and handles timeouts.
 * This is the CORE LOGIC that makes escrow actually work.
 * 
 * REAL FLOW:
 * DRAFT → FUNDED_ACTIVE (Alice funds) → DELIVERED_REVIEW (Bob delivers)
 * DELIVERED_REVIEW → RELEASED_COMPLETE (Alice approves) | AUTO_APPROVED (timeout) | DISPUTED
 * DRAFT → AUTO_CANCELLED (link expires) | DECLINED (Alice declines)
 * FUNDED_ACTIVE → AUTO_CANCELLED (Bob misses deadline)
 */

import { EscrowState, ESCROW_DEADLINES } from './types';

export interface StateTransition {
  from: EscrowState;
  to: EscrowState;
  requiredRole: 'creator' | 'buyer' | 'system';
  allowedActions: string[];
}

export interface TimeoutResult {
  shouldTransition: boolean;
  nextState: EscrowState | null;
  timeRemaining: number;
  isExpired: boolean;
}

/**
 * Valid state transitions (REAL Flint Flow - Simplified)
 */
export const STATE_TRANSITIONS: Record<EscrowState, StateTransition[]> = {
  [EscrowState.DRAFT]: [
    {
      from: EscrowState.DRAFT,
      to: EscrowState.FUNDED_ACTIVE,
      requiredRole: 'buyer',
      allowedActions: ['fund'],
    },
    {
      from: EscrowState.DRAFT,
      to: EscrowState.DECLINED,
      requiredRole: 'buyer',
      allowedActions: ['decline'],
    },
    {
      from: EscrowState.DRAFT,
      to: EscrowState.AUTO_CANCELLED,
      requiredRole: 'system',
      allowedActions: ['timeout'], // Link expired
    },
  ],
  [EscrowState.FUNDED_ACTIVE]: [
    {
      from: EscrowState.FUNDED_ACTIVE,
      to: EscrowState.DELIVERED_REVIEW,
      requiredRole: 'creator',
      allowedActions: ['deliver'],
    },
    {
      from: EscrowState.FUNDED_ACTIVE,
      to: EscrowState.AUTO_CANCELLED,
      requiredRole: 'system',
      allowedActions: ['timeout'], // Bob missed delivery deadline
    },
  ],
  [EscrowState.DELIVERED_REVIEW]: [
    {
      from: EscrowState.DELIVERED_REVIEW,
      to: EscrowState.RELEASED_COMPLETE,
      requiredRole: 'buyer',
      allowedActions: ['approve'],
    },
    {
      from: EscrowState.DELIVERED_REVIEW,
      to: EscrowState.DISPUTED,
      requiredRole: 'buyer',
      allowedActions: ['dispute'],
    },
    {
      from: EscrowState.DELIVERED_REVIEW,
      to: EscrowState.AUTO_APPROVED,
      requiredRole: 'system',
      allowedActions: ['timeout'], // Alice didn't respond in 7 days
    },
  ],
  [EscrowState.RELEASED_COMPLETE]: [],
  [EscrowState.AUTO_APPROVED]: [],
  [EscrowState.AUTO_CANCELLED]: [],
  [EscrowState.DISPUTED]: [
    {
      from: EscrowState.DISPUTED,
      to: EscrowState.RELEASED_COMPLETE,
      requiredRole: 'system',
      allowedActions: ['resolve_seller'],
    },
    {
      from: EscrowState.DISPUTED,
      to: EscrowState.AUTO_CANCELLED,
      requiredRole: 'system',
      allowedActions: ['resolve_buyer'],
    },
  ],
  [EscrowState.DECLINED]: [],
};

/**
 * Check if a state transition is valid
 */
export function canTransition(
  currentState: EscrowState,
  nextState: EscrowState,
  actorRole: 'creator' | 'buyer' | 'system'
): boolean {
  const transitions = STATE_TRANSITIONS[currentState];
  if (!transitions) return false;
  
  const transition = transitions.find(t => t.to === nextState);
  if (!transition) return false;
  
  return transition.requiredRole === actorRole;
}

/**
 * Get allowed actions for current state and role
 */
export function getAllowedActions(
  currentState: EscrowState,
  actorRole: 'creator' | 'buyer' | 'system'
): string[] {
  const transitions = STATE_TRANSITIONS[currentState];
  if (!transitions) return [];
  
  return transitions
    .filter(t => t.requiredRole === actorRole)
    .flatMap(t => t.allowedActions);
}

/**
 * Check timeout and determine next state
 */
export function checkTimeout(
  currentState: EscrowState,
  deadline: number, // milliseconds
  currentTime: number = Date.now()
): TimeoutResult {
  const timeRemaining = deadline - currentTime;
  const isExpired = timeRemaining <= 0;
  
  if (!isExpired) {
    return {
      shouldTransition: false,
      nextState: null,
      timeRemaining,
      isExpired: false,
    };
  }
  
  // Determine next state based on current state (REAL Flint Flow)
  let nextState: EscrowState | null = null;
  
  switch (currentState) {
    case EscrowState.DRAFT:
      nextState = EscrowState.AUTO_CANCELLED; // Link expired
      break;
    case EscrowState.FUNDED_ACTIVE:
      nextState = EscrowState.AUTO_CANCELLED; // Bob missed delivery deadline
      break;
    case EscrowState.DELIVERED_REVIEW:
      nextState = EscrowState.AUTO_APPROVED; // Alice didn't respond in 7 days
      break;
    default:
      nextState = null;
  }
  
  return {
    shouldTransition: nextState !== null,
    nextState,
    timeRemaining: 0,
    isExpired: true,
  };
}

/**
 * Calculate deadline from state (REAL Flint Flow)
 */
export function getDeadlineForState(
  state: EscrowState,
  createdAt: number = Date.now()
): number {
  switch (state) {
    case EscrowState.DRAFT:
      // Link expiry: 3 days from creation
      return createdAt + ESCROW_DEADLINES.LINK_EXPIRY;
    case EscrowState.FUNDED_ACTIVE:
      // Delivery deadline: 7 days from funding (configurable, but default is 7)
      return createdAt + ESCROW_DEADLINES.DELIVERY;
    case EscrowState.DELIVERED_REVIEW:
      // Review deadline: 7 days from delivery
      return createdAt + ESCROW_DEADLINES.REVIEW;
    default:
      return 0;
  }
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';
  
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  const hours = Math.ceil(ms / (1000 * 60 * 60));
  
  if (days >= 1) {
    return days === 1 ? '1 day left' : `${days} days left`;
  }
  
  if (hours >= 1) {
    return hours === 1 ? '1 hour left' : `${hours} hours left`;
  }
  
  const minutes = Math.ceil(ms / (1000 * 60));
  return minutes === 1 ? '1 minute left' : `${minutes} minutes left`;
}

/**
 * Get state metadata (label, color, description) - REAL Flint Flow
 */
export function getStateMetadata(state: EscrowState): {
  label: string;
  color: string;
  description: string;
} {
  const metadata: Record<EscrowState, { label: string; color: string; description: string }> = {
    [EscrowState.DRAFT]: {
      label: 'Waiting for Alice',
      color: '#FFB800',
      description: 'Invoice created, waiting for Alice to fund',
    },
    [EscrowState.FUNDED_ACTIVE]: {
      label: 'In Progress',
      color: '#3b82f6',
      description: 'Funds secured, Bob is working',
    },
    [EscrowState.DELIVERED_REVIEW]: {
      label: 'Awaiting Review',
      color: '#8b5cf6',
      description: 'Work delivered, Alice reviewing',
    },
    [EscrowState.RELEASED_COMPLETE]: {
      label: 'Complete',
      color: '#4ade80',
      description: 'Payment released to Bob',
    },
    [EscrowState.AUTO_APPROVED]: {
      label: 'Auto-Approved',
      color: '#4ade80',
      description: 'Auto-approved after 7 days (Alice didn\'t respond)',
    },
    [EscrowState.AUTO_CANCELLED]: {
      label: 'Expired',
      color: '#888888',
      description: 'Expired - funds refunded to Alice',
    },
    [EscrowState.DISPUTED]: {
      label: 'Disputed',
      color: '#ff4444',
      description: 'Dispute opened, under review',
    },
    [EscrowState.DECLINED]: {
      label: 'Declined',
      color: '#888888',
      description: 'Alice declined the invoice',
    },
  };
  
  return metadata[state] || {
    label: state,
    color: '#888888',
    description: 'Unknown state',
  };
}
