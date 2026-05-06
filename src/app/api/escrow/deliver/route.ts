import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/escrow/deliver
 * Seller marks work as delivered
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, sellerWallet } = body;

    if (!escrowId || !sellerWallet) {
      return NextResponse.json(
        { error: 'Escrow ID and seller wallet required' },
        { status: 400 }
      );
    }

    // Simulate successful delivery
    // TODO: In production, verify state and update on-chain

    return NextResponse.json({
      success: true,
      message: 'Work marked as delivered. Buyer has 7 days to review.',
    });
  } catch (error: any) {
    console.error('Deliver error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
