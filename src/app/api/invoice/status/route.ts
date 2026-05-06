import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/invoice/status?id=xxx
 * Get invoice/escrow status
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    // Try to get from Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !invoice) {
        // Invoice not found in Supabase - return empty but valid structure
        return NextResponse.json({
          invoice: {
            id,
            title: '',
            amount: 0,
            token: 'USDC',
            memo: '',
            recipientWallet: '',
            createdAt: Date.now(),
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            status: 'not_found',
            condition: '',
            escrowAddress: '',
            webhookUrl: '',
            txSignature: '',
            payerWallet: '',
            paidAt: 0,
          },
          status: 'not_found',
        });
      }

      // Map Supabase fields to expected invoice structure
      const mappedInvoice = {
        id: invoice.id || id,
        title: invoice.title || 'Invoice',
        amount: Number(invoice.amount) || 0,
        token: invoice.token || 'USDC',
        memo: invoice.memo || invoice.description || '',
        recipientWallet: invoice.recipient_wallet || invoice.recipient || '',
        createdAt: invoice.created_at ? new Date(invoice.created_at).getTime() : Date.now(),
        expiresAt: invoice.expires_at ? new Date(invoice.expires_at).getTime() : (Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: invoice.status || 'draft',
        condition: invoice.condition || '',
        escrowAddress: invoice.escrow_address || '',
        webhookUrl: invoice.webhook_url || '',
        txSignature: invoice.tx_signature || '',
        payerWallet: invoice.payer_wallet || '',
        paidAt: invoice.paid_at ? new Date(invoice.paid_at).getTime() : 0,
      };

      return NextResponse.json({
        invoice: mappedInvoice,
        status: mappedInvoice.status,
      });
    }

    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  } catch (error: any) {
    console.error('Invoice status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
