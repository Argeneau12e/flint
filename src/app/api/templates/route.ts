import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { saveTemplate, getTemplatesByWallet, deleteTemplate } from "@/lib/store";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json(
      { error: "Wallet address required" },
      { status: 400 }
    );
  }

  const templates = await getTemplatesByWallet(wallet);
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, title, amount, token, memo, expiryDays, walletAddress } = body;

    if (!name || !title || !amount || !walletAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const template = {
      id: randomUUID(),
      name,
      title,
      amount: Number(amount),
      token: token || "USDC",
      memo: memo || "",
      expiryDays: Number(expiryDays) || 7,
      createdAt: Date.now(),
      walletAddress,
    };

    await saveTemplate(template);
    return NextResponse.json({ template });
  } catch {
    return NextResponse.json(
      { error: "Failed to save template" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Template ID required" },
      { status: 400 }
    );
  }

  await deleteTemplate(id);
  return NextResponse.json({ success: true });
}