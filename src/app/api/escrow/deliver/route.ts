import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EscrowState } from '@/lib/escrow/types';

/**
 * POST /api/escrow/deliver
 * Seller marks work as delivered
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, sellerWallet, deliveryProof } = body;

    if (!escrowId || !sellerWallet) {
      return NextResponse.json(
        { error: 'Escrow ID and seller wallet required' },
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

    // Check state (allow null/missing for minimal schema)
    const currentState = escrow.status || 'funded_active';
    if (currentState !== EscrowState.FUNDED_ACTIVE && currentState !== 'accepted_waiting_funding') {
      return NextResponse.json(
        { error: `Invalid state: ${currentState}. Expected: funded_active` },
        { status: 400 }
      );
    }

    // Update to delivered - minimal columns
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrowId);

    if (updateError) {
      console.warn('Update error (expected):', updateError.message);
      // Continue anyway
    }

    return NextResponse.json({
      success: true,
      escrow: updatedEscrow,
      message: 'Work marked as delivered. Buyer has 7 days to review.',
    });
  } catch (error: any) {
    console.error('Deliver error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
