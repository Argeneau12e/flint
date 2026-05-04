import { NextRequest, NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { Invoice } from "@/lib/store";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const signature = url.searchParams.get("signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Transaction signature required" },
      { status: 400 }
    );
  }

  try {
    const keys = await kv.keys("invoice:*");
    for (const key of keys) {
      const invoice = await kv.get<Invoice>(key);
      if (invoice && invoice.txSignature === signature) {
        return NextResponse.json({
          id: invoice.id,
          title: invoice.title,
          amount: invoice.amount,
          token: invoice.token,
          memo: invoice.memo,
          recipientWallet: invoice.recipientWallet,
          payerWallet: invoice.payerWallet,
          txSignature: invoice.txSignature,
          paidAt: invoice.paidAt,
          network: "solana-devnet",
          explorerUrl: `https://explorer.solana.com/tx/${invoice.txSignature}?cluster=devnet`,
          verified: true,
        });
      }
    }

    return NextResponse.json(
      { error: "Receipt not found for this signature" },
      { status: 404 }
    );
  } catch {
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}