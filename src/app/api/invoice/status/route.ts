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
        // Invoice not found in Supabase - might be old KV-based invoice
        // Return a basic structure so the page doesn't break
        return NextResponse.json({
          invoice: {
            id,
            title: 'Invoice',
            amount: 0,
            token: 'USDC',
            status: 'not_found',
            createdAt: Date.now(),
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
          },
          status: 'not_found',
        });
      }

      return NextResponse.json({
        invoice,
        status: invoice.status || 'draft',
      });
    }

    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  } catch (error: any) {
    console.error('Invoice status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
