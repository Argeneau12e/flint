import { NextRequest, NextResponse } from 'next/server';
import { PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Escro } from '@escro/sdk';

const ESCRO_API_URL = 'https://api-devnet.escro.ai';
const RPC_URL = clusterApiUrl('devnet');

/**
 * POST /api/escrow/create-escro
 * Create an escro escrow (server-side)
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

    // Initialize escro client with dummy wallet (will be overridden by buyer's signature)
    const dummyWallet = {
      publicKey: new PublicKey('11111111111111111111111111111111'),
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    };
    
    const client = new Escro({
      apiUrl: ESCRO_API_URL,
      rpcUrl: RPC_URL,
      wallet: dummyWallet,
    });

    // Create escrow
    const escrow = await client.createEscrow({
      amountUsdc,
      assignedWorker: sellerWallet,
      taskSpec: {
        description: taskSpec || 'Flint escrow payment',
        acceptance_criteria: ['Deliver as specified'],
      },
      deadlineSeconds: deadlineSeconds || 7 * 24 * 60 * 60,
    });

    console.log('✅ Escro escrow created:', escrow.escrowId);

    return NextResponse.json({
      success: true,
      escrowId: escrow.escrowId,
      escrowPda: escrow.escrowPda,
      amount: amountUsdc,
      fee: amountUsdc * 0.005, // 0.5% fee
      total: amountUsdc * 1.005,
    });
  } catch (error: any) {
    console.error('❌ Escro create error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create escrow' },
      { status: 500 }
    );
  }
}
