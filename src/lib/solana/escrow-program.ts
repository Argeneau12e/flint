/**
 * Flint Escrow Program - Client SDK
 * 
 * Interfaces with the Flint Escrow Solana Program
 * Program ID: FLiNT7xKqUvMvJz9pN8xR3qYwZ2hGfDsA1bC4eE5fF6g
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

// Program ID (update after deployment)
export const FLINT_ESCROW_PROGRAM_ID = new PublicKey(
  'FLiNT7xKqUvMvJz9pN8xR3qYwZ2hGfDsA1bC4eE5fF6g'
);

// Escrow state enum (matches Rust program)
export enum EscrowState {
  Draft = 0,
  Funded,
  Delivered,
  Released,
  AutoReleased,
  Refunded,
  Cancelled,
}

/**
 * Get escrow PDA address
 */
export function getEscrowPda(escrowId: Uint8Array): { publicKey: PublicKey; bump: number } {
  const [publicKey, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), escrowId],
    FLINT_ESCROW_PROGRAM_ID
  );
  return { publicKey, bump };
}

/**
 * Create initialize escrow instruction
 */
export function createInitializeEscrowInstruction(
  creator: PublicKey,
  escrowId: Uint8Array,
  amount: number,
  deliveryDeadline: number,
  mint: PublicKey
): TransactionInstruction {
  const { publicKey: escrowPda, bump } = getEscrowPda(escrowId);

  const data = Buffer.from([
    0, // Instruction discriminator (initialize_escrow)
    ...Buffer.from(escrowId),
    ...Buffer.from(new BigUint64Array([BigInt(amount)]).buffer),
    ...Buffer.from(new BigInt64Array([BigInt(deliveryDeadline)]).buffer),
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: escrowPda, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: true, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: FLINT_ESCROW_PROGRAM_ID,
    data,
  });
}

/**
 * Create fund escrow instruction
 */
export async function createFundEscrowInstruction(
  connection: Connection,
  buyer: PublicKey,
  escrowId: Uint8Array,
  escrowAccount: any
): Promise<TransactionInstruction> {
  const { publicKey: escrowPda } = getEscrowPda(escrowId);
  const escrowAta = await getAssociatedTokenAddress(
    new PublicKey(escrowAccount.mint),
    escrowPda,
    true // allow owner to be PDA
  );
  const buyerAta = await getAssociatedTokenAddress(
    new PublicKey(escrowAccount.mint),
    buyer
  );

  const data = Buffer.from([1]); // Instruction discriminator (fund_escrow)

  return new TransactionInstruction({
    keys: [
      { pubkey: escrowPda, isSigner: false, isWritable: true },
      { pubkey: buyer, isSigner: true, isWritable: true },
      { pubkey: buyerAta, isSigner: false, isWritable: true },
      { pubkey: escrowAta, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: FLINT_ESCROW_PROGRAM_ID,
    data,
  });
}

/**
 * Create deliver instruction
 */
export function createDeliverInstruction(
  creator: PublicKey,
  escrowId: Uint8Array
): TransactionInstruction {
  const { publicKey: escrowPda } = getEscrowPda(escrowId);

  const data = Buffer.from([2]); // Instruction discriminator (deliver)

  return new TransactionInstruction({
    keys: [
      { pubkey: escrowPda, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: true, isWritable: false },
    ],
    programId: FLINT_ESCROW_PROGRAM_ID,
    data,
  });
}

/**
 * Create release instruction
 */
export async function createReleaseInstruction(
  connection: Connection,
  buyer: PublicKey,
  escrowId: Uint8Array,
  escrowAccount: any
): Promise<TransactionInstruction> {
  const { publicKey: escrowPda } = getEscrowPda(escrowId);
  const escrowAta = await getAssociatedTokenAddress(
    new PublicKey(escrowAccount.mint),
    escrowPda,
    true
  );
  const sellerAta = await getAssociatedTokenAddress(
    new PublicKey(escrowAccount.mint),
    new PublicKey(escrowAccount.creator)
  );

  const data = Buffer.from([3]); // Instruction discriminator (release)

  return new TransactionInstruction({
    keys: [
      { pubkey: escrowPda, isSigner: false, isWritable: true },
      { pubkey: buyer, isSigner: true, isWritable: false },
      { pubkey: escrowAta, isSigner: false, isWritable: true },
      { pubkey: sellerAta, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: FLINT_ESCROW_PROGRAM_ID,
    data,
  });
}

/**
 * Create refund instruction
 */
export async function createRefundInstruction(
  connection: Connection,
  escrowId: Uint8Array,
  escrowAccount: any
): Promise<TransactionInstruction> {
  const { publicKey: escrowPda } = getEscrowPda(escrowId);
  const escrowAta = await getAssociatedTokenAddress(
    new PublicKey(escrowAccount.mint),
    escrowPda,
    true
  );
  const buyerAta = await getAssociatedTokenAddress(
    new PublicKey(escrowAccount.mint),
    new PublicKey(escrowAccount.buyer)
  );

  const data = Buffer.from([4]); // Instruction discriminator (refund)

  return new TransactionInstruction({
    keys: [
      { pubkey: escrowPda, isSigner: false, isWritable: true },
      { pubkey: escrowAta, isSigner: false, isWritable: true },
      { pubkey: buyerAta, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: FLINT_ESCROW_PROGRAM_ID,
    data,
  });
}

/**
 * Fetch escrow account data
 */
export async function fetchEscrowAccount(
  connection: Connection,
  escrowId: Uint8Array
): Promise<any | null> {
  const { publicKey: escrowPda } = getEscrowPda(escrowId);
  
  try {
    const accountInfo = await connection.getAccountInfo(escrowPda);
    if (!accountInfo) return null;

    // Parse account data (simplified - would need proper borsh deserialization)
    const data = accountInfo.data;
    
    return {
      publicKey: escrowPda,
      escrowId: data.slice(0, 16),
      creator: new PublicKey(data.slice(16, 48)),
      buyer: new PublicKey(data.slice(48, 80)),
      mint: new PublicKey(data.slice(80, 112)),
      amount: Number(data.readBigUInt64LE(112)),
      state: data[120],
      deliveryDeadline: Number(data.readBigInt64LE(121)),
      reviewDeadline: Number(data.readBigInt64LE(129)),
      bump: data[137],
      createdAt: Number(data.readBigInt64LE(138)),
    };
  } catch (error) {
    console.error('Error fetching escrow account:', error);
    return null;
  }
}

/**
 * Check if program is deployed
 */
export async function isProgramDeployed(connection: Connection): Promise<boolean> {
  try {
    const accountInfo = await connection.getAccountInfo(FLINT_ESCROW_PROGRAM_ID);
    return accountInfo !== null && accountInfo.executable;
  } catch {
    return false;
  }
}
