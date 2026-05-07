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

    // Validate state transition - allow accept from DRAFT or PENDING_ACCEPTANCE
    const currentState = escrow.state;
    const isValidAcceptState = 
      currentState === EscrowState.DRAFT || 
      currentState === EscrowState.PENDING_ACCEPTANCE;
    
    if (!isValidAcceptState) {
      return NextResponse.json(
        { error: `Invalid state for acceptance: ${escrow.state}. Expected: draft or pending_acceptance` },
        { status: 400 }
      );
    }

    // Check if transition is valid
    if (!canTransition(currentState, EscrowState.ACCEPTED_WAITING_FUNDING, 'buyer')) {
      return NextResponse.json(
        { error: 'Invalid state transition' },
        { status: 400 }
      );
    }

    // Update escrow: bind buyer wallet and transition state
    const acceptedAt = new Date().toISOString(); // PostgreSQL expects ISO string for TIMESTAMPTZ
    
    const { error: updateError } = await supabase
      .from('escrows')
      .update({
        buyer_wallet: buyerWallet,
        state: EscrowState.ACCEPTED_WAITING_FUNDING,
        accepted_at: acceptedAt,
      })
      .eq('id', escrowId);

    if (updateError) {
      console.error('Accept update error:', {
        escrowId,
        error: updateError,
        currentState: escrow.state,
        newState: EscrowState.ACCEPTED_WAITING_FUNDING,
      });
      return NextResponse.json(
        { error: 'Failed to accept escrow', details: updateError.message },
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
