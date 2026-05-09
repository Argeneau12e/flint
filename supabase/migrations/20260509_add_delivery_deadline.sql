-- REAL Flint Flow: Add delivery deadline column
-- Created: 2026-05-09
-- Author: Flint Team

-- ============================================
-- ADD DELIVERY DEADLINE COLUMN
-- ============================================

-- Add delivery deadline (when Bob must deliver by)
ALTER TABLE escrows 
ADD COLUMN IF NOT EXISTS delivery_deadline BIGINT;

-- Update comment
COMMENT ON COLUMN escrows.delivery_deadline IS 'Unix timestamp (ms) when seller must deliver by';

-- Index for deadline enforcement (cron job)
CREATE INDEX IF NOT EXISTS idx_escrows_delivery_deadline ON escrows(delivery_deadline);

-- ============================================
-- MIGRATION NOTES
-- ============================================

-- This adds the delivery_deadline column that was missing from previous schema.
-- The delivery_deadline is calculated when Bob creates the invoice (e.g., 7 days from creation).
-- If Bob doesn't deliver by this deadline, the escrow auto-cancels and refunds Alice.

-- Previous migration: 20260508_real_flint_update.sql
