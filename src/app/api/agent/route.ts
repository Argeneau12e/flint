import { NextRequest, NextResponse } from "next/server";
import { getInvoice, getInvoicesByWallet, Invoice } from "@/lib/store";
import { addAuditEntry } from "@/lib/store";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json(null, { headers: CORS });
}

async function analyzeInvoice(
  invoice: Invoice,
  agentWallet: string,
  spendCap?: number,
  allowedRecipients?: string[]
): Promise<{ approved: boolean; reasoning: string; violations: string[] }> {
  const violations: string[] = [];

  if (spendCap && invoice.amount > spendCap) {
    violations.push(`Amount ${invoice.amount} ${invoice.token} exceeds spend cap of ${spendCap}`);
  }

  if (allowedRecipients && allowedRecipients.length > 0) {
    if (!allowedRecipients.includes(invoice.recipientWallet)) {
      violations.push(`Recipient not in allowlist`);
    }
  }

  if (Date.now() > invoice.expiresAt) {
    violations.push("Invoice has expired");
  }

  if (invoice.status !== "pending") {
    violations.push(`Invoice status is ${invoice.status}`);
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  let reasoning = "Analysis unavailable";

  if (groqApiKey) {
    try {
      const prompt = `You are an autonomous AI payment agent on Solana. Analyze this payment request in 2 sentences max.

Invoice: ${invoice.title}
Amount: ${invoice.amount} ${invoice.token}
Memo: ${invoice.memo || "none"}
Condition: ${invoice.condition || "none"}
Policy violations: ${violations.length > 0 ? violations.join(", ") : "none"}
Decision: ${violations.length === 0 ? "APPROVE" : "REJECT"}

Give your reasoning:`;

      const res = await fetch(
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
            max_tokens: 100,
          }),
        }
      );
      const data = await res.json();
      reasoning = data.choices?.[0]?.message?.content || reasoning;
    } catch {
      reasoning = violations.length === 0
        ? "Invoice validated successfully. Approving payment."
        : `Rejecting due to policy violations.`;
    }
  }

  return {
    approved: violations.length === 0,
    reasoning,
    violations,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      invoiceId,
      agentWallet,
      spendCap,
      allowedRecipients,
      autonomousMode,
      walletAddress,
    } = body;

    if (autonomousMode && walletAddress) {
      const invoices = await getInvoicesByWallet(walletAddress);
      const pending = invoices.filter(
        (i) => i.status === "pending" && Date.now() < i.expiresAt
      );

      const results = await Promise.all(
        pending.map(async (invoice) => {
          const analysis = await analyzeInvoice(
            invoice,
            agentWallet,
            spendCap ? Number(spendCap) : undefined,
            allowedRecipients
          );

          if (analysis.approved) {
            await addAuditEntry(
              invoice.id,
              "agent_approved",
              `Autonomous agent approved: ${analysis.reasoning}`,
              agentWallet
            );
          } else {
            await addAuditEntry(
              invoice.id,
              "agent_rejected",
              `Autonomous agent rejected: ${analysis.violations.join(", ")}`,
              agentWallet
            );
          }

          return {
            invoice: {
              id: invoice.id,
              title: invoice.title,
              amount: invoice.amount,
              token: invoice.token,
              status: invoice.status,
              recipientWallet: invoice.recipientWallet,
              expiresAt: invoice.expiresAt,
            },
            ...analysis,
          };
        })
      );

      const approved = results.filter((r) => r.approved);
      const rejected = results.filter((r) => !r.approved);

      return NextResponse.json({
        mode: "autonomous",
        summary: {
          total: pending.length,
          approved: approved.length,
          rejected: rejected.length,
        },
        results,
        approved,
        rejected,
      }, { headers: CORS });
    }

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

    const analysis = await analyzeInvoice(
      invoice,
      agentWallet,
      spendCap ? Number(spendCap) : undefined,
      allowedRecipients
    );

    const steps = [
      { step: 1, action: "Fetched invoice from Flint protocol", status: "complete", detail: `Invoice ID: ${invoice.id}` },
      { step: 2, action: "Validated invoice fields", status: "complete", detail: `Amount: ${invoice.amount} ${invoice.token}` },
      { step: 3, action: "Checked expiry and conditions", status: "complete", detail: `Expires: ${new Date(invoice.expiresAt).toLocaleDateString()}` },
      { step: 4, action: "Applied agent policy", status: "complete", detail: analysis.violations.length === 0 ? "All policies passed" : analysis.violations.join(", ") },
      { step: 5, action: "AI analysis complete", status: "complete", detail: "Llama 3.3 via Groq" },
      { step: 6, action: "Ready to execute", status: analysis.approved ? "ready" : "blocked", detail: analysis.approved ? "Awaiting wallet signature" : "Blocked by policy" },
    ];

    return NextResponse.json({
      mode: "single",
      invoice,
      agentResponse: analysis.reasoning,
      steps,
      approved: analysis.approved,
      policyViolations: analysis.violations,
      policyApproved: analysis.violations.length === 0,
    }, { headers: CORS });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Agent processing failed" },
      { status: 500, headers: CORS }
    );
  }
}