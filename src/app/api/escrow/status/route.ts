import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/escrow/status?id=xxx
 * Get escrow invoice status
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Escrow ID required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: escrow, error } = await supabase
      .from('escrows')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !escrow) {
      console.error('Escrow lookup error:', error);
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
    }

    // Map to escrow structure (using new schema field names)
    const escrowData = {
      id: escrow.id,
      title: escrow.title || 'Invoice',
      amount: Number(escrow.amount) || 0,
      token: escrow.token_symbol || 'USDC',
      description: escrow.description || '',
      creator: escrow.creator_wallet || '',
      recipient: escrow.buyer_wallet || '',
      status: escrow.state || 'draft',
      state: escrow.state || 'draft',
      feeAmount: Number(escrow.fee_amount) || 0,
      totalAmount: Number(escrow.total_amount) || Number(escrow.amount) || 0,
      createdAt: escrow.created_at ? new Date(escrow.created_at).getTime() : Date.now(),
      acceptanceDeadline: escrow.acceptance_deadline ? new Date(escrow.acceptance_deadline).getTime() : 0,
      fundingDeadline: escrow.funding_deadline ? new Date(escrow.funding_deadline).getTime() : 0,
      reviewDeadline: escrow.review_deadline ? new Date(escrow.review_deadline).getTime() : 0,
      version: escrow.version || 1,
    };

    return NextResponse.json({
      escrow: escrowData,
      status: escrowData.status,
    });
  } catch (error: any) {
    console.error('Escrow status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
