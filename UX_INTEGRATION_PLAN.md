# 🎨 FLINT UX INTEGRATION PLAN

**Version:** 1.0  
**Created:** 2026-05-06  
**Status:** Pending Approval

---

## 📖 THE PROBLEM

Current implementations are **code-complete** but **UX-fragmented**. Features exist in isolation but don't flow together as a cohesive experience. Users encounter:

- ❌ No context of where they are in the journey
- ❌ No visibility into account status, tier, or usage
- ❌ No reputation signals when evaluating counterparties
- ❌ No clear upgrade path (FREE → PRO → BUSINESS)
- ❌ No notifications at critical moments
- ❌ Fee policy disclosed too late (not before funding)
- ❌ First invoice free exists in code but never shown to user

---

## 🎯 THE VISION

**Flint should feel like a guided journey, not a collection of pages.**

Every screen should answer:
1. **Where am I?** (context, state, progress)
2. **What can I do?** (clear actions, enabled/disabled states)
3. **What happens next?** (expectations, timelines, notifications)
4. **Who am I dealing with?** (reputation, badges, history)

---

## 🗺️ COMPLETE USER JOURNEYS

### **BOB'S JOURNEY (Seller/Creator)**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BOB WANTS TO GET PAID FOR FREELANCE WORK                               │
└─────────────────────────────────────────────────────────────────────────┘

STEP 1: LANDING PAGE
├─ Sees: "Escrow Protection" as #1 feature
├─ Sees: Pricing section (Free/Pro/Business)
├─ Clicks: "Create Payment Request"
└─ UX Gap: No tier indicator, no "Sign In" prompt

        ↓

STEP 2: CREATE INVOICE PAGE
├─ Enters: Title, Amount, Token, Wallet
├─ Sees: Fee calculator (real-time)
├─ ❌ MISSING: "First Invoice FREE!" badge (if applicable)
├─ ❌ MISSING: Monthly usage tracker ("$0 of $1,000 used - FREE tier")
├─ ❌ MISSING: Fee disclosure checkbox ("I understand fee is non-refundable")
├─ Clicks: "Create Invoice"
└─ UX Gap: No confirmation of tier benefits applied

        ↓

STEP 3: INVOICE CREATED
├─ Sees: Invoice page with shareable link
├─ Sees: QR code, copy link, share buttons
├─ ❌ MISSING: "Track this invoice" prompt (create account)
├─ ❌ MISSING: Reputation badge next to Bob's wallet
├─ Shares: Link with Alice via WhatsApp/Email
└─ UX Gap: Bob has no way to track unless he bookmarks

        ↓

STEP 4: WAITING FOR ALICE (PENDING_ACCEPTANCE - 7 days)
├─ ❌ MISSING: Email notification when Alice views
├─ ❌ MISSING: Email notification when Alice accepts
├─ ❌ MISSING: Dashboard shows "1 invoice awaiting acceptance"
├─ ❌ MISSING: Countdown timer ("6 days left to accept")
└─ UX Gap: Bob is completely in the dark

        ↓

STEP 5: ALICE FUNDS ESCROW (FUNDED_ACTIVE)
├─ ❌ MISSING: Email "Great news! Alice funded the escrow"
├─ ❌ MISSING: Dashboard status update
├─ ❌ MISSING: "Start work now" prompt with deadline tracker
├─ Sees: Funds secured, 7-day delivery deadline starts
└─ UX Gap: Bob might not know for days

        ↓

STEP 6: BOB DELIVERS WORK
├─ Opens: Invoice page (from email link or dashboard)
├─ Clicks: "Mark as Delivered"
├─ Uploads: Files, description, links (OPTIONAL - NOT IMPLEMENTED)
├─ ❌ MISSING: Delivery confirmation with timestamp
├─ ❌ MISSING: "Alice has 7 days to review" countdown
└─ UX Gap: No proof of delivery trail

        ↓

STEP 7A: ALICE APPROVES (RELEASED_COMPLETE)
├─ ❌ MISSING: Email "Payment released!"
├─ ❌ MISSING: Dashboard update + revenue added
├─ ❌ MISSING: Reputation points awarded (+10 points)
├─ ❌ MISSING: Badge upgrade notification (if tier changed)
├─ Sees: Funds in wallet, invoice complete
└─ UX Gap: No celebration, no "what's next?"

        ↓

STEP 7B: ALICE DISPUTES (DISPUTED)
├─ ❌ MISSING: Email "Dispute opened - submit evidence"
├─ ❌ MISSING: Evidence submission UI (files, text, links)
├─ ❌ MISSING: AI analysis preview ("87% confidence in your favor")
├─ ❌ MISSING: Timeline ("Resolution in 24-48 hours")
└─ UX Gap: Bob panics, no clear process

        ↓

STEP 8: REPUTATION & RETENTION
├─ ❌ MISSING: "You've completed 3 invoices - 20 points until Pro!"
├─ ❌ MISSING: "Upgrade to Pro for 0.5% fees (you've paid $15 in fees)"
├─ ❌ MISSING: "Refer Alice, both get $5 credit"
└─ UX Gap: No path to becoming a power user
```

---

### **ALICE'S JOURNEY (Buyer/Payer)**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ALICE WANTS TO PAY BOB SAFELY WITH ESCROW PROTECTION                   │
└─────────────────────────────────────────────────────────────────────────┘

STEP 1: RECEIVES INVOICE LINK
├─ Opens: /pay/[id] on mobile or desktop
├─ Sees: Amount, fee, deadline, Bob's wallet
├─ ❌ MISSING: Bob's reputation badge (is he trustworthy?)
├─ ❌ MISSING: Bob's username (@bobdesigns vs random wallet)
├─ ❌ MISSING: "This is YOUR first invoice - fee waived!" (if first)
└─ UX Gap: Alice has no signals to evaluate Bob

        ↓

STEP 2: REVIEWS INVOICE DETAILS
├─ Sees: Title, description, amount breakdown
├─ Sees: "Escrow Protected" badge
├─ ❌ MISSING: Fee breakdown modal (what am I paying?)
├─ ❌ MISSING: Fee policy disclosure (non-refundable after funding)
├─ ❌ MISSING: "What is escrow?" explainer (for first-timers)
└─ UX Gap: Alice doesn't fully understand what she's agreeing to

        ↓

STEP 3: CONNECTS WALLET & ACCEPTS
├─ Clicks: "Connect Wallet to Accept"
├─ Phantom popup: Connect to Flint
├─ ❌ MISSING: "Sign up for Flint account?" prompt (optional)
├─ ❌ MISSING: Username claim opportunity ("Claim @alice before Bob does!")
├─ Clicks: "Accept & Fund Escrow"
└─ UX Gap: No account creation nudge at natural moment

        ↓

STEP 4: FUNDS ESCROW
├─ Redirects to: /pay/[id]/fund
├─ Sees: "Fund 505 USDC" button
├─ ❌ MISSING: Fee disclosure modal BEFORE wallet approval
├─ ❌ MISSING: "First invoice FREE - you pay 500, not 505"
├─ ❌ MISSING: Gas estimate ("~$3.50 network fee")
├─ ❌ MISSING: "By funding, you agree to escrow terms" checkbox
├─ Approves: Transaction in Phantom
└─ UX Gap: Alice might be surprised by fee later

        ↓

STEP 5: WAITING FOR BOB TO DELIVER (FUNDED_ACTIVE - 7 days)
├─ ❌ MISSING: Email "Bob, start work! Alice funded escrow"
├─ ❌ MISSING: Dashboard shows "1 active escrow - awaiting delivery"
├─ ❌ MISSING: Countdown timer ("6 days left for Bob to deliver")
├─ ❌ MISSING: "Contact Bob" button (if no response)
└─ UX Gap: Alice worries "did Bob get notified?"

        ↓

STEP 6: BOB DELIVERS (DELIVERED_REVIEW)
├─ ❌ MISSING: Email "Bob delivered! Review now"
├─ ❌ MISSING: Push notification (if logged in)
├─ Sees: "Work delivered" status on invoice page
├─ ❌ MISSING: Delivery files/links preview
├─ ❌ MISSING: AI confidence score ("87% this matches invoice")
└─ UX Gap: Alice might not know for days (deadline ticking!)

        ↓

STEP 7A: ALICE APPROVES (RELEASED_COMPLETE)
├─ Clicks: "Approve & Release"
├─ ❌ MISSING: "Leave a review for Bob?" prompt (+2 points for both)
├─ ❌ MISSING: Receipt download (PDF with all details)
├─ ❌ MISSING: "Tip Bob?" option (optional extra)
├─ ❌ MISSING: Reputation points awarded (+5 points)
├─ Sees: "Payment Complete" confirmation
└─ UX Gap: Missed opportunity for engagement

        ↓

STEP 7B: ALICE DISPUTES (DISPUTED)
├─ Clicks: "Dispute" button
├─ ❌ MISSING: "Why are you disputing?" form (dropdown + text)
├─ ❌ MISSING: Evidence upload (screenshots, files, messages)
├─ ❌ MISSING: "Bob has 24h to respond" timeline
├─ ❌ MISSING: AI preview ("Based on evidence, 73% refund likely")
└─ UX Gap: Dispute feels scary and opaque

        ↓

STEP 8: REFUND (IF EXPIRED/DISPUTED)
├─ Sees: "500 USDT refunded to your wallet"
├─ ❌ MISSING: "Fee: $5 (non-refundable per policy)"
├─ ❌ MISSING: "🎁 Goodwill Credit: $5 (your next invoice is on us!)"
├─ ❌ MISSING: "Credit expires in 90 days" countdown
├─ ❌ MISSING: "Create new invoice" button (pre-filled with credit)
└─ UX Gap: Alice feels punished, not protected
```

---

## 🔧 INTEGRATION FIXES (PHASED APPROACH)

### **PHASE 1: FOUNDATION (Week 1)**
**Goal:** Add account context and fee transparency to existing flows

| Component | Change | Files to Modify |
|-----------|--------|-----------------|
| **Global Nav** | Add tier badge + usage indicator | `src/components/Navbar.tsx` (CREATE) |
| **Create Page** | Add first invoice free badge, fee disclosure checkbox | `src/app/create/page.tsx` |
| **Fee Calculator** | Show "First Invoice FREE!" when applicable | `src/components/escrow/FeeCalculator.tsx` |
| **Pay Page** | Show seller reputation badge, username | `src/app/pay/[id]/page.tsx` |
| **Fund Page** | Add fee disclosure modal BEFORE funding | `src/app/pay/[id]/fund/page.tsx` |
| **Supabase** | Add `usage` table for monthly tracking | Migration script |

**UX Impact:** Users see their tier, usage, and fee policy upfront. No surprises.

---

### **PHASE 2: REPUTATION INTEGRATION (Week 2)**
**Goal:** Make reputation visible and meaningful throughout the flow

| Component | Change | Files to Modify |
|-----------|--------|-----------------|
| **ReputationBadge** | Add tooltip with points + tier name | `src/components/account/ReputationBadge.tsx` |
| **Pay Page** | Show seller badge next to wallet address | `src/app/pay/[id]/page.tsx` |
| **Dashboard** | Show user's own badge + points progress | `src/app/dashboard/page.tsx` |
| **Escrow Release** | Award points on successful completion | `src/app/api/escrow/release/route.ts` |
| **Dispute** | Deduct points for lost disputes | `src/app/api/escrow/dispute/route.ts` |
| **Notifications** | Email "You earned +10 points!" | `src/lib/email.ts` (CREATE) |

**UX Impact:** Users can evaluate counterparties. Reputation becomes valuable.

---

### **PHASE 3: NOTIFICATIONS & TRACKING (Week 3)**
**Goal:** Keep users informed at every critical moment

| Component | Change | Files to Modify |
|-----------|--------|-----------------|
| **Email Templates** | Create 8 email templates (accept, fund, deliver, etc.) | `src/emails/` (CREATE) |
| **Escrow Accept** | Send email to Bob when Alice accepts | `src/app/api/escrow/accept/route.ts` |
| **Escrow Fund** | Send email to Bob when Alice funds | `src/app/api/escrow/fund/route.ts` |
| **Escrow Deliver** | Send email to Alice when Bob delivers | `src/app/api/escrow/deliver/route.ts` |
| **Escrow Release** | Send email to both on completion | `src/app/api/escrow/release/route.ts` |
| **Dashboard** | Add notification center bell icon | `src/components/Navbar.tsx` |

**UX Impact:** Users are never in the dark. Always know what's happening.

---

### **PHASE 4: TIER UPGRADES & RETENTION (Week 4)**
**Goal:** Convert free users to paid, retain power users

| Component | Change | Files to Modify |
|-----------|--------|-----------------|
| **Tier Modal** | Create upgrade UI (FREE → PRO → BUSINESS) | `src/components/TierUpgradeModal.tsx` (CREATE) |
| **Dashboard** | Show "Upgrade to Pro" CTA with ROI calc | `src/app/dashboard/page.tsx` |
| **Usage Tracker** | Show monthly usage + limit remaining | `src/components/UsageTracker.tsx` (CREATE) |
| **Goodwill Credit** | Implement $5 credit for first-timers | `src/lib/credits.ts` (CREATE) |
| **Refund Page** | Show credit applied on expiration | `src/app/pay/[id]/refund/page.tsx` (CREATE) |
| **AI Counter** | Track 5/month limit for free tier | `src/app/api/agent/route.ts` |

**UX Impact:** Clear upgrade path. Users understand value proposition.

---

## 📁 NEW FILES TO CREATE

```
src/
├── components/
│   ├── Navbar.tsx                    # Global nav with tier + usage
│   ├── TierUpgradeModal.tsx          # Upgrade UI
│   ├── UsageTracker.tsx              # Monthly usage progress bar
│   ├── FeeDisclosureModal.tsx        # Fee policy before funding
│   ├── NotificationBell.tsx          # Notification center
│   └── EvidenceUploader.tsx          # For disputes
│
├── app/
│   ├── pay/[id]/
│   │   └── refund/
│   │       └── page.tsx              # Refund + credit display
│   └── api/
│       └── usage/
│           └── route.ts              # Get/update monthly usage
│
├── emails/
│   ├── templates/
│   │   ├── invoice-accepted.tsx
│   │   ├── invoice-funded.tsx
│   │   ├── work-delivered.tsx
│   │   ├── payment-released.tsx
│   │   ├── dispute-opened.tsx
│   │   ├── refund-processed.tsx
│   │   ├── points-earned.tsx
│   │   └── tier-upgraded.tsx
│   └── send.ts                       # Email sending utility
│
├── lib/
│   ├── credits.ts                    # Goodwill credit logic
│   ├── email.ts                      # Email service (Resend/SendGrid)
│   └── notifications.ts              # In-app notification logic
│
└── supabase/
    └── migrations/
        └── 20260506_add_usage_table.sql
```

---

## 🗄️ DATABASE SCHEMA CHANGES

### **New Table: `usage`**
```sql
CREATE TABLE usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of month (e.g., 2026-05-01)
  volume_usd NUMERIC(12,2) DEFAULT 0,
  ai_analyses_count INTEGER DEFAULT 0,
  invoices_created INTEGER DEFAULT 0,
  fees_paid_usd NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month) -- One row per user per month
);
```

### **New Table: `credits`**
```sql
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount_usd NUMERIC(10,2) NOT NULL,
  reason TEXT NOT NULL, -- 'first_invoice_expiration', 'referral', 'support'
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT credit_not_expired CHECK (expires_at > NOW())
);
```

### **New Table: `notifications`**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'invoice_accepted', 'payment_released', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  link TEXT, -- Click to navigate
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Modify `users` Table**
```sql
ALTER TABLE users ADD COLUMN tier TEXT DEFAULT 'FREE'; -- FREE, PRO, BUSINESS, ENTERPRISE
ALTER TABLE users ADD COLUMN tier_expires_at TIMESTAMPTZ; -- For subscription
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
```

---

## ✅ IMPLEMENTATION CHECKLIST

### **Phase 1: Foundation**
- [ ] Create `usage` table migration
- [ ] Create `credits` table migration
- [ ] Create Navbar component with tier badge
- [ ] Update Create page with fee disclosure checkbox
- [ ] Update FeeCalculator with first invoice free logic
- [ ] Update Pay page with seller reputation badge
- [ ] Create FeeDisclosureModal component
- [ ] Integrate modal into Fund page

### **Phase 2: Reputation**
- [ ] Update ReputationBadge with tooltip
- [ ] Add badge to Pay page (seller info)
- [ ] Add badge to Dashboard (user profile)
- [ ] Update release API to award points
- [ ] Update dispute API to deduct points
- [ ] Create points-earned email template
- [ ] Send email on points awarded

### **Phase 3: Notifications**
- [ ] Set up Resend/SendGrid for email
- [ ] Create all 8 email templates
- [ ] Integrate email sending into escrow APIs
- [ ] Create `notifications` table
- [ ] Create NotificationBell component
- [ ] Add notification center to Dashboard

### **Phase 4: Tiers & Retention**
- [ ] Create TierUpgradeModal component
- [ ] Add upgrade CTA to Dashboard
- [ ] Create UsageTracker component
- [ ] Implement goodwill credit logic
- [ ] Create Refund page with credit display
- [ ] Add AI analysis counter to agent API
- [ ] Add monthly limit checks to create API

---

## 🎯 SUCCESS METRICS

| Metric | Current | Target (After UX Integration) |
|--------|---------|-------------------------------|
| **First invoice completion rate** | ~60% (estimated) | 85%+ |
| **Fee surprise complaints** | Unknown | <1% of transactions |
| **Free → Pro conversion** | 0% (no upgrade path) | 5-10% |
| **Repeat user rate (30-day)** | Unknown | 40%+ |
| **Dispute resolution time** | Unknown | <48 hours |
| **Email open rate** | N/A (no emails) | 50%+ |
| **Average invoice value** | Unknown | +20% (trust signals) |

---

## 🚀 NEXT STEPS

1. **Review this plan** - Does this match your vision?
2. **Approve or modify** - What should change?
3. **Prioritize phases** - Start with Phase 1, or jump to something else?
4. **Begin implementation** - I'll start immediately after approval

---

**This document is the single source of truth for UX integration.** Once approved, I'll reference it for every change to ensure consistency.

**Do you approve this plan? Want me to modify anything before I start building?** 🎯
