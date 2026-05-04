import { NextResponse } from "next/server";

const schema = {
  "@context": "https://schema.org",
  "@type": "PaymentRequestSchema",
  "@id": "https://flint.vercel.app/api/schema",
  "name": "Flint Payment Request Standard",
  "version": "1.0.0",
  "description": "An open payment request protocol for Solana. Human-shareable. Agent-executable.",
  "protocol": "flint",
  "transport": "solana-actions",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique invoice identifier"
    },
    "title": {
      "type": "string",
      "description": "Human readable invoice title"
    },
    "amount": {
      "type": "number",
      "description": "Payment amount in token denomination"
    },
    "token": {
      "type": "string",
      "enum": ["SOL", "USDC"],
      "description": "SPL token symbol"
    },
    "recipientWallet": {
      "type": "string",
      "description": "Solana wallet address of the payment recipient"
    },
    "memo": {
      "type": "string",
      "description": "Optional payment memo stored on-chain"
    },
    "expiresAt": {
      "type": "number",
      "description": "Unix timestamp after which the request is invalid"
    },
    "status": {
      "type": "string",
      "enum": ["pending", "paid", "expired", "cancelled"],
      "description": "Current invoice status"
    },
    "condition": {
      "type": "string",
      "description": "Optional condition that must be met before payment is valid"
    },
    "handle": {
      "type": "string",
      "description": "Optional human readable payment handle e.g. yourname"
    },
    "lineItems": {
      "type": "array",
      "description": "Optional PEPPOL/UBL-compatible line items for B2B invoicing",
      "items": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "quantity": { "type": "number" },
          "unitPrice": { "type": "number" },
          "total": { "type": "number" }
        }
      }
    },
    "taxAmount": {
      "type": "number",
      "description": "Optional tax amount for regulatory compliance"
    },
    "sellerVatId": {
      "type": "string",
      "description": "Optional seller VAT ID for PEPPOL/UBL B2B compliance"
    },
    "buyerReference": {
      "type": "string",
      "description": "Optional buyer purchase order reference"
    },
    "txSignature": {
      "type": "string",
      "description": "Solana transaction signature after payment"
    },
    "paidAt": {
      "type": "number",
      "description": "Unix timestamp when payment was confirmed"
    }
  },
  "agentInstructions": {
    "description": "How an AI agent should parse and execute a Flint payment request",
    "steps": [
      "1. Fetch the invoice JSON from /api/invoice/create?id={id}",
      "2. Validate expiresAt is in the future",
      "3. Validate status is pending",
      "4. Check condition field if present and verify it is met",
      "5. Call POST /api/pay/{id} with your wallet public key as account",
      "6. Sign and send the returned base64 transaction",
      "7. Confirm transaction on Solana devnet or mainnet",
      "8. Verify txSignature is stored on the invoice"
    ],
    "machineReadable": true,
    "autonomous": true
  },
  "links": {
    "spec": "/spec",
    "actions": "/api/pay/{id}",
    "invoice": "/api/invoice/create?id={id}",
    "handle": "/api/invoice/create?handle={handle}",
    "x402": "/api/x402/{id}",
    "escrow": "/api/escrow?invoiceId={id}",
    "receipt": "/api/receipt/{id}",
    "verify": "/verify/{txSignature}",
    "analytics": "/analytics"
  }
};

export async function GET() {
  return NextResponse.json(schema, {
    headers: {
      "Content-Type": "application/ld+json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}