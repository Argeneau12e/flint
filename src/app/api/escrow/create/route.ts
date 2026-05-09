import { NextRequest, NextResponse } from 'next/server';
import { calculateFee, calculateTotal, isFirstInvoice, applyFirstInvoiceFree } from '@/lib/escrow/utils';
import { EscrowState, SUPPORTED_TOKENS, FEE_TIERS, ESCROW_DEADLINES } from '@/lib/escrow/types';
import { getDeadlineForState } from '@/lib/escrow/state-machine';
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
      clientEmail, // Client's email (for notifications)
      amount, // In token units (what client pays)
      token, // SOL, USDC, or USDT
      title,
      description,
      condition, // Service conditions (required)
      feeTier = 'FREE',
      deliveryDays = 7, // How long seller has to deliver
      linkExpiryDays = 3, // How long link is valid
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

    if (!clientEmail || typeof clientEmail !== 'string' || !clientEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Valid client email is required' },
        { status: 400 }
      );
    }

    if (!condition || typeof condition !== 'string' || condition.trim().length < 10) {
      return NextResponse.json(
        { error: 'Service conditions are required (minimum 10 characters)' },
        { status: 400 }
      );
    }

    if (!token || !SUPPORTED_TOKENS[token as keyof typeof SUPPORTED_TOKENS]) {
      return NextResponse.json(
        { error: 'Invalid token. Supported: SOL, USDC, USDT' },
        { status: 400 }
      );
    }

    // Calculate fees (Bob pays fee, NOT added to Alice's payment)
    const feeInfo = calculateFee(amount, feeTier as keyof typeof FEE_TIERS);
    const firstInvoice = await isFirstInvoice(creator);
    const firstInvoiceDiscount = applyFirstInvoiceFree(feeInfo.fee, firstInvoice);

    // REAL Flint Flow: Alice pays exact amount, fee is deducted from Bob's payout
    const totalAmount = Number(amount); // Alice pays this exact amount

    // Calculate deadlines (REAL flow)
    const now = Date.now();
    const linkExpiresAt = now + (linkExpiryDays * 24 * 60 * 60 * 1000); // 3 days default
    const deliveryDeadline = now + (deliveryDays * 24 * 60 * 60 * 1000); // 7 days default
    const reviewDeadline = deliveryDeadline + ESCROW_DEADLINES.REVIEW; // 7 days after delivery

    // Create escrow record
    const escrowData = {
      id: '',
      version: 1,
      creator,
      aliceWhatsapp: aliceWhatsappNum,
      amount: totalAmount,
      tokenMint: SUPPORTED_TOKENS[token as keyof typeof SUPPORTED_TOKENS].mint,
      tokenSymbol: token,
      feeAmount: firstInvoiceDiscount.finalFee, // Bob's fee
      feeOriginal: firstInvoiceDiscount.originalFee,
      feeDiscount: firstInvoiceDiscount.discount,
      isFirstInvoice: firstInvoice,
      feeTier,
      totalAmount, // Alice pays this (no fee added)
      state: EscrowState.DRAFT,
      title,
      description,
      createdAt: now,
      linkExpiresAt,
      deliveryDeadline,
      reviewDeadline,
      aiAnalysis: null,
      dispute: null,
    };

    // Save to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Creating escrow:', { creator, amount, token, title, hasSupabase: !!(supabaseUrl && supabaseServiceKey) });
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Insert into escrows table with full schema
      // Note: Don't pass id - let PostgreSQL generate UUID
      const { data: insertResult, error: escrowError } = await supabase
        .from('escrows')
        .insert([{
          creator_wallet: creator,
          buyer_wallet: '', // Unknown until client funds
          client_email: clientEmail,
          amount: totalAmount,
          token_mint: SUPPORTED_TOKENS[token as keyof typeof SUPPORTED_TOKENS].mint,
          token_symbol: token,
          fee_amount: firstInvoiceDiscount.finalFee,
          fee_original: firstInvoiceDiscount.originalFee,
          fee_discount: firstInvoiceDiscount.discount,
          fee_tier: feeTier,
          total_amount: totalAmount,
          state: EscrowState.DRAFT,
          title,
          description,
          condition,
          link_expires_at: new Date(linkExpiresAt).toISOString(),
          delivery_deadline: deliveryDeadline,
          review_deadline: reviewDeadline,
          is_first_invoice: firstInvoice,
          created_at: new Date().toISOString(),
        }])
        .select('id');
      
      if (escrowError) {
        console.error('Supabase insert error:', escrowError);
        return NextResponse.json(
          { error: 'Database error: ' + escrowError.message, details: escrowError },
          { status: 500 }
        );
      } else {
        console.log('Escrow saved to Supabase successfully');
        // Get the auto-generated UUID from the insert result
        const generatedId = insertResult?.[0]?.id || '';
        escrowData.id = generatedId;
      }
    } else {
      console.warn('Supabase not configured - escrow created in memory only');
    }

    return NextResponse.json({
      success: true,
      escrow: escrowData,
      id: escrowData.id, // Use the generated/saved ID
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
        linkExpires: new Date(linkExpiresAt).toISOString(),
        delivery: new Date(deliveryDeadline).toISOString(),
        review: new Date(reviewDeadline).toISOString(),
      },
      note: 'REAL Flint Flow: Alice pays exact amount. Fee is deducted from Bob\'s payout.',
    });
  } catch (error: any) {
    console.error('Escrow create error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create escrow' },
      { status: 500 }
    );
  }
}
