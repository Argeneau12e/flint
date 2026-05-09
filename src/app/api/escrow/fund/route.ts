import { NextRequest, NextResponse } from 'next/server';
import { EscrowState } from '@/lib/escrow/types';
import { canTransition } from '@/lib/escrow/state-machine';
import { createClient } from '@supabase/supabase-js';
import { notifyInvoiceFunded } from '@/lib/notifications';

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

    // REAL Flint Flow: Validate state transition (DRAFT → FUNDED_ACTIVE)
    if (escrow.state !== EscrowState.DRAFT) {
      return NextResponse.json(
        { error: `Invalid state for funding: ${escrow.state}. Expected: draft` },
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

    // Check if transition is valid (DRAFT → FUNDED_ACTIVE)
    if (!canTransition(EscrowState.DRAFT, EscrowState.FUNDED_ACTIVE, 'buyer')) {
      return NextResponse.json(
        { error: 'Invalid state transition' },
        { status: 400 }
      );
    }

    // Verify blockchain transaction in production mode
    const isDemoMode = process.env.ESCROW_MODE !== 'production';
    
    if (!isDemoMode) {
      if (!txSignature) {
        return NextResponse.json(
          { error: 'Transaction signature required in production mode' },
          { status: 400 }
        );
      }
      
      // Verify transaction on-chain
      const connection = new Connection(
        process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
      );
      
      try {
        const confirmation = await connection.confirmTransaction(txSignature, 'confirmed');
        if (confirmation.value.err) {
          return NextResponse.json(
            { error: 'Transaction failed on-chain', details: confirmation.value.err },
            { status: 400 }
          );
        }
        console.log('✅ Transaction confirmed on Solana:', txSignature);
      } catch (err: any) {
        console.error('Transaction confirmation error:', err);
        return NextResponse.json(
          { error: 'Failed to confirm transaction', details: err.message },
          { status: 400 }
        );
      }
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

    // Send notification to seller
    try {
      await notifyInvoiceFunded(
        escrow.creator_wallet,
        undefined, // userId would require account lookup
        escrow.title,
        escrow.amount,
        escrow.token_symbol,
        escrowId
      );
    } catch (err) {
      console.error('Notification error:', err);
      // Don't fail the transaction if notification fails
    }

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
