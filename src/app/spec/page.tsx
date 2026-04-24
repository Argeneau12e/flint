"use client";

import { useRouter } from "next/navigation";

export default function SpecPage() {
  const router = useRouter();

  const endpoints = [
    { method: "GET", path: "/api/schema", desc: "Full JSON-LD schema" },
    { method: "POST", path: "/api/invoice/create", desc: "Create payment request" },
    { method: "GET", path: "/api/invoice/create?id={id}", desc: "Fetch by ID" },
    { method: "GET", path: "/api/invoice/create?handle={handle}", desc: "Fetch by handle" },
    { method: "GET", path: "/api/pay/{id}", desc: "Actions metadata" },
    { method: "POST", path: "/api/pay/{id}", desc: "Build transaction" },
    { method: "GET", path: "/api/receipt/{id}", desc: "Get receipt JSON" },
    { method: "POST", path: "/api/receipt/{id}", desc: "Record payment" },
    { method: "GET", path: "/api/verify?signature={sig}", desc: "Verify by tx signature" },
    { method: "GET", path: "/api/x402/{id}", desc: "x402 payment required response" },
    { method: "GET", path: "/api/ubl?id={id}", desc: "UBL 2.1 XML export" },
    { method: "POST", path: "/api/escrow", desc: "Fund or release escrow" },
    { method: "POST", path: "/api/agent", desc: "AI agent analysis and execution" },
  ];

  const normative = [
    { keyword: "MUST", color: "#ff6b6b", rules: [
      "A Flint Request MUST contain id, title, amount, token, recipientWallet, expiresAt, and status.",
      "A Flint Request MUST be identified by a globally unique UUID v4.",
      "The status field MUST be one of: pending, paid, expired, cancelled.",
      "A Flint Request MUST NOT be modified after status transitions to paid.",
      "Implementations MUST reject requests where expiresAt is in the past.",
      "Transaction signatures MUST be recorded in txSignature upon payment confirmation.",
      "Split percentages MUST sum to exactly 100 when splits array is present.",
    ]},
    { keyword: "SHOULD", color: "#FFB800", rules: [
      "Implementations SHOULD provide a public receipt endpoint at /api/receipt/{id}.",
      "Implementations SHOULD support webhook delivery on payment confirmation.",
      "Implementations SHOULD maintain an audit log for all status transitions.",
      "Handles SHOULD be globally unique within an implementation.",
      "Implementations SHOULD expose a JSON-LD schema at /api/schema.",
      "Agent instructions SHOULD be included in the JSON-LD schema.",
      "UBL export SHOULD map all available fields to UBL 2.1 Invoice elements.",
    ]},
    { keyword: "MAY", color: "#4ade80", rules: [
      "Implementations MAY support conditional payments via the condition field.",
      "Implementations MAY support escrow via program-derived addresses.",
      "Implementations MAY support recurring payments via recurringInterval.",
      "Implementations MAY support split payments via the splits array.",
      "Implementations MAY expose x402-compatible endpoints for agentic flows.",
    ]},
  ];

  const steps = [
    "Fetch invoice JSON from GET /api/invoice/create?id={id}",
    "MUST validate expiresAt is in the future — reject if expired",
    "MUST validate status is pending — reject if already paid",
    "SHOULD check condition field and verify it is met",
    "Call POST /api/pay/{id} with agent wallet public key as account",
    "Sign and send the returned base64 transaction",
    "Confirm transaction on Solana",
    "POST to /api/receipt/{id} with txSignature and payerWallet",
    "MUST verify txSignature is stored on the invoice receipt",
  ];

  return (
    <main className="min-h-screen px-6 py-16 max-w-3xl mx-auto">

      <div className="mb-16">
        <button onClick={() => router.push("/")}
          style={{ color: "var(--spark)", fontSize: "14px", background: "none", border: "none", cursor: "pointer" }}>
          Back to Flint
        </button>
        <div className="flex items-center gap-3 mt-6 mb-4">
          <div className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: "#1a1a0a", color: "#FF6B2B", border: "1px solid #FF6B2B" }}>
            FRS-1
          </div>
          <p className="text-xs" style={{ color: "#555555" }}>
            Flint Request Standard · Version 1.0.0
          </p>
        </div>
        <h1 className="text-4xl font-medium tracking-wide mb-4"
          style={{ color: "var(--chalk)" }}>
          Flint Request Standard
        </h1>
        <p className="text-lg" style={{ color: "#888888" }}>
          An open payment request protocol for Solana.
          Human-shareable. Agent-executable.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>Abstract</h2>
        <p style={{ color: "#aaaaaa", lineHeight: "1.8" }}>
          The Flint Request Standard (FRS-1) defines a structured, machine-readable
          payment request object for the Solana blockchain. A Flint Request encodes
          all information necessary for both humans and autonomous agents to discover,
          validate, and settle a payment using Solana Actions as transport and
          Solana Blinks as the shareable interface layer.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>Motivation</h2>
        <p style={{ color: "#aaaaaa", lineHeight: "1.8" }}>
          Solana Pay defines how to transfer value. Solana Actions define how to
          present signable transactions. Neither defines how to request payment
          with a fixed amount, expiry, conditions, and verifiable receipt.
          FRS-1 fills this gap. It is the missing invoice layer between Solana
          settlement speed and real-world commercial use.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>Normative Requirements</h2>
        <p className="text-sm mb-6" style={{ color: "#888888" }}>
          The key words MUST, MUST NOT, SHOULD, and MAY are used as defined in RFC 2119.
        </p>
        {normative.map((section) => (
          <div key={section.keyword} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: `${section.color}22`, color: section.color, border: `1px solid ${section.color}44` }}>
                {section.keyword}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {section.rules.map((rule, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}>
                  <span className="text-xs font-medium flex-shrink-0 mt-0.5"
                    style={{ color: section.color }}>
                    {section.keyword}
                  </span>
                  <p className="text-sm" style={{ color: "#aaaaaa" }}>{rule}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>The Flint Request Object</h2>
        <div className="rounded-xl p-6" style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}>
          <pre className="text-sm overflow-x-auto" style={{ color: "#aaaaaa", lineHeight: "1.8" }}>
{`{
  // Required
  "id": "uuid-v4",
  "title": "string",
  "amount": "number",
  "token": "SOL | USDC | SPL mint",
  "recipientWallet": "base58 address",
  "expiresAt": "unix timestamp",
  "status": "pending | paid | expired | cancelled",

  // Optional — B2B/PEPPOL
  "lineItems": [{ description, quantity, unitPrice, total }],
  "taxAmount": "number",
  "sellerVatId": "string",
  "buyerReference": "string",

  // Optional — Protocol
  "handle": "string",
  "condition": "string",
  "splits": [{ wallet, percentage, label }],
  "recurring": "boolean",
  "recurringInterval": "daily | weekly | monthly",
  "recurringCount": "number",
  "webhookUrl": "string",
  "escrowAddress": "string",

  // Set after payment — MUST NOT be modified
  "txSignature": "base58 tx signature",
  "payerWallet": "base58 address",
  "paidAt": "unix timestamp"
}`}
          </pre>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>Agent Execution Instructions</h2>
        <p className="text-sm mb-4" style={{ color: "#aaaaaa", lineHeight: "1.8" }}>
          Any autonomous agent MUST follow these deterministic steps:
        </p>
        <div className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4 px-4 py-3 rounded-xl"
              style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}>
              <span className="text-xs font-medium mt-0.5 flex-shrink-0"
                style={{ color: "var(--spark)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-sm" style={{ color: "#aaaaaa" }}>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>Protocol Endpoints</h2>
        <div className="flex flex-col gap-3">
          {endpoints.map((ep) => (
            <div key={`${ep.method}-${ep.path}`}
              className="flex items-center gap-4 px-4 py-3 rounded-xl"
              style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}>
              <span className="text-xs font-medium w-10 flex-shrink-0"
                style={{ color: ep.method === "GET" ? "#4ade80" : "var(--spark)" }}>
                {ep.method}
              </span>
              <code className="text-sm flex-1" style={{ color: "var(--chalk)" }}>
                {ep.path}
              </code>
              <p className="text-xs" style={{ color: "#555555" }}>{ep.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xs font-medium tracking-widest uppercase mb-4"
          style={{ color: "var(--spark)" }}>Versioning</h2>
        <p style={{ color: "#aaaaaa", lineHeight: "1.8" }}>
          FRS-1 is the first stable version of the Flint Request Standard.
          Future versions will be backwards compatible. Breaking changes
          will increment the major version number. Implementations SHOULD
          include the schema version in all requests.
        </p>
      </section>

      <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "2rem" }}>
        <p className="text-xs" style={{ color: "#333333" }}>
          Flint Request Standard FRS-1 · Open source · MIT License · Built for Solana
        </p>
      </div>

    </main>
  );
}