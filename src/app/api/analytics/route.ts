import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { Invoice } from "@/lib/store";

export async function GET() {
  try {
    const keys = await kv.keys("invoice:*");
    const invoices: Invoice[] = [];

    for (const key of keys) {
      const invoice = await kv.get<Invoice>(key);
      if (invoice) invoices.push(invoice);
    }

    const total = invoices.length;
    const paid = invoices.filter((i) => i.status === "paid").length;
    const pending = invoices.filter(
      (i) => i.status === "pending" && Date.now() < i.expiresAt
    ).length;
    const expired = invoices.filter(
      (i) => i.status !== "paid" && Date.now() > i.expiresAt
    ).length;

    const totalVolume = invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.amount, 0);

    const solVolume = invoices
      .filter((i) => i.status === "paid" && i.token === "SOL")
      .reduce((sum, i) => sum + i.amount, 0);

    const usdcVolume = invoices
      .filter((i) => i.status === "paid" && i.token === "USDC")
      .reduce((sum, i) => sum + i.amount, 0);

    const successRate = total > 0 ? Math.round((paid / total) * 100) : 0;

    const withHandles = invoices.filter((i) => i.handle).length;
    const withConditions = invoices.filter((i) => i.condition).length;
    const withSplits = invoices.filter((i) => i.splits && i.splits.length > 0).length;
    const withRecurring = invoices.filter((i) => i.recurring).length;

    const recentPaid = invoices
      .filter((i) => i.status === "paid")
      .sort((a, b) => (b.paidAt || 0) - (a.paidAt || 0))
      .slice(0, 5)
      .map((i) => ({
        title: i.title,
        amount: i.amount,
        token: i.token,
        paidAt: i.paidAt,
      }));

    return NextResponse.json({
      invoices: { total, paid, pending, expired },
      volume: {
        total: Math.round(totalVolume * 10000) / 10000,
        sol: Math.round(solVolume * 10000) / 10000,
        usdc: Math.round(usdcVolume * 10000) / 10000,
      },
      successRate,
      features: {
        withHandles,
        withConditions,
        withSplits,
        withRecurring,
      },
      recentPaid,
      protocol: "FRS-1",
      network: "solana-devnet",
      lastUpdated: Date.now(),
    });
  } catch {
    return NextResponse.json(
      { error: "Analytics unavailable" },
      { status: 500 }
    );
  }
}