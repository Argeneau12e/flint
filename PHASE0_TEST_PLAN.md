# 🔬 Phase 0 End-to-End Test Plan

**Purpose:** Verify ALL Phase 0 foundation features work before moving to Phase 1 (UX)

**Branch:** `flint-v2-escrow`  
**Deployment:** https://flint-git-flint-v2-escrow-argeneau12es-projects.vercel.app

---

## ✅ Pre-Test Checklist

- [ ] Vercel deployment successful (check commit hash matches)
- [ ] Supabase migration applied (`20260507_escrow_schema.sql`)
- [ ] Environment variables set in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ESCROW_MODE=demo` (for hackathon submission)

---

## 🧪 Test Scenarios

### Test 1: Create Escrow (DRAFT State)

**Endpoint:** `POST /api/escrow/create`

**Payload:**
```json
{
  "creator": "seller_wallet_address",
  "amount": 100,
  "token": "USDC",
  "title": "Test Invoice #1",
  "description": "Testing Phase 0 foundation",
  "feeTier": "FREE"
}
```

**Expected Results:**
- [ ] Returns `success: true`
- [ ] `escrow.state === "draft"` (NOT pending_acceptance)
- [ ] `escrow.id` is a valid UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- [ ] `feeBreakdown` shows correct fee calculation
- [ ] `deadlines` shows all three deadline timestamps
- [ ] Database record created with `state = 'draft'`

**Failure Conditions:**
- ❌ UUID error (custom ID format rejected by PostgreSQL)
- ❌ State is not `draft`
- ❌ Missing deadline fields

---

### Test 2: Accept Escrow (Binds Buyer)

**Endpoint:** `POST /api/escrow/accept`

**Payload:**
```json
{
  "escrowId": "<UUID from Test 1>",
  "buyerWallet": "buyer_wallet_address"
}
```

**Expected Results:**
- [ ] Returns `success: true`
- [ ] `escrow.state === "pending_acceptance"`
- [ ] `escrow.buyer_wallet` is set and locked
- [ ] `accepted_at` timestamp is set
- [ ] Acceptance deadline is 7 days from accept time

**Failure Conditions:**
- ❌ State doesn't transition to `pending_acceptance`
- ❌ Buyer wallet not stored
- ❌ Can accept with different buyer (should be locked)

---

### Test 3: Fund Escrow

**Endpoint:** `POST /api/escrow/fund`

**Payload:**
```json
{
  "escrowId": "<UUID>",
  "txSignature": "demo_signature_123"
}
```

**Expected Results:**
- [ ] Returns `success: true`
- [ ] `escrow.state === "funded_active"` (or `accepted_waiting_funding` → `funded_active`)
- [ ] `funded_at` timestamp is set
- [ ] Funding deadline is 3 days from accept time

**Failure Conditions:**
- ❌ State doesn't transition
- ❌ Can fund without accepting first (should fail)

---

### Test 4: Deliver Work

**Endpoint:** `POST /api/escrow/deliver`

**Payload:**
```json
{
  "escrowId": "<UUID>",
  "deliveryData": {
    "message": "Work completed",
    "attachments": []
  }
}
```

**Expected Results:**
- [ ] Returns `success: true`
- [ ] `escrow.state === "delivered_review"`
- [ ] `delivered_at` timestamp is set
- [ ] Review deadline is 7 days from delivery

**Failure Conditions:**
- ❌ State doesn't transition
- ❌ Can deliver without funding (should fail)

---

### Test 5: Release Payment (Happy Path)

**Endpoint:** `POST /api/escrow/release`

**Payload:**
```json
{
  "escrowId": "<UUID>",
  "approved": true
}
```

**Expected Results:**
- [ ] Returns `success: true`
- [ ] `escrow.state === "released_complete"`
- [ ] `released_at` timestamp is set
- [ ] Payment released to seller

**Failure Conditions:**
- ❌ State doesn't transition
- ❌ Can release without delivery (should fail)

---

### Test 6: Open Dispute

**Endpoint:** `POST /api/escrow/dispute`

**Payload:**
```json
{
  "escrowId": "<UUID>",
  "reason": "Work not as described",
  "evidence": {
    "screenshots": [],
    "messages": []
  }
}
```

**Expected Results:**
- [ ] Returns `success: true`
- [ ] `escrow.state === "disputed"`
- [ ] `dispute_reason` is stored
- [ ] Escrow is frozen (no release/refund until resolved)

**Failure Conditions:**
- ❌ State doesn't freeze
- ❌ Can still release while disputed

---

### Test 7: Resolve Dispute

**Endpoint:** `POST /api/escrow/resolve`

**Payload (Seller Wins):**
```json
{
  "escrowId": "<UUID>",
  "decision": "seller",
  "reason": "Evidence supports seller"
}
```

**Expected Results:**
- [ ] Returns `success: true`
- [ ] `escrow.state === "released_complete"`
- [ ] `resolved_at` timestamp is set
- [ ] `dispute_resolution` stores decision

**Failure Conditions:**
- ❌ State doesn't resolve
- ❌ Can resolve without dispute (should fail)

---

### Test 8: Deadline Enforcement (Cron Job)

**Manual Trigger:** Run cron job or wait for hourly check

**Expected Results:**
- [ ] Expired `pending_acceptance` → `auto_cancelled`
- [ ] Expired `accepted_waiting_funding` → `auto_cancelled`
- [ ] Expired `delivered_review` → `auto_approved`
- [ ] Notifications created for affected users

**Test Method:**
1. Create escrow
2. Accept it
3. Manually set `funding_deadline` to past timestamp in DB
4. Run cron job
5. Verify state changed to `auto_cancelled`

---

### Test 9: First Invoice Free

**Endpoint:** `POST /api/escrow/create`

**Setup:** Use a creator wallet that has never created an invoice

**Expected Results:**
- [ ] `feeBreakdown.discount > 0`
- [ ] `feeBreakdown.isFirstInvoice === true`
- [ ] `fee_amount` in database is 0 (or discounted)
- [ ] `is_first_invoice` flag is true

**Second Invoice Test:**
- [ ] Create second invoice with same creator
- [ ] `isFirstInvoice === false`
- [ ] Full fee charged

---

### Test 10: Invalid State Transitions

**Test:** Try to break the state machine

**Scenarios:**
- [ ] Fund without accept → Should fail
- [ ] Deliver without fund → Should fail
- [ ] Release without delivery → Should fail
- [ ] Dispute after release → Should fail
- [ ] Accept already accepted escrow → Should fail

**Expected:** All invalid transitions return error with clear message

---

## 📋 Test Results Template

```markdown
## Test Run: [DATE]

| Test | Status | Notes |
|------|--------|-------|
| 1. Create Escrow | ✅ / ❌ | |
| 2. Accept Escrow | ✅ / ❌ | |
| 3. Fund Escrow | ✅ / ❌ | |
| 4. Deliver Work | ✅ / ❌ | |
| 5. Release Payment | ✅ / ❌ | |
| 6. Open Dispute | ✅ / ❌ | |
| 7. Resolve Dispute | ✅ / ❌ | |
| 8. Deadline Cron | ✅ / ❌ | |
| 9. First Invoice Free | ✅ / ❌ | |
| 10. Invalid Transitions | ✅ / ❌ | |

**Blockers:** [List any critical failures]
**Ready for Phase 1:** YES / NO
```

---

## 🚀 Quick Test Commands

### Using curl:

```bash
# Test 1: Create
curl -X POST https://flint-git-flint-v2-escrow-argeneau12es-projects.vercel.app/api/escrow/create \
  -H "Content-Type: application/json" \
  -d '{"creator":"test_seller","amount":100,"token":"USDC","title":"Test","feeTier":"FREE"}'

# Test 2: Accept (use returned escrow ID)
curl -X POST https://flint-git-flint-v2-escrow-argeneau12es-projects.vercel.app/api/escrow/accept \
  -H "Content-Type: application/json" \
  -d '{"escrowId":"<UUID>","buyerWallet":"test_buyer"}'
```

### Using Browser DevTools:

1. Open Flint deployment
2. F12 → Network tab
3. Create invoice through UI
4. Check request/response for each API call
5. Verify state transitions in Console

---

## ✅ Phase 0 Graduation Criteria

**ALL must pass before Phase 1:**

1. ✅ All 10 tests pass
2. ✅ No UUID errors in logs
3. ✅ State machine enforces valid transitions
4. ✅ Deadlines are stored and enforceable
5. ✅ First invoice free works correctly
6. ✅ Dispute flow complete (open + resolve)
7. ✅ Database schema matches implementation
8. ✅ No simulated APIs (all update real state)

**Sign-off:** Da-Vinci must explicitly approve Phase 1 start
