-- REAL Flint Flow Schema Updates
-- Aligns with REAL_FLINT_FLOW.md (Alice doesn't know about escrow)
-- Created: 2026-05-08
-- Author: Flint Team

-- ============================================
-- ADD NEW COLUMNS FOR REAL FLINT FLOW
-- ============================================

-- Add Alice's WhatsApp (Bob enters when creating invoice)
-- This is used for Flint AI to send notifications to Alice
ALTER TABLE escrows 
ADD COLUMN IF NOT EXISTS alice_whatsapp TEXT;

-- Add link expiry timestamp
-- Alice must fund the invoice before this date
ALTER TABLE escrows 
ADD COLUMN IF NOT EXISTS link_expires_at TIMESTAMPTZ;

-- ============================================
-- SIMPLIFY STATE MACHINE
-- ============================================

-- Remove old constraint
ALTER TABLE escrows DROP CONSTRAINT IF EXISTS valid_state;

-- Add new simplified states matching REAL flow:
-- DRAFT: Bob created, waiting for Alice to fund
-- FUNDED_ACTIVE: Alice funded, Bob working
-- DELIVERED_REVIEW: Bob delivered, Alice reviewing
-- RELEASED_COMPLETE: Alice approved, Bob paid
-- AUTO_APPROVED: Alice ghosted (7 days), auto-released to Bob
-- AUTO_CANCELLED: Bob missed deadline or link expired, refunded to Alice
-- DISPUTED: Alice disputed, under review
-- DECLINED: Alice declined the invoice (new state)
ALTER TABLE escrows ADD CONSTRAINT valid_state CHECK (state IN (
  'draft',
  'funded_active',
  'delivered_review',
  'released_complete',
  'auto_approved',
  'auto_cancelled',
  'disputed',
  'declined'
));

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index for link expiry checks (cron job runs hourly)
CREATE INDEX IF NOT EXISTS idx_escrows_link_expires ON escrows(link_expires_at);

-- Index for Alice's WhatsApp (lookup by contact)
CREATE INDEX IF NOT EXISTS idx_escrows_alice_whatsapp ON escrows(alice_whatsapp);

-- ============================================
-- COLUMN COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN escrows.alice_whatsapp IS 'Alice contact for notifications (entered by Bob when creating invoice)';
COMMENT ON COLUMN escrows.link_expires_at IS 'Payment link expiry (Alice must fund by this date, typically 3 days)';

-- ============================================
-- MIGRATION NOTES
-- ============================================

-- This migration aligns the database with REAL_FLINT_FLOW.md:
-- 1. Alice doesn't know about Flint - she just pays Bob
-- 2. Bob pays the escrow fee (not added to Alice's payment)
-- 3. Link expiry enforces commitment from Alice
-- 4. Simplified states remove unnecessary complexity
-- 5. DECLINED state allows Alice to reject before funding

-- States REMOVED:
-- - pending_acceptance: Unnecessary, DRAFT covers this
-- - accepted_waiting_funding: Unnecessary, DRAFT covers this

-- States KEPT:
-- - draft: Bob created invoice, Alice hasn't funded
-- - funded_active: Alice funded, Bob is working
-- - delivered_review: Bob delivered, Alice reviewing
-- - released_complete: Alice approved, Bob paid
-- - auto_approved: Alice didn't respond in 7 days
-- - auto_cancelled: Bob missed deadline or link expired
-- - disputed: Alice opened dispute
-- - declined: Alice declined (NEW)

-- Previous migration: 20260507_escrow_schema.sql
-- Next migration: TBD
