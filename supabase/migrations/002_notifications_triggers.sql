-- Rasan Platform - Notification Triggers
-- Description: Automatically generates notifications for customers, vendors, and delivery partners

-- 1. Function to handle order status change notifications
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_vendor_id UUID;
  v_delivery_partner_id UUID;
  v_business_name TEXT;
  v_title TEXT;
  v_message TEXT;
  v_type TEXT := 'order';
BEGIN
  -- Get relevant IDs and vendor name
  SELECT customer_id, vendor_id, delivery_partner_id INTO v_customer_id, v_vendor_id, v_delivery_partner_id FROM orders WHERE id = NEW.id;
  SELECT business_name INTO v_business_name FROM vendors WHERE id = v_vendor_id;

  -- Notify Customer
  IF NEW.status != OLD.status THEN
    CASE NEW.status
      WHEN 'confirmed' THEN
        v_title := 'Order Confirmed!';
        v_message := 'Your order from ' || v_business_name || ' has been accepted and is being processed.';
      WHEN 'preparing' THEN
        v_title := 'Preparing your meal';
        v_message := v_business_name || ' is now preparing your delicious home-cooked meal.';
      WHEN 'ready' THEN
        v_title := 'Order Ready!';
        v_message := 'Your meal is ready and waiting for a delivery partner.';
      WHEN 'picked_up' THEN
        v_title := 'Meal Picked Up';
        v_message := 'A delivery partner has picked up your order and is heading your way.';
      WHEN 'out_for_delivery' THEN
        v_title := 'Out for Delivery';
        v_message := 'Your meal is almost there! The delivery partner is in your neighborhood.';
      WHEN 'delivered' THEN
        v_title := 'Mission Accomplished';
        v_message := 'Your meal has been delivered. Enjoy your home-cooked experience!';
        v_type := 'system';
      WHEN 'cancelled' THEN
        v_title := 'Order Cancelled';
        v_message := 'Your order from ' || v_business_name || ' has been cancelled.';
        v_type := 'system';
      ELSE
        RETURN NEW;
    END CASE;

    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (v_customer_id, v_type, v_title, v_message, jsonb_build_object('order_id', NEW.id, 'status', NEW.status));
  END IF;

  -- Notify Vendor when delivery partner is assigned/picked up
  IF NEW.delivery_partner_id IS NOT NULL AND (OLD.delivery_partner_id IS NULL OR NEW.status = 'picked_up') THEN
    IF NEW.status = 'picked_up' THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        SELECT user_id, 'delivery', 'Order Picked Up', 'Order #' || NEW.order_number || ' has been picked up by the delivery partner.', jsonb_build_object('order_id', NEW.id)
        FROM profiles WHERE id = (SELECT user_id FROM vendors WHERE id = v_vendor_id);
    ELSE
        INSERT INTO notifications (user_id, type, title, message, data)
        SELECT user_id, 'delivery', 'Partner Assigned', 'A delivery partner has been assigned to Order #' || NEW.order_number, jsonb_build_object('order_id', NEW.id)
        FROM profiles WHERE id = (SELECT user_id FROM vendors WHERE id = v_vendor_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger for order updates
DROP TRIGGER IF EXISTS tr_order_status_notification ON orders;
CREATE TRIGGER tr_order_status_notification
  AFTER UPDATE OF status, delivery_partner_id ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_order_status_change();

-- 3. Function to notify vendor of new orders
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT user_id, 'order', 'New Mission Received', 'You have a new order #' || NEW.order_number || ' waiting for confirmation.', jsonb_build_object('order_id', NEW.id)
    FROM profiles WHERE id = (SELECT user_id FROM vendors WHERE id = NEW.vendor_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger for new orders
DROP TRIGGER IF EXISTS tr_new_order_notification ON orders;
CREATE TRIGGER tr_new_order_notification
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_new_order();
