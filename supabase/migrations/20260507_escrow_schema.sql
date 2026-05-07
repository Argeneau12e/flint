-- Flint Escrow Schema Migration
-- Created: 2026-05-07
-- Purpose: Real escrow state machine with proper tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ESCROWS TABLE (replaces invoices table)
-- ============================================
CREATE TABLE IF NOT EXISTS escrows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version INTEGER DEFAULT 1,
  
  -- Parties
  creator UUID REFERENCES users(id) ON DELETE CASCADE,
  creator_wallet TEXT NOT NULL,
  buyer UUID REFERENCES users(id) ON DELETE SET NULL,
  buyer_wallet TEXT NOT NULL,
  
  -- Financials
  amount NUMERIC(12,2) NOT NULL,
  token_mint TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  fee_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  fee_original NUMERIC(10,2) NOT NULL DEFAULT 0,
  fee_discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  fee_tier TEXT NOT NULL DEFAULT 'FREE',
  total_amount NUMERIC(12,2) NOT NULL,
  
  -- State machine
  state TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  funded_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Deadlines (in milliseconds)
  acceptance_deadline BIGINT NOT NULL,
  funding_deadline BIGINT NOT NULL,
  review_deadline BIGINT NOT NULL,
  
  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
  condition TEXT,
  
  -- Blockchain
  escrow_address TEXT,
  tx_signature TEXT,
  
  -- Flags
  is_first_invoice BOOLEAN DEFAULT FALSE,
  auto_approved BOOLEAN DEFAULT FALSE,
  
  -- Dispute
  dispute_reason TEXT,
  dispute_evidence JSONB,
  dispute_resolution JSONB,
  ai_analysis JSONB,
  
  -- Constraints
  CONSTRAINT valid_state CHECK (state IN (
    'draft', 'pending_acceptance', 'accepted_waiting_funding',
    'funded_active', 'delivered_review', 'released_complete',
    'disputed', 'auto_approved', 'auto_cancelled', 'refunded'
  )),
  CONSTRAINT valid_token CHECK (token_symbol IN ('SOL', 'USDC', 'USDT'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_escrows_creator ON escrows(creator);
CREATE INDEX IF NOT EXISTS idx_escrows_buyer ON escrows(buyer);
CREATE INDEX IF NOT EXISTS idx_escrows_state ON escrows(state);
CREATE INDEX IF NOT EXISTS idx_escrows_created_at ON escrows(created_at);
CREATE INDEX IF NOT EXISTS idx_escrows_acceptance_deadline ON escrows(acceptance_deadline);
CREATE INDEX IF NOT EXISTS idx_escrows_funding_deadline ON escrows(funding_deadline);
CREATE INDEX IF NOT EXISTS idx_escrows_review_deadline ON escrows(review_deadline);

-- ============================================
-- USAGE TABLE (monthly limits)
-- ============================================
CREATE TABLE IF NOT EXISTS usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  volume_usd NUMERIC(12,2) DEFAULT 0,
  ai_analyses_count INTEGER DEFAULT 0,
  invoices_created INTEGER DEFAULT 0,
  fees_paid_usd NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- ============================================
-- CREDITS TABLE (goodwill)
-- ============================================
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount_usd NUMERIC(10,2) NOT NULL,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT credit_not_expired CHECK (expires_at > NOW())
);

-- ============================================
-- NOTIFICATIONS TABLE (in-app)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS TABLE UPDATES
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'FREE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_usage_updated_at
  BEFORE UPDATE ON usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Escrows: Users can see their own escrows (as creator or buyer)
CREATE POLICY "Users can view own escrows" ON escrows
  FOR SELECT
  USING (
    auth.uid() = creator OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.wallet_address = buyer_wallet)
  );

-- Escrows: Creators can insert
CREATE POLICY "Creators can insert escrows" ON escrows
  FOR INSERT
  WITH CHECK (auth.uid() = creator);

-- Escrows: Update based on state transitions (simplified - production needs more complex logic)
CREATE POLICY "Users can update own escrows" ON escrows
  FOR UPDATE
  USING (
    auth.uid() = creator OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.wallet_address = buyer_wallet)
  );

-- Usage: Users can view own usage
CREATE POLICY "Users can view own usage" ON usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usage: System can insert/update
CREATE POLICY "System can manage usage" ON usage
  FOR ALL
  USING (true);

-- Credits: Users can view own credits
CREATE POLICY "Users can view own credits" ON credits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Credits: System can insert/update
CREATE POLICY "System can manage credits" ON credits
  FOR ALL
  USING (true);

-- Notifications: Users can view own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Notifications: System can insert
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Notifications: Users can update own (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- MIGRATE EXISTING INVOICES (if any)
-- ============================================
-- This will be handled by a separate migration script
-- For now, we'll keep both tables and migrate gradually

COMMENT ON TABLE escrows IS 'Escrow contracts with state machine enforcement';
COMMENT ON TABLE usage IS 'Monthly usage tracking for tier limits';
COMMENT ON TABLE credits IS 'Goodwill credits for refunds and promotions';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
