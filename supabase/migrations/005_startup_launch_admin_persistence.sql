-- Rasan Platform - Phase 5 Migration: Support Tickets, Refunds Ledger, Broadcasts & Settlement Enhancements
-- Migration: 005_startup_launch_admin_persistence.sql

-- ============================================================================
-- 1. SUPPORT TICKETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('customer', 'vendor', 'delivery')),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_total NUMERIC(10, 2),
  category TEXT NOT NULL CHECK (category IN (
    'food_quality',
    'spillage_missing_item',
    'late_delivery',
    'rider_no_show',
    'customer_unreachable',
    'payout_delay',
    'breakdown_reassign',
    'general'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  resolution_notes TEXT,
  refund_amount NUMERIC(10, 2) DEFAULT 0,
  compensation_amount NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all tickets
DROP POLICY IF EXISTS "Admins have full access to support tickets" ON support_tickets;
CREATE POLICY "Admins have full access to support tickets"
  ON support_tickets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own submitted tickets
DROP POLICY IF EXISTS "Users can view their own support tickets" ON support_tickets;
CREATE POLICY "Users can view their own support tickets"
  ON support_tickets
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own support tickets
DROP POLICY IF EXISTS "Users can submit support tickets" ON support_tickets;
CREATE POLICY "Users can submit support tickets"
  ON support_tickets
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 2. REFUNDS & COMPENSATION LEDGER TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS refunds_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_id TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_number TEXT,
  recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('customer', 'vendor', 'delivery')),
  recipient_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN (
    'customer_refund',
    'vendor_compensation',
    'rider_waiting_fee',
    'goodwill_credit'
  )),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'pending', 'failed')),
  gateway TEXT NOT NULL CHECK (gateway IN ('upi', 'razorpay', 'wallet', 'bank_transfer')),
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_ledger_order_id ON refunds_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_ledger_recipient_id ON refunds_ledger(recipient_id);
CREATE INDEX IF NOT EXISTS idx_refunds_ledger_processed_at ON refunds_ledger(processed_at DESC);

ALTER TABLE refunds_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to refunds ledger" ON refunds_ledger;
CREATE POLICY "Admins have full access to refunds ledger"
  ON refunds_ledger
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view their own refunds" ON refunds_ledger;
CREATE POLICY "Users can view their own refunds"
  ON refunds_ledger
  FOR SELECT
  USING (recipient_id = auth.uid());

-- ============================================================================
-- 3. BROADCAST ANNOUNCEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS broadcast_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target TEXT NOT NULL CHECK (target IN ('all', 'customer', 'vendor', 'delivery')),
  priority TEXT NOT NULL DEFAULT 'info' CHECK (priority IN ('urgent', 'info', 'promo')),
  reach_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_announcements_created_at ON broadcast_announcements(created_at DESC);

ALTER TABLE broadcast_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to broadcasts" ON broadcast_announcements;
CREATE POLICY "Admins have full access to broadcasts"
  ON broadcast_announcements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can read announcements" ON broadcast_announcements;
CREATE POLICY "Authenticated users can read announcements"
  ON broadcast_announcements
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- 4. PAYOUTS LEDGER ENHANCEMENTS (FOR ADMIN SETTLEMENTS)
-- ============================================================================
-- Add settlement columns to payouts table so admin settlements directly track payouts
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS utr_number TEXT;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS gross_earnings NUMERIC(10, 2);
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS platform_commission NUMERIC(10, 2);

CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON payouts(created_at DESC);

-- Allow admins full access to update payout settlements (mark completed, add UTR)
DROP POLICY IF EXISTS "Admins have full access to payouts" ON payouts;
CREATE POLICY "Admins have full access to payouts"
  ON payouts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
