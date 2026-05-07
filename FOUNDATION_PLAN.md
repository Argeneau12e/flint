# 🏗️ FLINT FOUNDATION FIRST PLAN

**Version:** 1.0  
**Created:** 2026-05-07  
**Status:** IN PROGRESS  
**Approved by:** Da-Vinci

---

## ✅ **APPROVAL STATUS**

- [x] Plan approved by Da-Vinci
- [x] Escrow services API approach (not custom Solana program)
- [x] Hybrid submission strategy (demo mode for hackathon)
- [x] State machine library created
- [x] Database migration created
- [ ] APIs updated (create, accept, fund)
- [ ] Deadline enforcement cron job
- [ ] Invoice/pay page merge
- [ ] UX integration (Phase 1)
- [ ] Blockchain integration (Phase 2)

---

## 🎯 **THE PROBLEM WE'RE SOLVING**

Current Flint implementation is **code-complete but functionally broken**:

```
❌ Escrow APIs return {success: true} without updating anything
❌ State machine exists in types.ts but nothing enforces it
❌ No blockchain integration (no PDA, no token transfers)
❌ Database doesn't track escrow states properly
❌ Two conflicting invoice systems (/invoice/[id] vs /pay/[id])
❌ Deadlines calculated but never enforced
❌ Buyer wallet not bound on accept (anyone can pay)
❌ DRAFT state skipped (goes straight to PENDING_ACCEPTANCE)
```

**VERDICT:** We're building UX polish on a house with no foundation.

---

## 🏗️ **THE SOLUTION: THREE PHASES**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PHASE 0: REAL FOUNDATION (Week 1) - IN PROGRESS                        │
├─────────────────────────────────────────────────────────────────────────┤
│  Goal: Make the state machine ACTUALLY WORK (no blockchain yet)         │
│  - ✅ State machine library                                             │
│  - ✅ Database schema migration                                         │
│  - ⏳ Update APIs (create, accept, fund, deliver, release)             │
│  - ⏳ Deadline enforcement (cron job)                                  │
│  - ⏳ Merge /invoice and /pay flows                                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: UX INTEGRATION (Week 2)                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Goal: Add UX polish on TOP of real foundation                          │
│  - Fee disclosure modal                                                 │
│  - First invoice free indicator                                         │
│  - Reputation badges on pay page                                        │
│  - Tier upgrade modal                                                   │
│  - Monthly usage tracker                                                │
│  - Navbar with tier badge                                               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: BLOCKCHAIN INTEGRATION (Week 3)                               │
├─────────────────────────────────────────────────────────────────────────┤
│  Goal: Add real Solana integration (production mode)                    │
│  - Integrate escrow services API                                        │
│  - Update fund/release APIs                                             │
│  - Wallet connection flow                                               │
│  - Test on Solana devnet                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 **HYBRID SUBMISSION STRATEGY**

### **Hackathon Submission (Demo Mode)**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHAT WE SUBMIT                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ✅ State machine fully implemented (database)                         │
│  ✅ All 10 states working                                               │
│  ✅ Deadlines enforced (cron job)                                       │
│  ✅ Fee calculator with first invoice free                            │
│  ✅ QVAC AI integration (REAL)                                         │
│  ✅ Umbra SDK integration (REAL)                                       │
│  ✅ USDT token support                                                  │
│  ✅ UX polish (badges, notifications, tier upgrades)                  │
│                                                                         │
│  ⚠️  Blockchain: DEMO MODE (database only, no Solana)                 │
│  ℹ️  Clearly labeled: "Demo Mode - Production ready post-hackathon"   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PRODUCTION ROADMAP (Post-Hackathon)                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Week 3: Integrate Solana Escrow Program                               │
│  Week 4: Security audit + testing                                      │
│  Week 5: Launch production mode                                        │
│                                                                         │
│  Code structure:                                                        │
│  - Environment variable: ESCROW_MODE=demo|production                   │
│  - Same APIs, switchable implementation                                │
│  - No breaking changes                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ **DATABASE SCHEMA**

### **New Tables:**

| Table | Purpose | Status |
|-------|---------|--------|
| `escrows` | Main escrow state machine | ✅ Migration created |
| `usage` | Monthly usage tracking | ✅ Migration created |
| `credits` | Goodwill credits | ✅ Migration created |
| `notifications` | In-app notifications | ✅ Migration created |

### **Modified Tables:**

| Table | Changes | Status |
|-------|---------|--------|
| `users` | Add: tier, tier_expires_at, email_verified | ✅ Migration created |

**Migration File:** `supabase/migrations/20260507_escrow_schema.sql`

---

## 🔄 **STATE MACHINE**

### **10 States:**

1. `DRAFT` - Invoice created but not sent
2. `PENDING_ACCEPTANCE` - Sent to buyer, waiting for acceptance (7 days)
3. `ACCEPTED_WAITING_FUNDING` - Buyer accepted, waiting for funding (3 days)
4. `FUNDED_ACTIVE` - Funds secured, seller working
5. `DELIVERED_REVIEW` - Work delivered, buyer reviewing (7 days)
6. `RELEASED_COMPLETE` - Payment released to seller
7. `DISPUTED` - Dispute opened, under review
8. `AUTO_APPROVED` - Auto-approved after review period
9. `AUTO_CANCELLED` - Auto-cancelled after timeout
10. `REFUNDED` - Funds refunded to buyer

### **State Transitions:**

```
DRAFT → PENDING_ACCEPTANCE (creator sends)
PENDING_ACCEPTANCE → ACCEPTED_WAITING_FUNDING (buyer accepts)
PENDING_ACCEPTANCE → AUTO_CANCELLED (7 days timeout)

ACCEPTED_WAITING_FUNDING → FUNDED_ACTIVE (buyer funds)
ACCEPTED_WAITING_FUNDING → AUTO_CANCELLED (3 days timeout)
ACCEPTED_WAITING_FUNDING → DRAFT (buyer declines)

FUNDED_ACTIVE → DELIVERED_REVIEW (seller delivers)
FUNDED_ACTIVE → REFUNDED (deadline timeout)

DELIVERED_REVIEW → RELEASED_COMPLETE (buyer approves)
DELIVERED_REVIEW → DISPUTED (buyer disputes)
DELIVERED_REVIEW → AUTO_APPROVED (7 days timeout)

DISPUTED → RELEASED_COMPLETE (resolve for seller)
DISPUTED → REFUNDED (resolve for buyer)
```

**Library File:** `src/lib/escrow/state-machine.ts`

---

## 🔧 **API IMPLEMENTATION STATUS**

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/escrow/create` | ✅ UPDATED | Creates in DRAFT state |
| `POST /api/escrow/accept` | ✅ UPDATED | Binds buyer wallet, transitions state |
| `POST /api/escrow/fund` | ✅ UPDATED | HYBRID MODE (demo/production) |
| `POST /api/escrow/deliver` | ⏳ TODO | Update state, trigger deadline |
| `POST /api/escrow/release` | ⏳ TODO | Update state, transfer funds |
| `POST /api/escrow/dispute` | ⏳ TODO | Freeze funds, start resolution |
| `GET /api/escrow/status` | ⏳ TODO | Get escrow details |
| `POST /api/escrow/resolve` | ⏳ TODO | Execute AI/human decision |

---

## ⏱️ **DEADLINE ENFORCEMENT**

### **Cron Job Implementation**

```typescript
// src/lib/cron/deadlines.ts (TO BE CREATED)

/**
 * Runs every hour to check and enforce deadlines
 */
export async function enforceDeadlines() {
  const supabase = createClient(...);
  const now = Date.now();
  
  // Check all active escrows
  const { data: escrows } = await supabase
    .from('escrows')
    .select('*')
    .in('state', [
      'pending_acceptance',
      'accepted_waiting_funding',
      'funded_active',
      'delivered_review',
    ]);
  
  for (const escrow of escrows) {
    // Check which deadline applies
    let deadline = 0;
    let nextState = null;
    
    if (escrow.state === 'pending_acceptance') {
      deadline = escrow.acceptance_deadline;
      nextState = 'auto_cancelled';
    } else if (escrow.state === 'accepted_waiting_funding') {
      deadline = escrow.funding_deadline;
      nextState = 'auto_cancelled';
    } else if (escrow.state === 'funded_active') {
      // Check delivery deadline (not implemented yet)
      continue;
    } else if (escrow.state === 'delivered_review') {
      deadline = escrow.review_deadline;
      nextState = 'auto_approved';
    }
    
    // If expired, transition state
    if (now > deadline && nextState) {
      await supabase
        .from('escrows')
        .update({
          state: nextState,
          resolved_at: now,
          auto_approved: nextState === 'auto_approved',
        })
        .eq('id', escrow.id);
      
      console.log(`⏰ Escrow ${escrow.id} auto-transitioned to ${nextState}`);
      
      // TODO: Send notification to affected parties
    }
  }
}
```

**File to Create:** `src/lib/cron/deadlines.ts`  
**Gateway Cron:** Set up hourly cron job in OpenClaw

---

## 📄 **FILE MANIFEST**

### **Created:**

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/escrow/state-machine.ts` | State machine logic | ✅ DONE |
| `supabase/migrations/20260507_escrow_schema.sql` | Database migration | ✅ DONE |
| `FOUNDATION_PLAN.md` | This plan | ✅ DONE |

### **Modified:**

| File | Change | Status |
|------|--------|--------|
| `src/app/api/escrow/create/route.ts` | DRAFT state, new schema | ✅ DONE |
| `src/app/api/escrow/accept/route.ts` | Bind buyer, transition state | ✅ DONE |
| `src/app/api/escrow/fund/route.ts` | HYBRID MODE (demo/prod) | ✅ DONE |

### **To Modify:**

| File | Change | Priority |
|------|--------|----------|
| `src/app/api/escrow/deliver/route.ts` | Update state, trigger deadline | 🔴 Critical |
| `src/app/api/escrow/release/route.ts` | Update state, transfer funds | 🔴 Critical |
| `src/app/api/escrow/dispute/route.ts` | Freeze funds, start resolution | 🔴 Critical |
| `src/app/pay/[id]/page.tsx` | Unified flow, show state properly | 🔴 Critical |
| `src/app/invoice/[id]/page.tsx` | DELETE or redirect to /pay | 🔴 Critical |

### **To Create:**

| File | Purpose | Priority |
|------|---------|----------|
| `src/lib/cron/deadlines.ts` | Deadline enforcement | 🔴 Critical |
| `src/components/FeeDisclosureModal.tsx` | Fee policy before funding | 🟡 High |
| `src/components/Navbar.tsx` | Global nav with tier badge | 🟡 High |
| `src/components/UsageTracker.tsx` | Monthly usage display | 🟡 High |
| `src/components/TierUpgradeModal.tsx` | Upgrade UI | 🟡 High |

---

## 📅 **TIMELINE**

### **Week 1 (Now - May 11): Foundation**

```
Day 1 (Today):
✅ State machine library
✅ Database migration
✅ Update create/accept/fund APIs

Day 2-3:
⏳ Update deliver/release/dispute APIs
⏳ Create deadline cron job
⏳ Merge /invoice and /pay flows

Day 4-5:
⏳ Test state transitions
⏳ Test deadline enforcement
⏳ Bug fixes

Day 6-7:
⏳ Start Phase 1 (UX Integration)
⏳ Prepare hackathon submission
```

### **Week 2 (May 12-18): UX Integration**

```
⏳ Fee disclosure modal
⏳ First invoice free indicator
⏳ Reputation badges
⏳ Tier upgrade UI
⏳ Usage tracker
⏳ Notifications
```

### **Week 3 (May 19-25): Blockchain Integration**

```
⏳ Integrate escrow services API
⏳ Update fund/release for production
⏳ Test on Solana devnet
⏳ Security review
```

---

## 🎯 **HACKATHON SUBMISSION CHECKLIST**

### **Tether Frontier Track ($10k USDT)**

- [x] QVAC SDK integrated
- [x] USDT token support
- [ ] State machine working (demo mode)
- [ ] Fee calculator with first invoice free
- [ ] Demo video recorded
- [ ] Submission form completed

### **Umbra Side Track ($10k USDC)**

- [x] Umbra SDK integrated (REAL)
- [x] ZK proofs working
- [ ] Private payments feature
- [ ] Demo video recorded
- [ ] Submission form completed

### **Colosseum Main Track ($250k+)**

- [x] Complete product (all features)
- [ ] State machine, fee system, reputation
- [x] QVAC + Umbra integrations
- [ ] UX polish (badges, notifications, tiers)
- [ ] Production roadmap included
- [ ] Demo video recorded
- [ ] Submission form completed

---

## 🚀 **NEXT IMMEDIATE STEPS**

1. **Update deliver API** - Transition to DELIVERED_REVIEW, trigger review deadline
2. **Update release API** - Transition to RELEASED_COMPLETE, update usage stats
3. **Update dispute API** - Transition to DISPUTED, freeze funds
4. **Create deadline cron** - Hourly check for expired escrows
5. **Merge invoice/pay flows** - Delete /invoice/[id], update /pay/[id]

---

## 📝 **LESSONS LEARNED**

1. **Don't build UX on broken foundation** - State machine must work first
2. **Be honest about what's real vs. simulated** - Demo mode is OK if clearly labeled
3. **Hybrid approach is smart** - Submit for hackathon, production-ready post-event
4. **Database is source of truth** - Even without blockchain, state must be tracked
5. **Deadlines must be enforced** - Auto-transitions prevent limbo

---

**This document is the single source of truth for Flint development.** All changes reference this plan.

**Last Updated:** 2026-05-07  
**Next Review:** After Phase 0 completion
