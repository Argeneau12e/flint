import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { saveInvoice, getInvoice, getInvoiceByHandle } from "@/lib/store";
import { addAuditEntry } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      amount,
      token,
      memo,
      expiryDays,
      recipientWallet,
      handle,
      condition,
      lineItems,
      taxAmount,
      sellerVatId,
      buyerReference,
    } = body;

    if (!title || !amount || !recipientWallet) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (handle) {
      const existing = await getInvoiceByHandle(handle);
      if (existing) {
        return NextResponse.json(
          { error: "Handle already taken. Please choose another." },
          { status: 409 }
        );
      }
    }

    const id = randomUUID();
    const now = Date.now();
    const expiryMs = Number(expiryDays) * 24 * 60 * 60 * 1000;

    const invoice = {
      id,
      title,
      amount: Number(amount),
      token: token || "USDC",
      memo: memo || "",
      recipientWallet,
      createdAt: now,
      expiresAt: now + expiryMs,
      status: "pending",
      handle: handle || undefined,
      condition: condition || undefined,
      lineItems: lineItems || undefined,
      taxAmount: taxAmount ? Number(taxAmount) : undefined,
      sellerVatId: sellerVatId || undefined,
      buyerReference: buyerReference || undefined,
    };

    await saveInvoice(invoice);
    await addAuditEntry(id, "created", `Invoice created for ${invoice.amount} ${invoice.token}`);

    return NextResponse.json({ id, invoice });
  } catch {
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const handle = url.searchParams.get("handle");

  if (handle) {
    const invoice = await getInvoiceByHandle(handle);
    if (!invoice) {
      return NextResponse.json(
        { error: "Handle not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(invoice);
  }

  if (!id) {
    return NextResponse.json(
      { error: "No ID or handle provided" },
      { status: 400 }
    );
  }

  const invoice = await getInvoice(id);

  if (!invoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(invoice);
}