import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import * as nacl from 'tweetnacl';

const ESCRO_API_URL = 'https://api-devnet.escro.ai';

/**
 * POST /api/escrow/create-escro
 * Create an escro escrow via REST API
 * 
 * Flow:
 * 1. Create temporary keypair for API auth
 * 2. Call escro API to create escrow
 * 3. Return unsigned transaction for buyer to sign
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

    // Create temporary keypair for API authentication
    const tempKeypair = Keypair.generate();
    const timestamp = Date.now().toString();
    const method = 'POST';
    const path = '/v1/escrows';
    
    // Create signature: "escro:{timestamp}:{METHOD}:{path}"
    const message = `escro:${timestamp}:${method}:${path}`;
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, tempKeypair.secretKey);
    
    const signatureBase64 = Buffer.from(signature).toString('base64');
    const publicKeyBase64 = Buffer.from(tempKeypair.publicKey.toBytes()).toString('base64');

    // Call escro REST API
    const response = await fetch(`${ESCRO_API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Wallet-Address': publicKeyBase64,
        'X-Timestamp': timestamp,
        'X-Signature': signatureBase64,
      },
      body: JSON.stringify({
        amountUsdc,
        assignedWorker: sellerWallet,
        taskSpec: {
          description: taskSpec || 'Flint escrow payment',
          acceptance_criteria: ['Deliver as specified'],
        },
        deadlineSeconds: deadlineSeconds || 7 * 24 * 60 * 60,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Escro API error:', errorText);
      throw new Error(errorText || 'Failed to create escrow');
    }

    const escrow = await response.json();
    
    console.log('✅ Escro escrow created:', escrow.escrowId);

    return NextResponse.json({
      success: true,
      escrowId: escrow.escrowId,
      escrowPda: escrow.escrowPda,
      amount: amountUsdc,
      fee: amountUsdc * 0.005,
      total: amountUsdc * 1.005,
      // Return transaction for buyer to sign
      unsignedTransaction: escrow.unsignedTransaction,
    });
  } catch (error: any) {
    console.error('❌ Escro create error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create escrow' },
      { status: 500 }
    );
  }
}
