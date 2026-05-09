import { NextRequest, NextResponse } from 'next/server';
import { EscrowState } from '@/lib/escrow/types';
import { canTransition } from '@/lib/escrow/state-machine';
import { createClient } from '@supabase/supabase-js';
import { notifyWorkDelivered } from '@/lib/notifications';

/**
 * POST /api/escrow/deliver
 * Seller submits delivery
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, sellerWallet, deliveryNotes, deliveryUrl } = body;

    if (!escrowId || !sellerWallet) {
      return NextResponse.json(
        { error: 'Escrow ID and seller wallet required' },
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
      .from('escrow_invoices')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (fetchError || !escrow) {
      return NextResponse.json(
        { error: 'Escrow not found' },
        { status: 404 }
      );
    }

    // Verify seller is the one delivering
    if (escrow.creator_wallet !== sellerWallet) {
      return NextResponse.json(
        { error: 'Only the seller can submit delivery' },
        { status: 403 }
      );
    }

    // Check state transition (FUNDED_ACTIVE → DELIVERED_REVIEW)
    if (escrow.state !== EscrowState.FUNDED_ACTIVE) {
      return NextResponse.json(
        { error: `Invalid state for delivery: ${escrow.state}. Expected: funded_active` },
        { status: 400 }
      );
    }

    if (!canTransition(EscrowState.FUNDED_ACTIVE, EscrowState.DELIVERED_REVIEW, 'creator')) {
      return NextResponse.json(
        { error: 'Invalid state transition' },
        { status: 400 }
      );
    }

    // Update escrow
    const deliveredAt = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from('escrow_invoices')
      .update({
        state: EscrowState.DELIVERED_REVIEW,
        delivered_at: deliveredAt,
        delivery_notes: deliveryNotes || null,
        delivery_url: deliveryUrl || null,
      })
      .eq('id', escrowId);

    if (updateError) {
      console.error('Deliver update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to submit delivery', details: updateError },
        { status: 500 }
      );
    }

    console.log('✅ Work delivered:', escrowId);

    // Send notification to buyer (Alice)
    try {
      // Get buyer wallet from escrow (we'll need to store this when creating escrow)
      const buyerWallet = escrow.client_wallet || escrow.buyer_wallet;
      if (buyerWallet) {
        await notifyWorkDelivered(
          buyerWallet,
          undefined,
          escrow.title,
          escrowId
        );
      }
    } catch (err) {
      console.error('Notification error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery submitted successfully',
      escrow: {
        id: escrowId,
        state: EscrowState.DELIVERED_REVIEW,
        delivered_at: deliveredAt,
      },
    });
  } catch (error: any) {
    console.error('Deliver error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
