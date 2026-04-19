import { NextRequest, NextResponse } from "next/server";
import { getInvoicesByWallet } from "@/lib/store";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json(
      { error: "Wallet address required" },
      { status: 400 }
    );
  }

  const invoices = await getInvoicesByWallet(wallet);

  const total = invoices.length;
  const paid = invoices.filter((i) => i.status === "paid").length;
  const pending = invoices.filter((i) => i.status === "pending").length;
  const expired = invoices.filter(
    (i) => i.status !== "paid" && Date.now() > i.expiresAt
  ).length;

  const totalEarned = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);

  const successRate = total > 0 ? Math.round((paid / total) * 100) : 0;

  return NextResponse.json({
    invoices,
    stats: {
      total,
      paid,
      pending,
      expired,
      totalEarned: Math.round(totalEarned * 100) / 100,
      successRate,
    },
  });
}