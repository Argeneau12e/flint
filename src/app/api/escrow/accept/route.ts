import { NextRequest, NextResponse } from 'next/server';
import { EscrowState } from '@/lib/escrow/types';
import { canTransition } from '@/lib/escrow/state-machine';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/escrow/accept
 * Buyer accepts the invoice - binds buyer wallet and transitions state
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

    // Validate state transition
    if (escrow.state !== EscrowState.PENDING_ACCEPTANCE) {
      return NextResponse.json(
        { error: `Invalid state for acceptance: ${escrow.state}. Expected: pending_acceptance` },
        { status: 400 }
      );
    }

    // Check if transition is valid (buyer can accept from pending_acceptance)
    if (!canTransition(EscrowState.PENDING_ACCEPTANCE, EscrowState.ACCEPTED_WAITING_FUNDING, 'buyer')) {
      return NextResponse.json(
        { error: 'Invalid state transition' },
        { status: 400 }
      );
    }

    // Update escrow: bind buyer wallet and transition state
    const { error: updateError } = await supabase
      .from('escrows')
      .update({
        buyer_wallet: buyerWallet,
        state: EscrowState.ACCEPTED_WAITING_FUNDING,
        accepted_at: Date.now(),
      })
      .eq('id', escrowId);

    if (updateError) {
      console.error('Accept update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to accept escrow', details: updateError },
        { status: 500 }
      );
    }

    console.log('✅ Escrow accepted:', escrowId, 'Buyer:', buyerWallet);

    return NextResponse.json({
      success: true,
      message: 'Invoice accepted. Please fund the escrow.',
      escrow: {
        id: escrowId,
        state: EscrowState.ACCEPTED_WAITING_FUNDING,
        buyer_wallet: buyerWallet,
        funding_deadline: escrow.funding_deadline,
      },
    });
  } catch (error: any) {
    console.error('Accept error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
