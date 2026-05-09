import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/notifications
 * Fetch notifications for a wallet address
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

    // Fetch notifications for wallet
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('wallet_address', wallet)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Fetch notifications error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error: any) {
    console.error('Notifications error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/notifications/mark-read
 * Mark a notification as read
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificationId, wallet } = body;

    if (!notificationId || !wallet) {
      return NextResponse.json(
        { error: 'Notification ID and wallet required' },
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

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('wallet_address', wallet);

    if (error) {
      console.error('Mark read error:', error);
      return NextResponse.json(
        { error: 'Failed to mark as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Mark read error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
