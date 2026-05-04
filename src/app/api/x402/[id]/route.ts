import { NextRequest, NextResponse } from "next/server";
import { getInvoice } from "@/lib/store";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Payment",
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: CORS });
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
      { status: 404, headers: CORS }
    );
  }

  if (invoice.status === "paid") {
    return NextResponse.json(
      { status: "paid", invoiceId: id },
      { status: 200, headers: CORS }
    );
  }

  if (Date.now() > invoice.expiresAt) {
    return NextResponse.json(
      { error: "Invoice expired" },
      { status: 410, headers: CORS }
    );
  }

  const paymentRequired = {
    version: "0.2",
    accepts: [
      {
        scheme: "solana",
        network: "devnet",
        maxAmountRequired: String(Math.round(invoice.amount * 1e9)),
        resource: `${req.nextUrl.origin}/api/pay/${id}`,
        description: invoice.title,
        mimeType: "application/json",
        payToAddress: invoice.recipientWallet,
        requiredDecimals: 9,
        extra: {
          flintInvoiceId: invoice.id,
          flintSchema: `${req.nextUrl.origin}/api/schema`,
          flintSpec: `${req.nextUrl.origin}/spec`,
          memo: invoice.memo,
          token: invoice.token,
          condition: invoice.condition,
        },
      },
    ],
  };

  return NextResponse.json(paymentRequired, {
    status: 402,
    headers: {
      ...CORS,
      "X-Payment-Required": "true",
      "X-Flint-Invoice": id,
      "X-Flint-Amount": String(invoice.amount),
      "X-Flint-Token": invoice.token,
    },
  });
}