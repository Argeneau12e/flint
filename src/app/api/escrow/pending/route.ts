import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/escrow/pending
 * Fetch funded escrows where user is the seller
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch escrows where user is seller and state is funded_active or work_delivered
    const { data: escrows, error } = await supabase
      .from('escrows')
      .select('*')
      .eq('creator_wallet', wallet)
      .in('state', ['funded_active', 'work_delivered'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch pending work error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending work' },
        { status: 500 }
      );
    }

    return NextResponse.json({ escrows: escrows || [] });
  } catch (error: any) {
    console.error('Pending work error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
