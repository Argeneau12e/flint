import { NextRequest, NextResponse } from 'next/server';
import { calculateFee, calculateTotal, isFirstInvoice, applyFirstInvoiceFree } from '@/lib/escrow/utils';
import { EscrowState, SUPPORTED_TOKENS, FEE_TIERS, ESCROW_TIMEOUTS } from '@/lib/escrow/types';
import { createClient } from '@supabase/supabase-js';

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
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator (seller) wallet is required' },
        { status: 400 }
      );
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Recipient (buyer) is optional at creation - will be set when buyer accepts
    const buyerWallet = recipient || '';

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

    // Calculate deadlines (in milliseconds for frontend compatibility)
    const now = Date.now();
    const acceptanceDeadline = now + (ESCROW_TIMEOUTS.ACCEPTANCE_TIMEOUT * 1000); // 7 days in ms
    const fundingDeadline = now + (ESCROW_TIMEOUTS.FUNDING_TIMEOUT * 1000); // 3 days in ms
    const reviewDeadline = now + (ESCROW_TIMEOUTS.REVIEW_TIMEOUT * 1000); // 7 days in ms

    // Create escrow record (to be stored in Supabase/on-chain)
    const escrowData = {
      id: escrowId,
      version: 1,
      creator,
      recipient: buyerWallet,
      amount: Number(amount),
      tokenMint: SUPPORTED_TOKENS[token as keyof typeof SUPPORTED_TOKENS].mint,
      tokenSymbol: token,
      feeAmount: firstInvoiceDiscount.finalFee,
      feeOriginal: firstInvoiceDiscount.originalFee,
      feeDiscount: firstInvoiceDiscount.discount,
      isFirstInvoice: firstInvoice,
      feeTier,
      totalAmount: Number(amount) + firstInvoiceDiscount.finalFee,
      state: EscrowState.PENDING_ACCEPTANCE,
      title,
      description,
      createdAt: now,
      acceptanceDeadline,
      fundingDeadline,
      reviewDeadline,
      aiAnalysis: null,
      dispute: null,
    };

    // Save to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Creating escrow:', { escrowId, creator, amount, token, title, hasSupabase: !!(supabaseUrl && supabaseServiceKey) });
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Insert into invoices table - MINIMAL columns only
      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          id: escrowId,
          creator_user_id: null,
          recipient_wallet: buyerWallet,
          amount: Number(amount),
          token: token,
          title: title || 'Invoice',
          description: description || '',
          status: 'pending_acceptance',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
      
      if (invoiceError) {
        console.error('Supabase insert error:', invoiceError);
        // Return error so user knows
        return NextResponse.json(
          { error: 'Database error: ' + invoiceError.message, details: invoiceError },
          { status: 500 }
        );
      } else {
        console.log('Escrow saved to Supabase successfully');
      }
    } else {
      console.warn('Supabase not configured - escrow created in memory only');
    }

    return NextResponse.json({
      success: true,
      escrow: escrowData,
      id: escrowId, // Add id field for backward compatibility
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
        acceptance: new Date(acceptanceDeadline).toISOString(),
        funding: new Date(fundingDeadline).toISOString(),
        review: new Date(reviewDeadline).toISOString(),
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
