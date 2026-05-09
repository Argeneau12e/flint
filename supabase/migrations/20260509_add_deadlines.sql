-- REAL Flint Flow: Add delivery and review deadline columns
-- Created: 2026-05-09
-- Author: Flint Team

-- ============================================
-- ADD DELIVERY DEADLINE COLUMN
-- ============================================

-- Add delivery deadline (when seller must deliver by)
ALTER TABLE escrows 
ADD COLUMN IF NOT EXISTS delivery_deadline BIGINT;

-- Add review deadline (when client must review by, if not null)
ALTER TABLE escrows 
ADD COLUMN IF NOT EXISTS review_deadline BIGINT;

-- Add client email column (replaces alice_whatsapp)
ALTER TABLE escrows 
ADD COLUMN IF NOT EXISTS client_email TEXT;

-- Add condition column (service conditions)
ALTER TABLE escrows 
ADD COLUMN IF NOT EXISTS condition TEXT;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index for deadline enforcement (cron job runs hourly)
CREATE INDEX IF NOT EXISTS idx_escrows_delivery_deadline ON escrows(delivery_deadline);
CREATE INDEX IF NOT EXISTS idx_escrows_review_deadline ON escrows(review_deadline);
CREATE INDEX IF NOT EXISTS idx_escrows_client_email ON escrows(client_email);

-- ============================================
-- COLUMN COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN escrows.delivery_deadline IS 'Unix timestamp (ms) when seller must deliver by';
COMMENT ON COLUMN escrows.review_deadline IS 'Unix timestamp (ms) when client must review by';
COMMENT ON COLUMN escrows.client_email IS 'Client email for notifications (replaces alice_whatsapp)';
COMMENT ON COLUMN escrows.condition IS 'Service conditions/agreed deliverables';

-- ============================================
-- MIGRATION NOTES
-- ============================================

-- This migration adds the missing deadline columns and updates to use client_email.
-- The delivery_deadline is calculated when seller creates the invoice (e.g., 7 days from creation).
-- If seller doesn't deliver by this deadline, the escrow auto-cancels and refunds client.

-- Previous migration: 20260508_real_flint_update.sql
