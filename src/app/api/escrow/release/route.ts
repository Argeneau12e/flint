import { NextRequest, NextResponse } from 'next/server';
import { EscrowState } from '@/lib/escrow/types';
import { canTransition } from '@/lib/escrow/state-machine';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/escrow/release
 * Release funds to seller (buyer approval or auto-approve)
 * Transitions: DELIVERED_REVIEW → RELEASED_COMPLETE
 * Or: DELIVERED_REVIEW → AUTO_APPROVED (if timeout)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, buyerWallet, isAutoApprove = false } = body;

    if (!escrowId) {
      return NextResponse.json(
        { error: 'Escrow ID required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch escrow
    const { data: escrow, error: fetchError } = await supabase
      .from('escrows')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (fetchError || !escrow) {
      return NextResponse.json(
        { error: 'Escrow not found' },
        { status: 404 }
      );
    }

    // Validate state
    if (escrow.state !== EscrowState.DELIVERED_REVIEW) {
      return NextResponse.json(
        { error: `Invalid state for release: ${escrow.state}. Expected: delivered_review` },
        { status: 400 }
      );
    }

    // Verify buyer (unless auto-approve)
    if (!isAutoApprove && escrow.buyer_wallet !== buyerWallet) {
      return NextResponse.json(
        { error: 'Only the buyer can approve release' },
        { status: 403 }
      );
    }

    // Check if transition is valid
    const nextState = isAutoApprove ? EscrowState.AUTO_APPROVED : EscrowState.RELEASED_COMPLETE;
    if (!canTransition(EscrowState.DELIVERED_REVIEW, nextState, isAutoApprove ? 'system' : 'buyer')) {
      return NextResponse.json(
        { error: 'Invalid state transition' },
        { status: 400 }
      );
    }

    // TODO: In production, call Solana program to release funds from escrow PDA to seller
    // For demo mode, we just update the database

    // Update escrow: transition to RELEASED_COMPLETE or AUTO_APPROVED
    const releasedAt = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from('escrows')
      .update({
        state: nextState,
        released_at: releasedAt,
        resolved_at: releasedAt,
        auto_approved: isAutoApprove,
      })
      .eq('id', escrowId);

    if (updateError) {
      console.error('Release update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to release funds', details: updateError },
        { status: 500 }
      );
    }

    // Update usage stats for seller
    if (escrow.creator) {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'; // YYYY-MM-01
      await supabase
        .from('usage')
        .upsert({
          user_id: escrow.creator,
          month: currentMonth,
          volume_usd: escrow.amount,
          invoices_created: 1,
          fees_paid_usd: escrow.fee_amount,
        }, { onConflict: 'user_id,month' });
    }

    console.log('✅ Escrow released:', escrowId, isAutoApprove ? '(AUTO)' : '(BUYER APPROVED)');

    // TODO: Send notification to both parties

    return NextResponse.json({
      success: true,
      message: isAutoApprove 
        ? 'Funds auto-released to seller after review period.'
        : 'Funds released to seller successfully.',
      escrow: {
        id: escrowId,
        state: nextState,
        released_at: releasedAt,
      },
      amount: escrow.amount,
      fee: escrow.fee_amount,
      total_to_seller: escrow.amount,
    });
  } catch (error: any) {
    console.error('Release error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
