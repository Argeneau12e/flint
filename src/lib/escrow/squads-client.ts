/**
 * Squads Protocol Integration
 * 2-of-2 Multisig Escrow (Alice + Flint)
 * 
 * Program ID: SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf
 */

import {
  Multisig,
  Vault,
  TransactionMessage,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@sqds/multisig';
import {
  PublicKey,
  Connection,
  Transaction,
  SystemProgram,
  clusterApiUrl,
} from '@solana/web3.js';

const SQUADS_PROGRAM_ID = new PublicKey('SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf');
const DEVNET_RPC = clusterApiUrl('devnet');

// Flint treasury wallet (co-signer)
const FLINT_TREASURY = new PublicKey('2c3TBCrtoaRz81JcqVLKQ3X9xA81YwJeziqQeUiTESF');

/**
 * Create a 2-of-2 multisig vault for escrow
 * Members: Alice (buyer) + Flint Treasury
 */
export async function createEscrowVault(
  connection: Connection,
  buyerWallet: PublicKey,
  amountLamports: number
) {
  // Create vault PDA
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('flint_escrow'), buyerWallet.toBuffer()],
    SQUADS_PROGRAM_ID
  );

  console.log('Creating Squads vault:', vaultPda.toString());

  return {
    vaultPda,
    members: [buyerWallet.toString(), FLINT_TREASURY.toString()],
    threshold: 2, // 2-of-2 multisig
  };
}

/**
 * Create transfer instruction from multisig vault
 */
export async function createTransferFromVault(
  connection: Connection,
  vaultPda: PublicKey,
  fromVault: PublicKey,
  toRecipient: PublicKey,
  amount: number
) {
  const transferIx = createTransferInstruction({
    from: fromVault,
    to: toRecipient,
    amount: BigInt(amount),
  });

  return transferIx;
}

/**
 * Get connection instance
 */
export function getConnection() {
  return new Connection(DEVNET_RPC, 'confirmed');
}
