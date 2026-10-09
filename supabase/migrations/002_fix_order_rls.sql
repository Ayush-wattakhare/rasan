-- Add UPDATE policy for customers to manage their own orders
-- This is required for updating payment status or cancelling an order
CREATE POLICY "Customers can update their own orders"
  ON orders FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());
