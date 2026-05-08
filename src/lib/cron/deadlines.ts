/**
 * Deadline Enforcement Cron Job (REAL Flint Flow)
 * 
 * Runs hourly to check and auto-transition expired escrows.
 * This ensures no escrow stays in limbo forever.
 * 
 * Usage:
 * - Manual: npx ts-node src/lib/cron/deadlines.ts
 * - Cron: Set up in OpenClaw gateway to run every hour
 * 
 * REAL Flow State Transitions:
 * - DRAFT (3 days link expiry) → AUTO_CANCELLED
 * - FUNDED_ACTIVE (7 days delivery) → AUTO_CANCELLED
 * - DELIVERED_REVIEW (7 days review) → AUTO_APPROVED
 */

import { createClient } from '@supabase/supabase-js';
import { EscrowState } from '../escrow/types';

interface EscrowRecord {
  id: string;
  state: EscrowState;
  acceptance_deadline?: number;
  funding_deadline?: number;
  delivery_deadline?: number;
  review_deadline?: number;
  link_expires_at?: string | number; // Can be ISO string or timestamp
  creator: string;
  buyer_wallet: string;
  creator_wallet: string;
  amount: number;
  fee_amount: number;
}

/**
 * Check all active escrows and auto-transition expired ones
 */
export async function enforceDeadlines(): Promise<{
  checked: number;
  transitioned: number;
  errors: string[];
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase not configured');
    return { checked: 0, transitioned: 0, errors: ['Supabase not configured'] };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = Date.now();
  const errors: string[] = [];
  let transitioned = 0;

  console.log('⏰ Starting deadline enforcement...', new Date().toISOString());

  // Fetch all active escrows (REAL flow states with deadlines)
  const { data: escrows, error: fetchError } = await supabase
    .from('escrows')
    .select('*')
    .in('state', [
      EscrowState.DRAFT,
      EscrowState.FUNDED_ACTIVE,
      EscrowState.DELIVERED_REVIEW,
    ]);

  if (fetchError) {
    console.error('❌ Failed to fetch escrows:', fetchError);
    return { checked: 0, transitioned: 0, errors: [fetchError.message] };
  }

  console.log(`📋 Found ${escrows?.length || 0} active escrows to check`);

  for (const escrow of (escrows || [])) {
    try {
      await checkAndTransitionEscrow(supabase, escrow, now);
    } catch (error: any) {
      console.error(`❌ Error processing escrow ${escrow.id}:`, error.message);
      errors.push(`${escrow.id}: ${error.message}`);
    }
  }

  console.log(`✅ Deadline enforcement complete. Transitioned: ${transitioned}`);
  return { checked: escrows?.length || 0, transitioned, errors };
}

/**
 * Check individual escrow and transition if expired
 */
async function checkAndTransitionEscrow(
  supabase: any,
  escrow: EscrowRecord,
  now: number
): Promise<void> {
  let deadline = 0;
  let nextState: EscrowState | null = null;
  let timeRemaining = 0;

  // Determine which deadline applies based on state (REAL flow)
  switch (escrow.state) {
    case EscrowState.DRAFT:
      // Link expiry: Alice didn't fund in 3 days
      deadline = new Date(escrow.link_expires_at).getTime();
      nextState = EscrowState.AUTO_CANCELLED;
      break;
    
    case EscrowState.FUNDED_ACTIVE:
      // Delivery deadline: Bob didn't deliver in 7 days
      deadline = escrow.delivery_deadline;
      nextState = EscrowState.AUTO_CANCELLED;
      break;
    
    case EscrowState.DELIVERED_REVIEW:
      // Review deadline: Alice didn't respond in 7 days
      deadline = escrow.review_deadline;
      nextState = EscrowState.AUTO_APPROVED;
      break;
    
    default:
      return; // No deadline for this state
  }

  timeRemaining = deadline - now;

  // If not expired, skip
  if (timeRemaining > 0) {
    const daysLeft = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    console.log(`⏳ Escrow ${escrow.id}: ${daysLeft} days left`);
    return;
  }

  // Escrow is expired - auto-transition
  console.log(`⚠️  Escrow ${escrow.id} expired! Transitioning to ${nextState}`);

  const { error: updateError } = await supabase
    .from('escrows')
    .update({
      state: nextState,
      resolved_at: now,
      auto_approved: nextState === EscrowState.AUTO_APPROVED,
    })
    .eq('id', escrow.id);

  if (updateError) {
    throw new Error(`Failed to update: ${updateError.message}`);
  }

  // TODO: Send notifications to affected parties (REAL flow)
  // - For AUTO_CANCELLED (link expired): Notify Bob (Alice didn't fund)
  // - For AUTO_CANCELLED (delivery missed): Notify Alice (refund issued), notify Bob (reputation hit)
  // - For AUTO_APPROVED: Notify Alice (payment released), notify Bob (payment received)

  console.log(`✅ Escrow ${escrow.id} auto-transitioned to ${nextState}`);
}

/**
 * Run as standalone script (for manual execution or cron)
 */
if (require.main === module) {
  enforceDeadlines()
    .then(result => {
      console.log('Summary:', result);
      process.exit(result.errors.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
