import { NextRequest, NextResponse } from 'next/server';
import { EscrowState } from '@/lib/escrow/types';
import { canTransition } from '@/lib/escrow/state-machine';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/escrow/accept
 * DEPRECATED in REAL Flint Flow
 * 
 * In REAL flow, Alice doesn't "accept" - she just funds.
 * This endpoint is kept for backward compatibility only.
 * Use /api/escrow/fund instead.
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

    // REAL Flow: Only DRAFT state can be accepted/funded
    const currentState = escrow.state;
    
    if (currentState !== EscrowState.DRAFT) {
      return NextResponse.json(
        { error: `Invalid state for acceptance: ${escrow.state}. Expected: draft` },
        { status: 400 }
      );
    }

    // Check if link has expired
    if (escrow.link_expires_at && new Date() > new Date(escrow.link_expires_at)) {
      return NextResponse.json(
        { error: 'Payment link has expired' },
        { status: 410 }
      );
    }

    // In REAL flow, accept + fund happen together
    // For backward compatibility, we'll just bind the buyer wallet
    // Actual funding happens via /api/escrow/fund
    const acceptedAt = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from('escrows')
      .update({
        buyer_wallet: buyerWallet,
        // Keep in DRAFT state until actual funding
        // buyer_wallet is bound but state doesn't change yet
      })
      .eq('id', escrowId);

    if (updateError) {
      console.error('Accept update error:', {
        escrowId,
        error: updateError,
      });
      return NextResponse.json(
        { error: 'Failed to accept escrow', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Escrow accepted (buyer bound):', escrowId, 'Buyer:', buyerWallet);

    return NextResponse.json({
      success: true,
      message: 'Buyer wallet bound. Proceed to fund the escrow.',
      escrow: {
        id: escrowId,
        state: EscrowState.DRAFT,
        buyer_wallet: buyerWallet,
        link_expires_at: escrow.link_expires_at,
      },
      note: 'In REAL Flint Flow, use /api/escrow/fund to complete the payment.',
    });
  } catch (error: any) {
    console.error('Accept error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
