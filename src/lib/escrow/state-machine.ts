/**
 * Flint Escrow State Machine
 * 
 * Enforces state transitions, validates actions, and handles timeouts.
 * This is the CORE LOGIC that makes escrow actually work.
 */

import { EscrowState, ESCROW_TIMEOUTS } from './types';

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
 * Valid state transitions
 */
export const STATE_TRANSITIONS: Record<EscrowState, StateTransition[]> = {
  [EscrowState.DRAFT]: [
    {
      from: EscrowState.DRAFT,
      to: EscrowState.PENDING_ACCEPTANCE,
      requiredRole: 'creator',
      allowedActions: ['send_to_buyer'],
    },
  ],
  [EscrowState.PENDING_ACCEPTANCE]: [
    {
      from: EscrowState.PENDING_ACCEPTANCE,
      to: EscrowState.ACCEPTED_WAITING_FUNDING,
      requiredRole: 'buyer',
      allowedActions: ['accept'],
    },
    {
      from: EscrowState.PENDING_ACCEPTANCE,
      to: EscrowState.AUTO_CANCELLED,
      requiredRole: 'system',
      allowedActions: ['timeout'],
    },
  ],
  [EscrowState.ACCEPTED_WAITING_FUNDING]: [
    {
      from: EscrowState.ACCEPTED_WAITING_FUNDING,
      to: EscrowState.FUNDED_ACTIVE,
      requiredRole: 'buyer',
      allowedActions: ['fund'],
    },
    {
      from: EscrowState.ACCEPTED_WAITING_FUNDING,
      to: EscrowState.AUTO_CANCELLED,
      requiredRole: 'system',
      allowedActions: ['timeout'],
    },
    {
      from: EscrowState.ACCEPTED_WAITING_FUNDING,
      to: EscrowState.DRAFT,
      requiredRole: 'buyer',
      allowedActions: ['decline'],
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
      to: EscrowState.REFUNDED,
      requiredRole: 'system',
      allowedActions: ['timeout'],
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
      allowedActions: ['timeout'],
    },
  ],
  [EscrowState.RELEASED_COMPLETE]: [],
  [EscrowState.DISPUTED]: [
    {
      from: EscrowState.DISPUTED,
      to: EscrowState.RELEASED_COMPLETE,
      requiredRole: 'system',
      allowedActions: ['resolve_seller'],
    },
    {
      from: EscrowState.DISPUTED,
      to: EscrowState.REFUNDED,
      requiredRole: 'system',
      allowedActions: ['resolve_buyer'],
    },
  ],
  [EscrowState.AUTO_APPROVED]: [],
  [EscrowState.AUTO_CANCELLED]: [],
  [EscrowState.REFUNDED]: [],
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
  
  // Determine next state based on current state
  let nextState: EscrowState | null = null;
  
  switch (currentState) {
    case EscrowState.PENDING_ACCEPTANCE:
      nextState = EscrowState.AUTO_CANCELLED;
      break;
    case EscrowState.ACCEPTED_WAITING_FUNDING:
      nextState = EscrowState.AUTO_CANCELLED;
      break;
    case EscrowState.FUNDED_ACTIVE:
      nextState = EscrowState.REFUNDED;
      break;
    case EscrowState.DELIVERED_REVIEW:
      nextState = EscrowState.AUTO_APPROVED;
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
 * Calculate deadline from state
 */
export function getDeadlineForState(
  state: EscrowState,
  createdAt: number = Date.now()
): number {
  switch (state) {
    case EscrowState.PENDING_ACCEPTANCE:
      return createdAt + (ESCROW_TIMEOUTS.ACCEPTANCE_TIMEOUT * 1000);
    case EscrowState.ACCEPTED_WAITING_FUNDING:
      return createdAt + (ESCROW_TIMEOUTS.FUNDING_TIMEOUT * 1000);
    case EscrowState.DELIVERED_REVIEW:
      return createdAt + (ESCROW_TIMEOUTS.REVIEW_TIMEOUT * 1000);
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
 * Get state metadata (label, color, description)
 */
export function getStateMetadata(state: EscrowState): {
  label: string;
  color: string;
  description: string;
} {
  const metadata: Record<EscrowState, { label: string; color: string; description: string }> = {
    [EscrowState.DRAFT]: {
      label: 'Draft',
      color: '#888888',
      description: 'Invoice created but not sent',
    },
    [EscrowState.PENDING_ACCEPTANCE]: {
      label: 'Pending Acceptance',
      color: '#FFB800',
      description: 'Waiting for buyer to accept',
    },
    [EscrowState.ACCEPTED_WAITING_FUNDING]: {
      label: 'Waiting Funding',
      color: '#FFB800',
      description: 'Buyer accepted, waiting for escrow funding',
    },
    [EscrowState.FUNDED_ACTIVE]: {
      label: 'Active',
      color: '#3b82f6',
      description: 'Funds secured, seller working',
    },
    [EscrowState.DELIVERED_REVIEW]: {
      label: 'In Review',
      color: '#8b5cf6',
      description: 'Work delivered, buyer reviewing',
    },
    [EscrowState.RELEASED_COMPLETE]: {
      label: 'Complete',
      color: '#4ade80',
      description: 'Payment released to seller',
    },
    [EscrowState.DISPUTED]: {
      label: 'Disputed',
      color: '#ff4444',
      description: 'Dispute opened, under review',
    },
    [EscrowState.AUTO_APPROVED]: {
      label: 'Auto-Approved',
      color: '#4ade80',
      description: 'Auto-approved after review period',
    },
    [EscrowState.AUTO_CANCELLED]: {
      label: 'Cancelled',
      color: '#888888',
      description: 'Auto-cancelled after timeout',
    },
    [EscrowState.REFUNDED]: {
      label: 'Refunded',
      color: '#ff4444',
      description: 'Funds refunded to buyer',
    },
  };
  
  return metadata[state] || {
    label: state,
    color: '#888888',
    description: 'Unknown state',
  };
}
