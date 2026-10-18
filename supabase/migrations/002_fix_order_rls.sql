-- Add UPDATE policy for customers to manage their own orders
-- This is required for updating payment status or cancelling an order
-- (Superseded by 003_security_hardening.sql, which drops this policy again.)
DROP POLICY IF EXISTS "Customers can update their own orders" ON orders;
CREATE POLICY "Customers can update their own orders"
  ON orders FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());
