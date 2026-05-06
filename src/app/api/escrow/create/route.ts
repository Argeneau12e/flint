import { NextRequest, NextResponse } from 'next/server';
import { calculateFee, calculateTotal, isFirstInvoice, applyFirstInvoiceFree } from '@/lib/escrow/utils';
import { EscrowState, SUPPORTED_TOKENS, FEE_TIERS, ESCROW_TIMEOUTS } from '@/lib/escrow/types';

/**
 * POST /api/escrow/create
 * Create a new escrow invoice
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      creator, // Seller wallet
      recipient, // Buyer wallet
      amount, // In token units (not including fee)
      token, // SOL, USDC, or USDT
      title,
      description,
      feeTier = 'FREE',
    } = body;

    // Validation
    if (!creator || !recipient) {
      return NextResponse.json(
        { error: 'Creator and recipient wallets are required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (!token || !SUPPORTED_TOKENS[token as keyof typeof SUPPORTED_TOKENS]) {
      return NextResponse.json(
        { error: 'Invalid token. Supported: SOL, USDC, USDT' },
        { status: 400 }
      );
    }

    // Calculate fees
    const feeInfo = calculateFee(amount, feeTier as keyof typeof FEE_TIERS);
    const totalInfo = calculateTotal(amount, feeTier as keyof typeof FEE_TIERS);

    // Check if first invoice (fee waiver)
    const firstInvoice = await isFirstInvoice(creator);
    const firstInvoiceDiscount = applyFirstInvoiceFree(feeInfo.fee, firstInvoice);

    // Generate unique escrow ID
    const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate deadlines
    const now = Math.floor(Date.now() / 1000);
    const acceptanceDeadline = now + ESCROW_TIMEOUTS.ACCEPTANCE_TIMEOUT; // 7 days
    const fundingDeadline = now + ESCROW_TIMEOUTS.FUNDING_TIMEOUT; // 3 days
    const reviewDeadline = now + ESCROW_TIMEOUTS.REVIEW_TIMEOUT; // 7 days

    // Create escrow record (to be stored in Supabase/on-chain)
    const escrowData = {
      id: escrowId,
      version: 1,
      creator,
      recipient,
      amount,
      tokenMint: SUPPORTED_TOKENS[token as keyof typeof SUPPORTED_TOKENS].mint,
      tokenSymbol: token,
      feeAmount: firstInvoiceDiscount.finalFee,
      feeOriginal: firstInvoiceDiscount.originalFee,
      feeDiscount: firstInvoiceDiscount.discount,
      isFirstInvoice: firstInvoice,
      feeTier,
      totalAmount: amount + firstInvoiceDiscount.finalFee,
      state: EscrowState.DRAFT,
      title,
      description,
      createdAt: now,
      acceptanceDeadline,
      fundingDeadline,
      reviewDeadline,
      aiAnalysis: null,
      dispute: null,
    };

    // TODO: Save to Supabase
    // TODO: Create on-chain PDA (Anchor program)

    return NextResponse.json({
      success: true,
      escrow: escrowData,
      feeBreakdown: {
        amount,
        fee: firstInvoiceDiscount.finalFee,
        originalFee: firstInvoiceDiscount.originalFee,
        discount: firstInvoiceDiscount.discount,
        total: escrowData.totalAmount,
        isFirstInvoice: firstInvoice,
        tier: feeTier,
      },
      deadlines: {
        acceptance: new Date(acceptanceDeadline * 1000).toISOString(),
        funding: new Date(fundingDeadline * 1000).toISOString(),
        review: new Date(reviewDeadline * 1000).toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Escrow create error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create escrow' },
      { status: 500 }
    );
  }
}
