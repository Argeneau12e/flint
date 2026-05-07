# 📖 Alice & Bob: A Flint Story

**Document Purpose:** This is the canonical user journey that explains the Flint escrow flow through the eyes of Alice (buyer) and Bob (seller).

**Created:** 2026-05-07  
**Status:** Final

---

## The Problem They Both Had

**Bob** is a freelance designer. He just finished a logo project for a client he met on Twitter. The work is worth **$500 USDC**.

**Alice** runs a small crypto startup. She needs Bob's design work, but she's been burned before—paid upfront and never received the files.

They don't know each other. They don't trust each other. But they both want this deal to work.

---

## Chapter 1: Bob Creates the Invoice

**Bob's Perspective:**

Bob goes to Flint and clicks **"Create Invoice"**. He fills in:

- **Title:** "Logo Design - CryptoStartup"
- **Amount:** 500 USDC
- **His wallet:** `BobWallet123...`
- **Alice's wallet:** `AliceWallet456...` (she sent it via DM)

He sees the fee breakdown:
- Invoice: 500 USDC
- Flint Fee (1%): 5 USDC
- **Total: 505 USDC**

> 💡 **What Flint Does:** Creates an escrow in `DRAFT` state. Bob gets a unique link to share with Alice.

Bob clicks **"Create"** and copies the link:
```
flint.com/pay/abc123-def456-ghi789
```

He sends it to Alice via WhatsApp: *"Hey! Here's the secure payment link."*

---

## Chapter 2: Alice Reviews the Invoice

**Alice's Perspective:**

Alice clicks the link. She sees:

- ✅ **Bob's reputation badge** (Verified ✓ - 150 points from past jobs)
- ✅ **Invoice details:** $500 USDC for logo design
- ✅ **Escrow protection notice:** "Your funds are held securely until you approve the work"

She thinks: *"Okay, my money won't go to Bob until I approve. That's fair."*

Alice clicks **"Connect Wallet"** (Phantom pops up, she approves).

Now the button changes to **"Accept & Fund Escrow"**.

---

## Chapter 3: The Fee Disclosure

**Alice's Critical Moment:**

Before Alice can fund, a modal appears:

```
┌─────────────────────────────────────┐
│        Fee Disclosure               │
├─────────────────────────────────────┤
│  Invoice Amount:    500 USDC       │
│  Fee (1%):            5 USDC       │
│  ──────────────────────────────    │
│  Total to Fund:     505 USDC       │
│                                     │
│  ⚠️ Important: The platform fee    │
│  is non-refundable, even if the    │
│  transaction is disputed.           │
│                                     │
│  ☐ I understand the fee is         │
│    non-refundable under any         │
│    circumstances.                   │
│                                     │
│  [Cancel]  [Confirm & Fund]        │
└─────────────────────────────────────┘
```

Alice checks the box. Clicks **"Confirm & Fund"**.

> 💡 **What Flint Does:** Transitions escrow from `DRAFT` → `ACCEPTED_WAITING_FUNDING`. Alice's wallet is now bound as the buyer (no one else can pay).

---

## Chapter 4: Alice Funds the Escrow

Alice is taken to the funding page. She sees:

- **Amount due:** 505 USDC
- **Escrow address:** (in production, this would be a Solana PDA)
- **Deadline:** "Funding must complete within 3 days"

She clicks **"Pay with Phantom"**. Her wallet opens, she approves the transaction.

**Success!** The page updates:

> 🎉 **"Escrow Funded! Bob has been notified to start work."**

> 💡 **What Flint Does:** Transitions escrow from `ACCEPTED_WAITING_FUNDING` → `FUNDED_ACTIVE`. The 505 USDC is now locked in escrow (not in Alice's wallet, not in Bob's—held by Flint).

---

## Chapter 5: Bob Delivers the Work

**Bob's Perspective:**

Bob gets an email: *"Great news! Alice funded the escrow."*

He opens the link and sees: **"Escrow Funded - Waiting Delivery"**

He's been working on the logo for 3 days. Now he uploads:
- Logo files (PNG, SVG, AI)
- Brand guidelines PDF
- A note: *"Thanks for working with me! Let me know if you need any revisions."*

He clicks **"Mark as Delivered"**.

> 💡 **What Flint Does:** Transitions escrow from `FUNDED_ACTIVE` → `DELIVERED_REVIEW`. Starts a 7-day review timer.

---

## Chapter 6: Alice Reviews

**Alice's Perspective:**

Alice gets an email: *"Bob delivered the work! You have 7 days to review."*

She opens the link. Downloads the files. Shows her co-founder. They love it.

Now she has two options:

### Option A: Approve (Happy Path) ✅

She clicks **"Approve & Release"**.

> 💡 **What Flint Does:** 
> - Transitions escrow from `DELIVERED_REVIEW` → `RELEASED_COMPLETE`
> - Releases 500 USDC to Bob's wallet
> - 5 USDC fee stays with Flint (non-refundable)
> - Bob earns reputation points (+10)
> - Both parties get confirmation emails

**Bob gets his $500. Alice gets her logo. Everyone wins.**

---

### Option B: Dispute (Unhappy Path) ⚠️

Let's say Alice hates the logo. Bob completely ignored her brief.

She clicks **"Dispute"**. A form appears:

```
Why are you disputing?
├─ Work not as described
├─ Poor quality
├─ Missed deadline
└─ Other: _______________

Describe the issue:
[The logo doesn't match our brand colors at all...]

Upload evidence:
[Screenshots of original brief]
[Chat history showing requirements]
```

Alice submits.

> 💡 **What Flint Does:**
> - Transitions escrow from `DELIVERED_REVIEW` → `DISPUTED`
> - Freezes the funds (no one can access)
> - Notifies Bob: "Dispute opened. You have 24h to respond."
> - AI analysis begins (QVAC integration reviews evidence)
> - Human reviewer may step in for final decision

**Then either:**
- Bob and Alice reach agreement → Dispute resolved
- AI/human decides → Funds released to winner
- Timeout → Auto-resolution based on evidence

---

## Chapter 7: The Aftermath

### If Everything Went Well:

**Bob:**
- ✅ Received $500 USDC
- ✅ Earned +10 reputation points
- ✅ Can now show "Completed Jobs: 15" on his profile
- ✅ Closer to PRO tier (lower fees!)

**Alice:**
- ✅ Got her logo files
- ✅ Can leave a review for Bob
- ✅ Knows Flint worked—will use again
- ✅ Her startup now has a professional brand

**Flint:**
- ✅ Earned $5 fee
- ✅ Two happy users
- ✅ Another successful escrow in the system

---

## The Magic Behind the Story

| What Alice & Bob Experienced | What Flint Did |
|------------------------------|----------------|
| "My money is safe" | Escrow PDA holds funds |
| "I'll get paid if I deliver" | State machine enforces flow |
| "I can dispute if needed" | Dispute resolution system |
| "The fee was clear upfront" | Fee disclosure modal |
| "I know Bob is trustworthy" | Reputation badge system |
| "I'm not being overcharged" | Usage tracker + tier limits |

---

## The End... Or Is It?

**Next chapters could include:**

- Bob hits $10k/month → Upgrades to PRO (0.5% fees)
- Alice uses Flint for 50 freelancers → BUSINESS tier
- Bob's reputation reaches "Expert" → Commands higher rates
- Flint expands to Ethereum, Base, Solana NFTs...

---

**This is Flint.** Not just code. Not just a protocol. A way for strangers to do business without fear.

🪨⚡
