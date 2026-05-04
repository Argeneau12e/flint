# Flint — Programmable Payment Requests on Solana

> The open payment request protocol for Solana. Human-shareable. Agent-executable.

**Live:** https://flint-rust.vercel.app  
**Protocol Spec:** https://flint-rust.vercel.app/spec  
**Schema:** https://flint-rust.vercel.app/api/schema  
**Analytics:** https://flint-rust.vercel.app/analytics

---

## What is Flint?

Solana Pay handles transfers. Solana Actions handle transactions. Neither handles **payment requests** — with a fixed amount, expiry, conditions, and verifiable receipt.

Flint fills this gap. It is the missing invoice layer between Solana's settlement speed and real-world commercial use.

A Flint payment request is:
- A shareable link that opens a payment UI in any Solana wallet
- A structured JSON object readable by AI agents
- An on-chain receipt after settlement
- An open protocol standard anyone can implement

---

## The Flint Request Standard (FRS-1)

FRS-1 defines a machine-readable payment request object for Solana. Any human, wallet, or AI agent can discover, validate, and settle a Flint request using the same protocol.

```json
{
  "id": "uuid-v4",
  "title": "string",
  "amount": "number",
  "token": "SOL | USDC | SPL mint",
  "recipientWallet": "base58 address",
  "memo": "string",
  "expiresAt": "unix timestamp",
  "status": "pending | paid | expired | cancelled",
  "condition": "optional condition string",
  "handle": "optional human readable handle",
  "splits": "optional split payment array",
  "txSignature": "base58 tx signature after payment"
}
```

Full spec: https://flint-rust.vercel.app/spec  
JSON-LD schema: https://flint-rust.vercel.app/api/schema

---

## Features

### Core Protocol
- **Solana Actions + Blinks** — payment links work in any Blink-aware wallet
- **On-chain receipts** — every payment generates a verifiable receipt
- **Public verification** — anyone can verify a payment at `/verify/{txSignature}`
- **x402 compatibility** — returns 402 responses for agentic payment flows
- **UBL 2.1 XML export** — B2B/PEPPOL-grade invoice export

### Invoice Features
- Fixed amount, SPL token, expiry, memo
- **Conditional payments** — payer sees condition before signing
- **Escrow mode** — funds held in PDA until creator releases
- **Split payments** — automatic on-chain distribution to multiple wallets
- **Recurring requests** — daily/weekly/monthly with cycle count
- **PEPPOL/UBL fields** — sellerVatId, buyerReference, lineItems, taxAmount
- **Webhooks** — POST notification on payment with test button
- **Audit log** — full activity timeline per invoice
- **Templates** — save and reuse invoice configurations

### Identity
- **Flint.ID handles** — permanent payment pages at `/to/yourname`
- QR codes for mobile payments
- WhatsApp and email share buttons

### AI Agent Layer
- **Single invoice mode** — AI analyzes and executes one invoice
- **Autonomous mode** — scans ALL pending invoices, applies policy, executes approved payments
- **Deterministic policy** — spend caps, allowlisted recipients
- **Decision audit trail** — every agent decision logged on-chain
- Powered by Llama 3.3 via Groq

### Developer Tools
- **Embed button** — one line of HTML adds a Pay with Flint button to any website
- Public analytics API at `/api/analytics`
- Full REST API for all protocol operations

---

## How It Works

### Creating a Payment Request
1. Go to `/create`
2. Fill in title, amount, token, wallet address
3. Optionally add: handle, condition, splits, recurring schedule
4. Click Generate — receive a shareable link and QR code

### Paying a Request
1. Open the payment link
2. Connect Phantom wallet
3. Review amount, memo, and any conditions
4. Sign the transaction
5. Receive on-chain receipt with explorer link

### AI Agent Execution
1. Go to `/agent`
2. Choose single invoice or autonomous mode
3. Set policy (spend cap, allowlisted recipients)
4. Agent analyzes with Llama 3.3, applies policy, executes approved payments

---

## Embed Button

Add a Solana payment button to any website with one line:

```html
<script
  src="https://flint-rust.vercel.app/embed.js"
  data-amount="10"
  data-token="USDC"
  data-wallet="YOUR_WALLET_ADDRESS"
  data-label="Pay Now"
></script>
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/invoice/create` | Create payment request |
| GET | `/api/invoice/create?id={id}` | Fetch invoice by ID |
| GET | `/api/invoice/create?handle={handle}` | Fetch by handle |
| GET | `/api/pay/{id}` | Solana Actions metadata |
| POST | `/api/pay/{id}` | Build payment transaction |
| GET | `/api/receipt/{id}` | Get receipt JSON |
| POST | `/api/receipt/{id}` | Record payment |
| GET | `/api/verify?signature={sig}` | Verify by tx signature |
| GET | `/api/schema` | JSON-LD protocol schema |
| GET | `/api/analytics` | Public protocol analytics |
| GET | `/api/ubl?id={id}` | UBL 2.1 XML export |
| GET | `/api/x402/{id}` | x402 payment required response |
| POST | `/api/agent` | AI agent analysis and execution |
| POST | `/api/escrow` | Fund or release escrow |
| GET | `/api/audit?invoiceId={id}` | Audit log |
| GET | `/api/dashboard?wallet={address}` | Wallet invoice stats |
| GET/POST/DELETE | `/api/templates` | Invoice templates |

---

## Tech Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS
- **Blockchain:** Solana (devnet), @solana/web3.js, Solana Actions
- **Storage:** Upstash Redis
- **AI:** Llama 3.3 70B via Groq
- **Deployment:** Vercel

---

## Local Development

```bash
git clone https://github.com/Argeneau12e/flint
cd flint
npm install
```

Create `.env.local`:
```
UPSTASH_REDIS_REST_URL=your_url
UPSTASH_REDIS_REST_TOKEN=your_token
GROQ_API_KEY=your_key
```

```bash
npm run dev
```

Open http://localhost:3000

---

## Architecture

flint/
├── src/app/
│   ├── page.tsx              # Homepage
│   ├── create/               # Invoice creation
│   ├── invoice/[id]/         # Invoice display
│   ├── pay/[id]/             # Payment page
│   ├── to/[handle]/          # Flint.ID profile
│   ├── dashboard/            # Wallet dashboard
│   ├── agent/                # AI agent demo
│   ├── analytics/            # Protocol analytics
│   ├── verify/[signature]/   # Payment verification
│   ├── spec/                 # FRS-1 protocol spec
│   ├── templates/            # Invoice templates
│   ├── embed-demo/           # Embed button docs
│   └── api/                  # All API routes
├── src/lib/
│   ├── store.ts              # Invoice store
│   ├── kv.ts                 # Redis client
│   └── webhook.ts            # Webhook delivery
└── public/
├── embed.js              # Embeddable payment button
├── actions.json          # Blink compatibility
└── manifest.json         # PWA manifest

---

## Protocol Philosophy

Flint is infrastructure, not an application. The hosted app at flint-rust.vercel.app is a reference implementation. The real product is:

1. **FRS-1** — the open standard
2. **The JSON-LD schema** — the machine-readable definition
3. **The API** — the protocol surface any developer can build on

Any wallet, agent, or application can implement FRS-1. Flint is the first implementation.

---

## License

MIT — open source, free to use, fork, and build on.

---

## Submission

Built for the **Colosseum Frontier Hackathon 2026**  
Track: Payments + Infrastructure  
Live: https://flint-rust.vercel.app  
GitHub: https://github.com/Argeneau12e/flint