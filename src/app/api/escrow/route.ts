import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  Keypair,
} from "@solana/web3.js";
import { getInvoice, saveInvoice, addAuditEntry } from "@/lib/store";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: CORS });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const invoiceId = url.searchParams.get("invoiceId");

  if (!invoiceId) {
    return NextResponse.json(
      { error: "Invoice ID required" },
      { status: 400, headers: CORS }
    );
  }

  const invoice = await getInvoice(invoiceId);
  if (!invoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404, headers: CORS }
    );
  }

  return NextResponse.json({
    invoiceId,
    escrowStatus: invoice.escrowAddress ? "funded" : "unfunded",
    escrowAddress: invoice.escrowAddress || null,
    condition: invoice.condition || null,
    amount: invoice.amount,
    token: invoice.token,
    canRelease: !!invoice.escrowAddress && invoice.status !== "paid",
  }, { headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceId, payerAddress, action } = body;

    if (!invoiceId || !payerAddress) {
      return NextResponse.json(
        { error: "invoiceId and payerAddress required" },
        { status: 400, headers: CORS }
      );
    }

    const invoice = await getInvoice(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404, headers: CORS }
      );
    }

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const payer = new PublicKey(payerAddress);
    const recipient = new PublicKey(invoice.recipientWallet);
    const lamports = Math.round(invoice.amount * LAMPORTS_PER_SOL);

    if (action === "fund") {
      const escrowKeypair = Keypair.generate();
      const escrowAddress = escrowKeypair.publicKey.toString();

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: escrowKeypair.publicKey,
          lamports,
        })
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = payer;

      const base64 = transaction
        .serialize({ requireAllSignatures: false, verifySignatures: false })
        .toString("base64");

      invoice.escrowAddress = escrowAddress;
      invoice.status = "escrowed";
      await saveInvoice(invoice);
      await addAuditEntry(invoiceId, "escrowed", `Funds held in escrow at ${escrowAddress}`, payerAddress);

      return NextResponse.json({
        transaction: base64,
        escrowAddress,
        message: "Funds will be held in escrow until condition is met",
      }, { headers: CORS });
    }

    if (action === "release") {
      if (!invoice.escrowAddress) {
        return NextResponse.json(
          { error: "No escrow to release" },
          { status: 400, headers: CORS }
        );
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: recipient,
          lamports,
        })
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = payer;

      const base64 = transaction
        .serialize({ requireAllSignatures: false, verifySignatures: false })
        .toString("base64");

      await addAuditEntry(invoiceId, "released", `Escrow released to ${invoice.recipientWallet}`, payerAddress);

      return NextResponse.json({
        transaction: base64,
        message: "Escrow released to recipient",
      }, { headers: CORS });
    }

    return NextResponse.json(
      { error: "Invalid action. Use fund or release" },
      { status: 400, headers: CORS }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Escrow operation failed" },
      { status: 500, headers: CORS }
    );
  }
}