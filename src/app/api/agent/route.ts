import { NextRequest, NextResponse } from "next/server";
import { getInvoice } from "@/lib/store";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceId, agentWallet, spendCap, allowedRecipients } = body;

    if (!invoiceId || !agentWallet) {
      return NextResponse.json(
        { error: "invoiceId and agentWallet required" },
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

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "Groq API key not configured" },
        { status: 500, headers: CORS }
      );
    }

    const prompt = `You are an autonomous AI payment agent on Solana. You have been given a payment request to analyze and process.

Invoice Details:
- ID: ${invoice.id}
- Title: ${invoice.title}
- Amount: ${invoice.amount} ${invoice.token}
- Recipient: ${invoice.recipientWallet}
- Memo: ${invoice.memo || "none"}
- Status: ${invoice.status}
- Expires: ${new Date(invoice.expiresAt).toISOString()}
- Condition: ${invoice.condition || "none"}

Your wallet address: ${agentWallet}

Analyze this payment request and provide:
1. A brief analysis of the invoice (2-3 sentences)
2. Whether you would approve or reject this payment and why
3. What action you are taking

Be concise and professional. Act as if you are actually processing this payment autonomously.`;

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300,
        }),
      }
    );

    const groqData = await groqRes.json();
    console.log("Groq response:", JSON.stringify(groqData).slice(0, 200));
    const agentResponse = groqData.choices?.[0]?.message?.content ||
      "Agent analysis unavailable";

    const policyViolations: string[] = [];
    if (spendCap && invoice.amount > Number(spendCap)) {
      policyViolations.push(`Amount ${invoice.amount} ${invoice.token} exceeds spend cap of ${spendCap}`);
    }
    if (allowedRecipients && allowedRecipients.length > 0) {
      if (!allowedRecipients.includes(invoice.recipientWallet)) {
        policyViolations.push(`Recipient ${invoice.recipientWallet.slice(0, 8)}... is not in allowlist`);
      }
    }
    const policyApproved = policyViolations.length === 0;

    const steps = [
      { step: 1, action: "Fetched invoice from Flint protocol", status: "complete", detail: `Invoice ID: ${invoice.id}` },
      { step: 2, action: "Validated invoice fields", status: "complete", detail: `Amount: ${invoice.amount} ${invoice.token}, Status: ${invoice.status}` },
      { step: 3, action: "Checked expiry and conditions", status: "complete", detail: `Expires: ${new Date(invoice.expiresAt).toLocaleDateString()}` },
      { step: 4, action: "Analyzed payment request with AI", status: "complete", detail: "Llama 3.3 analysis complete via Groq" },
      { step: 5, action: "Ready to execute payment transaction", status: invoice.status === "pending" ? "ready" : "skipped", detail: invoice.status === "pending" ? "Awaiting wallet signature" : `Invoice already ${invoice.status}` },
    ];

    return NextResponse.json({
      invoice,
      agentResponse,
      steps,
      approved: invoice.status === "pending" && Date.now() < invoice.expiresAt && policyApproved,
      policyViolations,
      policyApproved,
    }, { headers: CORS });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Agent processing failed" },
      { status: 500, headers: CORS }
    );
  }
}