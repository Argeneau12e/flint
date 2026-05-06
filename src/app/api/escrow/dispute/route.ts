import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/escrow/dispute
 * Open a dispute
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, disputantWallet, reason } = body;

    if (!escrowId || !disputantWallet || !reason) {
      return NextResponse.json(
        { error: 'Escrow ID, disputant wallet, and reason required' },
        { status: 400 }
      );
    }

    // Simulate dispute opened
    // TODO: In production, verify state and trigger AI review

    return NextResponse.json({
      success: true,
      message: 'Dispute opened. AI review will begin shortly.',
    });
  } catch (error: any) {
    console.error('Dispute error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
