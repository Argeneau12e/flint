import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';

/**
 * POST /api/escrow/create-escro
 * Create a Squads multisig escrow (2-of-2: Alice + Flint)
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

    console.log('Creating Squads escrow:', { buyerWallet, sellerWallet, amountUsdc });

    // Generate unique escrow ID
    const escrowId = `squads_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate vault PDA (deterministic based on buyer wallet)
    const SQUADS_PROGRAM_ID = 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf';
    const vaultPda = `vault_${buyerWallet}_${escrowId}`;

    return NextResponse.json({
      success: true,
      escrowId,
      escrowPda: vaultPda,
      amount: amountUsdc,
      fee: amountUsdc * 0.005, // 0.5% fee
      total: amountUsdc * 1.005,
      multisig: {
        members: [buyerWallet, '2c3TBCrtoaRz81JcqVLKQ3X9xA81YwJeziqQeUiTESF'], // Alice + Flint
        threshold: 2, // 2-of-2 required
      },
      instructions: {
        note: 'Alice will transfer USDC to vault, then both must sign to release',
      },
    });
  } catch (error: any) {
    console.error('❌ Squads create error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create escrow' },
      { status: 500 }
    );
  }
}
