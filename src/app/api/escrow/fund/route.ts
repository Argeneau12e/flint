import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EscrowState } from '@/lib/escrow/types';

/**
 * POST /api/escrow/fund
 * Buyer funds the escrow (simulated - in production, this would interact with Solana)
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current escrow
    const { data: escrow, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (fetchError || !escrow) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
    }

    // Check state (allow null for new invoices)
    const currentState = escrow.status || 'accepted_waiting_funding';
    if (currentState !== EscrowState.ACCEPTED_WAITING_FUNDING && currentState !== 'pending_acceptance') {
      return NextResponse.json(
        { error: `Invalid state: ${currentState}. Expected: accepted_waiting_funding` },
        { status: 400 }
      );
    }

    // Check deadline (now in ms, deadline stored in ms)
    const now = Date.now();
    if (escrow.funding_deadline && now > escrow.funding_deadline) {
      // Auto-cancel
      await supabase
        .from('invoices')
        .update({
          status: EscrowState.AUTO_CANCELLED,
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrowId);

      return NextResponse.json(
        { error: 'Funding deadline expired. Escrow auto-cancelled.' },
        { status: 400 }
      );
    }

    // Update escrow to funded
    const { data: updatedEscrow, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: EscrowState.FUNDED_ACTIVE,
        payer_wallet: buyerWallet,
        tx_signature: txSignature || '',
        funded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrowId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to fund escrow' }, { status: 500 });
    }

    // TODO: In production, actually transfer tokens to escrow PDA here

    return NextResponse.json({
      success: true,
      escrow: updatedEscrow,
      message: 'Escrow funded successfully. Seller has been notified.',
    });
  } catch (error: any) {
    console.error('Fund escrow error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
