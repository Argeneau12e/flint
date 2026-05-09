/**
 * escro Protocol Integration
 * Pre-deployed escrow protocol on Solana
 * Docs: https://escro.ai/docs
 */

import { EscroClient } from '@escro/sdk';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

// Use devnet for testing
const ESCRO_API_URL = 'https://api-devnet.escro.ai';
const SOLANA_RPC_URL = clusterApiUrl('devnet');

// Initialize escro client
export const escroClient = new EscroClient({
  apiUrl: ESCRO_API_URL,
  connection: new Connection(SOLANA_RPC_URL, 'confirmed'),
});

/**
 * Create an escrow for Flint invoice
 * 
 * @param buyerWallet - Alice's wallet (buyer)
 * @param sellerWallet - Bob's wallet (assigned worker)
 * @param amountUsdc - Amount in USDC
 * @param taskSpec - Task description/requirements
 * @param deadlineSeconds - Delivery deadline (default: 7 days)
 */
export async function createEscroEscrow(
  buyerWallet: PublicKey,
  sellerWallet: PublicKey,
  amountUsdc: number,
  taskSpec: string,
  deadlineSeconds: number = 7 * 24 * 60 * 60 // 7 days
) {
  try {
    console.log('Creating escro escrow:', {
      buyer: buyerWallet.toString(),
      seller: sellerWallet.toString(),
      amountUsdc,
      taskSpec,
    });

    // Create escrow via escro SDK
    const escrow = await escroClient.createEscrow({
      amountUsdc,
      assignedWorker: sellerWallet,
      taskSpec: {
        description: taskSpec,
        acceptance_criteria: ['Deliver as specified'],
      },
      deadlineSeconds,
    });

    console.log('✅ Escro escrow created:', escrow.escrowId);
    console.log('📝 Escrow PDA:', escrow.escrowPda);

    return {
      success: true,
      escrowId: escrow.escrowId,
      escrowPda: escrow.escrowPda,
      amount: amountUsdc,
      fee: amountUsdc * 0.005, // 0.5% fee
      total: amountUsdc * 1.005, // Buyer pays amount + fee
    };
  } catch (error: any) {
    console.error('❌ Escro create error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Claim escrow task (Bob starts work)
 */
export async function claimEscroTask(escrowId: string, sellerWallet: PublicKey) {
  try {
    console.log('Claiming escrow task:', escrowId);
    
    const result = await escroClient.claimTask(escrowId);
    
    console.log('✅ Task claimed:', escrowId);
    return {
      success: true,
      state: result.state,
    };
  } catch (error: any) {
    console.error('❌ Claim error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Submit deliverable (Bob delivers work)
 */
export async function submitEscroDeliverable(
  escrowId: string,
  sellerWallet: PublicKey,
  deliverableHash: string,
  proofUri: string
) {
  try {
    console.log('Submitting deliverable:', escrowId);
    
    const result = await escroClient.submitDeliverable(escrowId, {
      contentHash: deliverableHash,
      proofUri,
    });
    
    console.log('✅ Deliverable submitted:', escrowId);
    return {
      success: true,
      state: result.state,
    };
  } catch (error: any) {
    console.error('❌ Submit error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Release payment (Alice approves)
 */
export async function releaseEscroPayment(escrowId: string, buyerWallet: PublicKey) {
  try {
    console.log('Releasing payment:', escrowId);
    
    const result = await escroClient.releasePayment(escrowId);
    
    console.log('✅ Payment released:', escrowId);
    return {
      success: true,
      state: result.state,
    };
  } catch (error: any) {
    console.error('❌ Release error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get escrow status
 */
export async function getEscrowStatus(escrowId: string) {
  try {
    const escrow = await escroClient.getEscrow(escrowId);
    
    return {
      success: true,
      escrow: {
        id: escrow.escrowId,
        pda: escrow.escrowPda,
        state: escrow.state,
        buyer: escrow.buyer,
        worker: escrow.assignedWorker,
        amount: escrow.amountUsdc,
        fee: escrow.feeBps / 100, // Convert bps to percentage
        createdAt: escrow.createdAt,
        submittedAt: escrow.submittedAt,
        deadline: escrow.deadline,
      },
    };
  } catch (error: any) {
    console.error('❌ Status error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Cancel escrow (before worker claims)
 */
export async function cancelEscroEscrow(escrowId: string, buyerWallet: PublicKey) {
  try {
    console.log('Cancelling escrow:', escrowId);
    
    const result = await escroClient.cancelEscrow(escrowId);
    
    console.log('✅ Escrow cancelled:', escrowId);
    return {
      success: true,
      state: result.state,
    };
  } catch (error: any) {
    console.error('❌ Cancel error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Raise dispute
 */
export async function raiseEscroDispute(
  escrowId: string,
  wallet: PublicKey,
  reason: string
) {
  try {
    console.log('Raising dispute:', escrowId, reason);
    
    const result = await escroClient.dispute(escrowId, { reason });
    
    console.log('✅ Dispute raised:', escrowId);
    return {
      success: true,
      state: result.state,
    };
  } catch (error: any) {
    console.error('❌ Dispute error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}
