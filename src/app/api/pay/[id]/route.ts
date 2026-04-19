import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";
import { getInvoice } from "@/lib/store";

const ACTIONS_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "X-Action-Version": "1",
  "X-Blockchain-Ids": "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: ACTIONS_CORS_HEADERS });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404, headers: ACTIONS_CORS_HEADERS }
    );
  }

  if (Date.now() > invoice.expiresAt) {
    return NextResponse.json(
      { error: "Invoice expired" },
      { status: 410, headers: ACTIONS_CORS_HEADERS }
    );
  }

  const payload = {
    icon: `${req.nextUrl.origin}/flint-icon.png`,
    title: invoice.title,
    description: `Pay ${invoice.amount} ${invoice.token}${invoice.memo ? ` · ${invoice.memo}` : ""}`,
    label: `Pay ${invoice.amount} ${invoice.token}`,
    links: {
      actions: [
        {
          label: `Pay ${invoice.amount} ${invoice.token}`,
          href: `${req.nextUrl.origin}/api/pay/${id}`,
        },
      ],
    },
  };

  return NextResponse.json(payload, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404, headers: ACTIONS_CORS_HEADERS }
    );
  }

  if (Date.now() > invoice.expiresAt) {
    return NextResponse.json(
      { error: "Invoice has expired" },
      { status: 410, headers: ACTIONS_CORS_HEADERS }
    );
  }

  try {
    const body = await req.json();
    const senderAddress = body.account;

    if (!senderAddress) {
      return NextResponse.json(
        { error: "No account provided" },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const sender = new PublicKey(senderAddress);
    const recipient = new PublicKey(invoice.recipientWallet);
    const lamports = Math.round(invoice.amount * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: recipient,
        lamports,
      })
    );

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = sender;

    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    const base64 = serialized.toString("base64");

    return NextResponse.json(
      {
        transaction: base64,
        message: `Paying ${invoice.amount} ${invoice.token} for ${invoice.title}`,
      },
      { headers: ACTIONS_CORS_HEADERS }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to build transaction" },
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }
}