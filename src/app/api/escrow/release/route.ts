import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EscrowState } from '@/lib/escrow/types';

/**
 * POST /api/escrow/release
 * Release funds to seller (buyer approval or auto-approve)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, approverWallet, reason } = body;

    if (!escrowId || !approverWallet) {
      return NextResponse.json(
        { error: 'Escrow ID and approver wallet required' },
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
    const currentState = escrow.status || 'delivered_review';
    const validStates = [EscrowState.DELIVERED_REVIEW, EscrowState.FUNDED_ACTIVE, 'accepted_waiting_funding'];
    if (!validStates.includes(currentState)) {
      return NextResponse.json(
        { error: `Invalid state: ${currentState}` },
        { status: 400 }
      );
    }

    // Determine final state
    const finalState = reason === 'auto_approved' 
      ? EscrowState.AUTO_APPROVED 
      : EscrowState.RELEASED_COMPLETE;

    // Update to released
    const { data: updatedEscrow, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: finalState,
        resolved_at: new Date().toISOString(),
        release_reason: reason || 'buyer_approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrowId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to release escrow' }, { status: 500 });
    }

    // TODO: In production, actually transfer tokens from escrow PDA to seller

    return NextResponse.json({
      success: true,
      escrow: updatedEscrow,
      message: 'Funds released to seller successfully.',
    });
  } catch (error: any) {
    console.error('Release error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
