import { NextRequest, NextResponse } from 'next/server';
import { EscrowState } from '@/lib/escrow/types';
import { canTransition } from '@/lib/escrow/state-machine';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/escrow/resolve
 * Resolve a dispute (AI recommendation or human decision)
 * Transitions: DISPUTED → RELEASED_COMPLETE (seller wins) or DISPUTED → REFUNDED (buyer wins)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      escrowId, 
      resolution, // 'seller' or 'buyer'
      reason,
      aiConfidence,
      isAiRecommendation = false,
      humanReviewer,
    } = body;

    if (!escrowId || !resolution) {
      return NextResponse.json(
        { error: 'Escrow ID and resolution required' },
        { status: 400 }
      );
    }

    if (!['seller', 'buyer'].includes(resolution)) {
      return NextResponse.json(
        { error: 'Resolution must be "seller" or "buyer"' },
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
    if (escrow.state !== EscrowState.DISPUTED) {
      return NextResponse.json(
        { error: `Invalid state for resolution: ${escrow.state}. Expected: disputed` },
        { status: 400 }
      );
    }

    // Determine next state based on resolution
    const nextState = resolution === 'seller' 
      ? EscrowState.RELEASED_COMPLETE 
      : EscrowState.REFUNDED;

    // Check if transition is valid (system resolves dispute)
    if (!canTransition(EscrowState.DISPUTED, nextState, 'system')) {
      return NextResponse.json(
        { error: 'Invalid state transition' },
        { status: 400 }
      );
    }

    // Create dispute resolution object
    const disputeResolution = {
      winner: resolution,
      reason,
      aiConfidence: aiConfidence || null,
      isAiRecommendation,
      humanReviewer: humanReviewer || null,
      resolvedAt: Date.now(),
      refundAmount: resolution === 'buyer' ? escrow.amount : 0,
      releaseAmount: resolution === 'seller' ? escrow.amount : 0,
    };

    // Update escrow: transition to final state
    const { error: updateError } = await supabase
      .from('escrows')
      .update({
        state: nextState,
        resolved_at: Date.now(),
        dispute_resolution: JSON.stringify(disputeResolution),
      })
      .eq('id', escrowId);

    if (updateError) {
      console.error('Resolve update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to resolve dispute', details: updateError },
        { status: 500 }
      );
    }

    console.log('✅ Dispute resolved:', escrowId, 'Winner:', resolution);

    // TODO: Send notification to both parties
    // TODO: In production, execute token transfer based on resolution

    return NextResponse.json({
      success: true,
      message: resolution === 'seller'
        ? 'Dispute resolved in seller\'s favor. Funds released.'
        : 'Dispute resolved in buyer\'s favor. Funds refunded.',
      escrow: {
        id: escrowId,
        state: nextState,
        resolved_at: Date.now(),
      },
      resolution: disputeResolution,
    });
  } catch (error: any) {
    console.error('Resolve error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
