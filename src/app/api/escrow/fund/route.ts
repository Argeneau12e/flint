import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/escrow/fund
 * Buyer funds the escrow (simulated - in production, this would interact with Solana)
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

    // Simulate successful funding
    console.log('✅ Escrow funded:', escrowId);

    return NextResponse.json({
      success: true,
      message: 'Escrow funded successfully. Seller has been notified.',
    });
  } catch (error: any) {
    console.error('Fund error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
