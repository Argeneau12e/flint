import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/escrow/release
 * Release funds to seller (buyer approval or auto-approve)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId } = body;

    console.log('Release API called:', { escrowId });

    if (!escrowId) {
      return NextResponse.json(
        { error: 'Escrow ID required' },
        { status: 400 }
      );
    }

    // Simulate successful release
    // TODO: In production, verify state and transfer tokens

    console.log('✅ Release success:', escrowId);

    return NextResponse.json({
      success: true,
      message: 'Funds released to seller successfully.',
    });
  } catch (error: any) {
    console.error('Release error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
