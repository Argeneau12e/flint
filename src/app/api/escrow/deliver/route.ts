import { NextRequest, NextResponse } from 'next/server';
import { EscrowState } from '@/lib/escrow/types';
import { canTransition, getDeadlineForState } from '@/lib/escrow/state-machine';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/escrow/deliver
 * Seller marks work as delivered
 * Transitions: FUNDED_ACTIVE → DELIVERED_REVIEW
 * Starts 7-day review deadline
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, sellerWallet, deliveryData } = body;

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
    if (escrow.state !== EscrowState.FUNDED_ACTIVE) {
      return NextResponse.json(
        { error: `Invalid state for delivery: ${escrow.state}. Expected: funded_active` },
        { status: 400 }
      );
    }

    // Verify seller is the creator
    if (escrow.creator_wallet !== sellerWallet) {
      return NextResponse.json(
        { error: 'Only the seller can mark as delivered' },
        { status: 403 }
      );
    }

    // Check if transition is valid
    if (!canTransition(EscrowState.FUNDED_ACTIVE, EscrowState.DELIVERED_REVIEW, 'creator')) {
      return NextResponse.json(
        { error: 'Invalid state transition' },
        { status: 400 }
      );
    }

    // Calculate review deadline (7 days from now)
    const reviewDeadline = getDeadlineForState(EscrowState.DELIVERED_REVIEW, Date.now());

    // Update escrow: transition to DELIVERED_REVIEW
    const deliveredAt = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from('escrows')
      .update({
        state: EscrowState.DELIVERED_REVIEW,
        delivered_at: deliveredAt,
        review_deadline: reviewDeadline,
        dispute_evidence: deliveryData ? JSON.stringify(deliveryData) : null,
      })
      .eq('id', escrowId);

    if (updateError) {
      console.error('Deliver update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark as delivered', details: updateError },
        { status: 500 }
      );
    }

    console.log('✅ Escrow delivered:', escrowId, 'Review deadline:', new Date(reviewDeadline).toISOString());

    // TODO: Send notification to buyer (email/push)

    return NextResponse.json({
      success: true,
      message: 'Work marked as delivered. Buyer has 7 days to review.',
      escrow: {
        id: escrowId,
        state: EscrowState.DELIVERED_REVIEW,
        delivered_at: deliveredAt,
        review_deadline: reviewDeadline,
      },
    });
  } catch (error: any) {
    console.error('Deliver error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
