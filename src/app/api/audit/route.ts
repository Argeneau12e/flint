import { NextRequest, NextResponse } from "next/server";
import { getAuditLog } from "@/lib/store";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const invoiceId = url.searchParams.get("invoiceId");

  if (!invoiceId) {
    return NextResponse.json(
      { error: "Invoice ID required" },
      { status: 400 }
    );
  }

  const entries = await getAuditLog(invoiceId);
  return NextResponse.json({ entries });
}