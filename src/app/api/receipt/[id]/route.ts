import { NextRequest, NextResponse } from "next/server";
import { getInvoice, updateInvoiceStatus, addAuditEntry } from "@/lib/store";
import { triggerWebhook } from "@/lib/webhook";


const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: CORS });
}

export async function GET(
  _req: NextRequest,
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

  if (invoice.status !== "paid") {
    return NextResponse.json(
      { error: "Invoice not yet paid" },
      { status: 402, headers: CORS }
    );
  }

  const receipt = {
    "@context": "https://flint-rust.vercel.app/api/schema",
    "@type": "PaymentReceipt",
    id: invoice.id,
    title: invoice.title,
    amount: invoice.amount,
    token: invoice.token,
    memo: invoice.memo,
    recipientWallet: invoice.recipientWallet,
    payerWallet: invoice.payerWallet,
    txSignature: invoice.txSignature,
    paidAt: invoice.paidAt,
    createdAt: invoice.createdAt,
    status: "paid",
    network: "solana-devnet",
    explorerUrl: `https://explorer.solana.com/tx/${invoice.txSignature}?cluster=devnet`,
    verifiable: true,
  };

  return NextResponse.json(receipt, { headers: CORS });
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
      { status: 404, headers: CORS }
    );
  }

  try {
    const body = await req.json();
    const { txSignature, payerWallet } = body;

    if (!txSignature) {
      return NextResponse.json(
        { error: "Transaction signature required" },
        { status: 400, headers: CORS }
      );
    }

    await updateInvoiceStatus(id, "paid", txSignature, payerWallet);

    const updatedInvoice = await getInvoice(id);
    if (updatedInvoice) {
      await triggerWebhook(updatedInvoice);
    }
    await addAuditEntry(id, "paid", `Payment received — tx: ${txSignature}`, payerWallet);

    const receipt = {
      "@context": "https://flint-rust.vercel.app/api/schema",
      "@type": "PaymentReceipt",
      id: invoice.id,
      title: invoice.title,
      amount: invoice.amount,
      token: invoice.token,
      memo: invoice.memo,
      recipientWallet: invoice.recipientWallet,
      payerWallet: payerWallet,
      txSignature: txSignature,
      paidAt: updatedInvoice?.paidAt,
      createdAt: invoice.createdAt,
      status: "paid",
      network: "solana-devnet",
      explorerUrl: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
      verifiable: true,
    };

    return NextResponse.json(receipt, { headers: CORS });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate receipt" },
      { status: 500, headers: CORS }
    );
  }
}