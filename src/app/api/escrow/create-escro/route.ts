import { NextRequest, NextResponse } from 'next/server';

const ESCRO_API_URL = 'https://api-devnet.escro.ai';

/**
 * POST /api/escrow/create-escro
 * Create an escro escrow via REST API (simplified)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { buyerWallet, sellerWallet, amountUsdc, taskSpec, deadlineSeconds } = body;

    if (!buyerWallet || !sellerWallet || !amountUsdc) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Creating escro escrow:', { buyerWallet, sellerWallet, amountUsdc });

    // For MVP: Return mock escrow data
    // TODO: Implement proper escro API integration with wallet signing
    const escrowId = `escro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return NextResponse.json({
      success: true,
      escrowId,
      escrowPda: 'PDA_' + escrowId,
      amount: amountUsdc,
      fee: amountUsdc * 0.005,
      total: amountUsdc * 1.005,
      unsignedTransaction: null, // Will implement proper tx signing later
      note: 'MVP: Backend-tracked escrow. On-chain integration coming soon.',
    });
  } catch (error: any) {
    console.error('❌ Escro create error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create escrow' },
      { status: 500 }
    );
  }
}
