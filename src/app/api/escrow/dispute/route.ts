import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EscrowState } from '@/lib/escrow/types';

/**
 * POST /api/escrow/dispute
 * Open a dispute
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, disputantWallet, reason, evidence } = body;

    if (!escrowId || !disputantWallet || !reason) {
      return NextResponse.json(
        { error: 'Escrow ID, disputant wallet, and reason required' },
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
    if (currentState !== EscrowState.DELIVERED_REVIEW && currentState !== 'funded_active') {
      return NextResponse.json(
        { error: `Invalid state: ${currentState}. Can only dispute during review period.` },
        { status: 400 }
      );
    }

    // Update to disputed
    const { data: updatedEscrow, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: EscrowState.DISPUTED,
        dispute_reason: reason,
        dispute_evidence: evidence || '',
        disputed_at: new Date().toISOString(),
        disputed_by: disputantWallet,
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrowId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to open dispute' }, { status: 500 });
    }

    // TODO: Trigger AI dispute resolution here

    return NextResponse.json({
      success: true,
      escrow: updatedEscrow,
      message: 'Dispute opened. AI review will begin shortly.',
    });
  } catch (error: any) {
    console.error('Dispute error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
