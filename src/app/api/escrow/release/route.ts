import { NextRequest, NextResponse } from 'next/server';
import { EscrowState } from '@/lib/escrow/types';
import { canTransition } from '@/lib/escrow/state-machine';
import { createClient } from '@supabase/supabase-js';
import { notifyPaymentReleased } from '@/lib/notifications';

/**
 * POST /api/escrow/release
 * Buyer releases payment to seller (approves work)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, buyerWallet } = body;

    if (!escrowId || !buyerWallet) {
      return NextResponse.json(
        { error: 'Escrow ID and buyer wallet required' },
        { status: 400 }
      );
    }

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

    // Verify buyer is the one releasing (recipient wallet)
    // Note: In real Flint flow, the recipient is the buyer who pays
    if (escrow.recipient !== buyerWallet) {
      return NextResponse.json(
        { error: 'Only the buyer can release payment' },
        { status: 403 }
      );
    }

    // Check state transition (DELIVERED_REVIEW → RELEASED_COMPLETE)
    if (escrow.state !== EscrowState.DELIVERED_REVIEW) {
      return NextResponse.json(
        { error: `Invalid state for release: ${escrow.state}. Expected: delivered_review` },
        { status: 400 }
      );
    }

    if (!canTransition(EscrowState.DELIVERED_REVIEW, EscrowState.RELEASED_COMPLETE, 'buyer')) {
      return NextResponse.json(
        { error: 'Invalid state transition' },
        { status: 400 }
      );
    }

    // Update escrow
    const releasedAt = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from('escrows')
      .update({
        state: EscrowState.RELEASED_COMPLETE,
        released_at: releasedAt,
      })
      .eq('id', escrowId);

    if (updateError) {
      console.error('Release update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to release payment', details: updateError },
        { status: 500 }
      );
    }

    console.log('✅ Payment released:', escrowId);

    // Send notification to seller
    try {
      await notifyPaymentReleased(
        escrow.creator_wallet,
        undefined,
        escrow.title,
        escrow.amount,
        escrow.token_symbol,
        escrowId
      );
    } catch (err) {
      console.error('Notification error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment released successfully! Seller has been notified.',
      escrow: {
        id: escrowId,
        state: EscrowState.RELEASED_COMPLETE,
        released_at: releasedAt,
      },
    });
  } catch (error: any) {
    console.error('Release error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
