import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/escrow/deliver
 * Seller marks work as delivered
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, sellerWallet } = body;

    console.log('Deliver API called:', { escrowId, sellerWallet });

    if (!escrowId) {
      return NextResponse.json(
        { error: 'Escrow ID required' },
        { status: 400 }
      );
    }

    // Simulate successful delivery
    // TODO: In production, verify state and update on-chain

    console.log('✅ Deliver success:', escrowId);

    return NextResponse.json({
      success: true,
      message: 'Work marked as delivered. Buyer has 7 days to review.',
    });
  } catch (error: any) {
    console.error('Deliver error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
