import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/invoice/comments?invoiceId=xxx
 * POST /api/invoice/comments
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const invoiceId = searchParams.get('invoiceId');

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    // Return mock comments for demo
    // TODO: Connect to Supabase comments table
    return NextResponse.json({
      comments: [
        {
          id: '1',
          invoiceId,
          author: 'Creator',
          text: 'Invoice created. Ready for acceptance.',
          createdAt: Date.now() - 1000000,
        },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceId, author, authorWallet, text } = body;

    if (!invoiceId || !text) {
      return NextResponse.json(
        { error: 'Invoice ID and text required' },
        { status: 400 }
      );
    }

    // TODO: Save to Supabase comments table
    // For now, return success

    return NextResponse.json({
      success: true,
      comment: {
        id: `comment_${Date.now()}`,
        invoiceId,
        author: author || 'Anonymous',
        authorWallet,
        text,
        createdAt: Date.now(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
