import { NextRequest, NextResponse } from 'next/server';
import { EscrowState } from '@/lib/escrow/types';
import { canTransition } from '@/lib/escrow/state-machine';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/escrow/dispute
 * Buyer or seller opens a dispute
 * Transitions: DELIVERED_REVIEW → DISPUTED
 * Freezes funds until resolution
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, initiatorWallet, reason, evidence } = body;

    if (!escrowId || !initiatorWallet) {
      return NextResponse.json(
        { error: 'Escrow ID and initiator wallet required' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Dispute reason must be at least 10 characters' },
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

    // Validate state
    if (escrow.state !== EscrowState.DELIVERED_REVIEW) {
      return NextResponse.json(
        { error: `Invalid state for dispute: ${escrow.state}. Expected: delivered_review` },
        { status: 400 }
      );
    }

    // Verify initiator is either buyer or seller
    const isBuyer = escrow.buyer_wallet === initiatorWallet;
    const isSeller = escrow.creator_wallet === initiatorWallet;
    
    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: 'Only buyer or seller can open dispute' },
        { status: 403 }
      );
    }

    // Check if transition is valid (buyer can dispute from delivered_review)
    if (!canTransition(EscrowState.DELIVERED_REVIEW, EscrowState.DISPUTED, 'buyer')) {
      return NextResponse.json(
        { error: 'Invalid state transition' },
        { status: 400 }
      );
    }

    // Update escrow: transition to DISPUTED
    const { error: updateError } = await supabase
      .from('escrows')
      .update({
        state: EscrowState.DISPUTED,
        dispute_reason: reason,
        dispute_evidence: evidence ? JSON.stringify(evidence) : null,
        resolved_at: null, // Clear resolved_at since we're now in dispute
      })
      .eq('id', escrowId);

    if (updateError) {
      console.error('Dispute update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to open dispute', details: updateError },
        { status: 500 }
      );
    }

    console.log('✅ Dispute opened:', escrowId, 'Initiator:', initiatorWallet, 'Reason:', reason);

    // TODO: Send notification to both parties + Flint team
    // TODO: Start AI analysis of dispute

    return NextResponse.json({
      success: true,
      message: 'Dispute opened. Funds are frozen pending resolution.',
      escrow: {
        id: escrowId,
        state: EscrowState.DISPUTED,
        dispute_reason: reason,
        opened_at: new Date().toISOString(),
      },
      next_steps: {
        description: 'Both parties can submit evidence. AI will analyze and recommend resolution.',
        evidence_deadline: Date.now() + (48 * 60 * 60 * 1000), // 48 hours
        resolution_eta: '24-48 hours',
      },
    });
  } catch (error: any) {
    console.error('Dispute error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
