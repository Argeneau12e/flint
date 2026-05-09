-- Enforce one wallet per account
-- Created: 2026-05-09

-- Add unique constraint on wallet_address in accounts table
ALTER TABLE accounts 
ADD CONSTRAINT unique_wallet_address UNIQUE (wallet_address);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_wallet ON accounts(wallet_address);

-- Add comment
COMMENT ON CONSTRAINT unique_wallet_address ON accounts IS 'Each Solana wallet can only be linked to one Flint account';

-- ============================================
-- CREATE NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'invoice_created',
    'invoice_funded', 
    'work_delivered',
    'payment_released',
    'dispute_opened',
    'dispute_resolved',
    'deadline_warning',
    'auto_approved',
    'auto_cancelled'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  escrow_id UUID REFERENCES escrows(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_wallet ON notifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(wallet_address, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_email_pending ON notifications(email_sent) WHERE email_sent = FALSE;

-- Comments
COMMENT ON TABLE notifications IS 'In-app notifications for Flint users';
COMMENT ON COLUMN notifications.type IS 'Type of notification for filtering';
COMMENT ON COLUMN notifications.escrow_id IS 'Related escrow/invoice (if applicable)';
COMMENT ON COLUMN notifications.email_sent IS 'Whether email notification was sent';

-- ============================================
-- MIGRATION NOTES
-- ============================================

-- This migration:
-- 1. Enforces one wallet per account (prevents duplicate accounts)
-- 2. Creates notifications table for in-app + email alerts
-- 3. Supports all major escrow lifecycle events

-- Previous migration: 20260509_add_deadlines.sql
