import { NextRequest, NextResponse } from 'next/server';

const ESCRO_API_URL = 'https://api-devnet.escro.ai';

/**
 * POST /api/escrow/create-escro
 * Create an escro escrow via REST API (server-side)
 * 
 * Note: The actual on-chain transaction is signed by the buyer's wallet
 * This endpoint just prepares the escrow data
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

    // For now, return escrow data directly
    // The actual escro integration requires buyer to sign on-chain
    // This is a placeholder until we implement proper wallet connection flow
    
    // Generate a unique escrow ID
    const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('✅ Escrow prepared:', escrowId);

    return NextResponse.json({
      success: true,
      escrowId: escrowId,
      escrowPda: 'PDA_PLACEHOLDER',
      amount: amountUsdc,
      fee: amountUsdc * 0.005, // 0.5% fee
      total: amountUsdc * 1.005,
      note: 'Direct on-chain escrow integration pending wallet connection flow',
    });
  } catch (error: any) {
    console.error('❌ Escrow create error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create escrow' },
      { status: 500 }
    );
  }
}
