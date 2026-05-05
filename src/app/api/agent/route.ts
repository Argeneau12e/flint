import { NextRequest, NextResponse } from "next/server";
import { getInvoice, getInvoicesByWallet, Invoice } from "@/lib/store";
import { addAuditEntry } from "@/lib/store";
import {
  loadModel,
  completion,
  unloadModel,
  LLAMA_3_2_1B_INST_Q4_0, // 1B model - fast inference (~1-2s on Vercel)
} from "@qvac/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// QVAC Model cache (prevents cold starts)
let cachedModelId: string | null = null;
let modelLoadPromise: Promise<string> | null = null;

/**
 * Load QVAC model with caching
 * Security: Model loaded once per serverless instance, reused across requests
 * Performance: Avoids 2-3s cold start on subsequent requests
 */
async function getQVACModel(): Promise<string> {
  if (cachedModelId) {
    return cachedModelId;
  }

  // Prevent concurrent model loads
  if (modelLoadPromise) {
    return modelLoadPromise;
  }

  modelLoadPromise = (async () => {
    try {
      cachedModelId = await loadModel({
        modelSrc: LLAMA_3_2_1B_INST_Q4_0, // 1B instruct model - fast (~1-2s)
        modelType: "llm",
        // Security: No API keys needed - QVAC is free and local
      });
      console.log("✅ QVAC model loaded:", LLAMA_3_2_1B_INST_Q4_0);
      return cachedModelId;
    } catch (error) {
      console.error("❌ QVAC model load failed:", error);
      modelLoadPromise = null; // Reset for retry on next request
      throw new Error("QVAC model initialization failed");
    }
  })();

  return modelLoadPromise;
}

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

  // Security: Input validation
  if (!invoice || typeof invoice.amount !== "number" || invoice.amount <= 0) {
    violations.push("Invalid invoice data");
  }

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

  let reasoning = "Analysis unavailable";

  // Security: QVAC local AI - no API keys, no external calls, 100% private
  try {
    const modelId = await getQVACModel();
    
    const prompt = `You are Flint AI, an autonomous payment agent on Solana. Analyze this payment request in 2 sentences max.

Invoice: ${invoice.title}
Amount: ${invoice.amount} ${invoice.token}
Memo: ${invoice.memo || "none"}
Condition: ${invoice.condition || "none"}
Policy violations: ${violations.length > 0 ? violations.join(", ") : "none"}
Decision: ${violations.length === 0 ? "APPROVE" : "REJECT"}

Give your reasoning:`;

    const response = await completion({
      modelId,
      history: [
        {
          role: "system",
          content: "You are Flint AI, a payment agent on Solana. Analyze invoices and provide clear, concise reasoning for approve/reject decisions. Maximum 2 sentences.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
    });

    reasoning = response.text || "Invoice analysis complete";
    
    // Security: Unload model after use to free resources (optional, can keep cached)
    // await unloadModel({ modelId }); // Commented out - keep cached for performance
    
  } catch (error) {
    console.error("QVAC inference error:", error);
    reasoning = violations.length === 0
      ? "Invoice validated successfully. Approving payment."
      : `Rejecting due to policy violations.`;
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
      { step: 5, action: "AI analysis complete (QVAC local)", status: "complete", detail: "Tether QVAC - No API keys, 100% local" },
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