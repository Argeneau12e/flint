import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EscrowState } from '@/lib/escrow/types';

/**
 * POST /api/escrow/accept
 * Buyer accepts the invoice
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

    // Check state
    if (escrow.status !== EscrowState.PENDING_ACCEPTANCE) {
      return NextResponse.json(
        { error: `Invalid state: ${escrow.status}. Expected: pending_acceptance` },
        { status: 400 }
      );
    }

    // Check deadline (now in ms, deadline stored in ms)
    const now = Date.now();
    if (escrow.acceptance_deadline && now > escrow.acceptance_deadline) {
      return NextResponse.json(
        { error: 'Acceptance deadline expired' },
        { status: 400 }
      );
    }

    // Update escrow
    const { data: updatedEscrow, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: EscrowState.ACCEPTED_WAITING_FUNDING,
        recipient: buyerWallet,
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrowId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to accept escrow' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      escrow: updatedEscrow,
      message: 'Invoice accepted. Please fund the escrow.',
    });
  } catch (error: any) {
    console.error('Accept escrow error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
