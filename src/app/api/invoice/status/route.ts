import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getInvoice, updateInvoiceStatus, addAuditEntry } from "@/lib/store";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });
  }

  const invoice = await getInvoice(id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "paid") {
    return NextResponse.json({ status: "paid", invoice });
  }

  if (Date.now() > invoice.expiresAt) {
    return NextResponse.json({ status: "expired", invoice });
  }

  try {
    const connection = new Connection(
      "https://api.devnet.solana.com",
      {
        commitment: "confirmed",
        httpHeaders: { "Content-Type": "application/json" },
        disableRetryOnRateLimit: true,
      }
    );
    const recipient = new PublicKey(invoice.recipientWallet);
    const expectedLamports = Math.round(invoice.amount * LAMPORTS_PER_SOL);

    const signatures = await connection.getSignaturesForAddress(recipient, { limit: 10 });

    for (const sigInfo of signatures) {
      if (sigInfo.err) continue;

      const tx = await connection.getTransaction(sigInfo.signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) continue;

      const accountKeys = tx.transaction.message.staticAccountKeys ||
        tx.transaction.message.getAccountKeys?.()?.staticAccountKeys || [];

      const recipientIndex = accountKeys.findIndex(
        (key: PublicKey) => key.toString() === invoice.recipientWallet
      );

      if (recipientIndex === -1) continue;

      const preBalance = tx.meta?.preBalances?.[recipientIndex] || 0;
      const postBalance = tx.meta?.postBalances?.[recipientIndex] || 0;
      const received = postBalance - preBalance;

      if (received >= expectedLamports * 0.99) {
        const senderIndex = recipientIndex === 0 ? 1 : 0;
        const senderKey = accountKeys[senderIndex];
        const payerWallet = senderKey?.toString() || "unknown";

        await updateInvoiceStatus(id, "paid", sigInfo.signature, payerWallet);
        await addAuditEntry(
          id,
          "paid",
          `Payment detected on-chain · tx: ${sigInfo.signature}`,
          payerWallet
        );

        const updated = await getInvoice(id);
        return NextResponse.json({ status: "paid", invoice: updated });
      }
    }

    return NextResponse.json({ status: "pending", invoice });
  } catch (err) {
    console.error("Status check error:", err);
    return NextResponse.json({ status: invoice.status, invoice });
  }
}