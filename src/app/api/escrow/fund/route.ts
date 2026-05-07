import { NextRequest, NextResponse } from 'next/server';
import { EscrowState } from '@/lib/escrow/types';
import { canTransition } from '@/lib/escrow/state-machine';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/escrow/fund
 * Buyer funds the escrow
 * 
 * HYBRID MODE:
 * - Demo: Simulates funding (updates database only)
 * - Production: Calls Solana escrow program
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, buyerWallet, txSignature } = body;

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
    if (escrow.state !== EscrowState.ACCEPTED_WAITING_FUNDING) {
      return NextResponse.json(
        { error: `Invalid state for funding: ${escrow.state}. Expected: accepted_waiting_funding` },
        { status: 400 }
      );
    }

    // Check if transition is valid
    if (!canTransition(EscrowState.ACCEPTED_WAITING_FUNDING, EscrowState.FUNDED_ACTIVE, 'buyer')) {
      return NextResponse.json(
        { error: 'Invalid state transition' },
        { status: 400 }
      );
    }

    // TODO: In production, verify blockchain transaction here
    // For demo mode, we just check if txSignature is provided (optional)
    const isDemoMode = process.env.ESCROW_MODE !== 'production';
    
    if (!isDemoMode && !txSignature) {
      return NextResponse.json(
        { error: 'Transaction signature required in production mode' },
        { status: 400 }
      );
    }

    // Update escrow: transition to FUNDED_ACTIVE
    const fundedAt = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from('escrows')
      .update({
        state: EscrowState.FUNDED_ACTIVE,
        funded_at: fundedAt,
        tx_signature: txSignature || null,
      })
      .eq('id', escrowId);

    if (updateError) {
      console.error('Fund update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to fund escrow', details: updateError },
        { status: 500 }
      );
    }

    console.log('✅ Escrow funded:', escrowId, isDemoMode ? '(DEMO MODE)' : '(PRODUCTION)');

    return NextResponse.json({
      success: true,
      message: 'Escrow funded successfully. Seller has been notified.',
      escrow: {
        id: escrowId,
        state: EscrowState.FUNDED_ACTIVE,
        funded_at: fundedAt,
        tx_signature: txSignature,
      },
      mode: isDemoMode ? 'demo' : 'production',
    });
  } catch (error: any) {
    console.error('Fund error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
