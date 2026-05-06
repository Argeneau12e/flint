import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/escrow/dispute
 * Open a dispute
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, reason } = body;

    console.log('Dispute API called:', { escrowId, reason: reason?.substring(0, 50) });

    if (!escrowId || !reason) {
      return NextResponse.json(
        { error: 'Escrow ID and reason required' },
        { status: 400 }
      );
    }

    // Simulate dispute opened
    // TODO: In production, verify state and trigger AI review

    console.log('✅ Dispute opened:', escrowId);

    return NextResponse.json({
      success: true,
      message: 'Dispute opened. AI review will begin shortly.',
    });
  } catch (error: any) {
    console.error('Dispute error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
