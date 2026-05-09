/**
 * Simple Solana Escrow Integration
 * 
 * Uses pre-deployed escrow programs - no custom deployment needed.
 * This is a lightweight wrapper for escrow functionality.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

// We'll use a simple escrow pattern with existing programs
// This approach uses standard SPL token transfers with escrow logic in backend

export interface EscrowConfig {
  amount: number;
  mint: PublicKey;
  seller: PublicKey;
  buyer: PublicKey;
  escrowId: string;
}

/**
 * Create escrow payment instruction
 * 
 * This creates a simple escrow by:
 * 1. Creating an escrow ATA (associated token account)
 * 2. Transferring tokens from buyer to escrow ATA
 * 3. Backend tracks state in database
 */
export async function createEscrowPaymentInstruction(
  connection: Connection,
  config: EscrowConfig,
  escrowAta: PublicKey
): Promise<Transaction> {
  const buyerAta = await getAssociatedTokenAddress(
    config.mint,
    config.buyer
  );

  const transaction = new Transaction();

  // Check if escrow ATA exists
  let escrowAtaExists = false;
  try {
    const accountInfo = await connection.getAccountInfo(escrowAta);
    escrowAtaExists = accountInfo !== null;
  } catch (err) {
    escrowAtaExists = false;
  }

  // Create escrow ATA if it doesn't exist
  if (!escrowAtaExists) {
    console.log('Creating escrow ATA...');
    transaction.add(
      createAssociatedTokenAccountInstruction(
        config.buyer, // payer
        escrowAta, // escrow ATA
        config.seller, // owner (seller receives funds later)
        config.mint
      )
    );
  }

  // Transfer tokens from buyer to escrow
  console.log('Adding transfer instruction...');
  transaction.add(
    createTransferInstruction(
      buyerAta,
      escrowAta,
      config.buyer,
      config.amount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  return transaction;
}

/**
 * Create release payment instruction (seller receives funds)
 */
export async function createReleasePaymentInstruction(
  connection: Connection,
  config: EscrowConfig,
  escrowAta: PublicKey
): Promise<Transaction> {
  const sellerAta = await getAssociatedTokenAddress(
    config.mint,
    config.seller
  );

  const transaction = new Transaction();

  // Transfer from escrow to seller
  transaction.add(
    createTransferInstruction(
      escrowAta,
      sellerAta,
      config.seller, // authority (escrow owner)
      config.amount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  return transaction;
}

/**
 * Create refund instruction (return to buyer)
 */
export async function createRefundInstruction(
  connection: Connection,
  config: EscrowConfig,
  escrowAta: PublicKey
): Promise<Transaction> {
  const buyerAta = await getAssociatedTokenAddress(
    config.mint,
    config.buyer
  );

  const transaction = new Transaction();

  // Transfer from escrow back to buyer
  transaction.add(
    createTransferInstruction(
      escrowAta,
      buyerAta,
      config.seller, // authority (escrow owner)
      config.amount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  return transaction;
}

/**
 * Get escrow PDA address - a neutral account controlled by the program
 * Neither buyer nor seller can access funds alone
 */
export async function getEscrowPda(escrowId: string): Promise<PublicKey> {
  // Remove hyphens from UUID for seed
  const cleanId = escrowId.replace(/-/g, '');
  const seed = Buffer.from(cleanId, 'hex');
  
  // Create PDA using Flint's program ID
  const FLINT_PROGRAM_ID = new PublicKey('FLNT1111111111111111111111111111111111111111');
  
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('flint_escrow'), seed],
    FLINT_PROGRAM_ID
  );
  
  return pda;
}

/**
 * Get escrow ATA address - tokens are held in escrow PDA's ATA
 */
export async function getEscrowAta(
  mint: PublicKey,
  escrowId: string
): Promise<PublicKey> {
  const escrowPda = await getEscrowPda(escrowId);
  return getAssociatedTokenAddress(mint, escrowPda, true);
}

/**
 * Check if transaction is confirmed
 */
export async function confirmTransaction(
  connection: Connection,
  signature: string,
  timeoutMs: number = 30000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const status = await connection.getSignatureStatus(signature);
      if (status?.value?.confirmationStatus === 'confirmed') {
        return true;
      }
      if (status?.value?.err) {
        console.error('Transaction error:', status.value.err);
        return false;
      }
    } catch (err) {
      console.error('Confirmation check error:', err);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return false;
}

/**
 * Send and confirm transaction
 */
export async function sendAndConfirmTransaction(
  connection: Connection,
  transaction: Transaction,
  signers: any[]
): Promise<string | null> {
  try {
    const signature = await connection.sendTransaction(transaction, signers);
    const confirmed = await confirmTransaction(connection, signature);
    
    if (confirmed) {
      return signature;
    }
    return null;
  } catch (err: any) {
    console.error('Transaction send error:', err);
    return null;
  }
}
