import { NextRequest, NextResponse } from 'next/server';

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

    // Simulate successful acceptance
    // TODO: In production, verify state and update on-chain

    return NextResponse.json({
      success: true,
      message: 'Invoice accepted. Please fund the escrow.',
    });
  } catch (error: any) {
    console.error('Accept error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
