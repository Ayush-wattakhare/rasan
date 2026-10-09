import { createClient } from '@/lib/supabase/server';
import type { NotificationInsert } from '@/lib/supabase/types';

/**
 * Service for managing notifications
 */

export async function createNotification(notification: NotificationInsert) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function sendOrderNotification(
  userId: string,
  orderId: string,
  orderNumber: string,
  status: string
) {
  const messages: Record<string, { title: string; message: string }> = {
    confirmed: {
      title: 'Order Confirmed',
      message: `Your order ${orderNumber} has been confirmed and is being prepared.`,
    },
    preparing: {
      title: 'Order Being Prepared',
      message: `Your order ${orderNumber} is now being prepared by the vendor.`,
    },
    ready: {
      title: 'Order Ready',
      message: `Your order ${orderNumber} is ready and waiting for pickup.`,
    },
    picked_up: {
      title: 'Order Picked Up',
      message: `Your order ${orderNumber} has been picked up by the delivery partner.`,
    },
    out_for_delivery: {
      title: 'Out for Delivery',
      message: `Your order ${orderNumber} is on its way to you!`,
    },
    delivered: {
      title: 'Order Delivered',
      message: `Your order ${orderNumber} has been delivered. Enjoy your meal!`,
    },
    cancelled: {
      title: 'Order Cancelled',
      message: `Your order ${orderNumber} has been cancelled.`,
    },
  };

  const notification = messages[status];
  if (!notification) return;

  return createNotification({
    user_id: userId,
    type: 'order',
    title: notification.title,
    message: notification.message,
    data: { order_id: orderId, order_number: orderNumber },
  });
}

export async function sendPaymentNotification(
  userId: string,
  orderId: string,
  orderNumber: string,
  success: boolean
) {
  const notification = success
    ? {
        title: 'Payment Successful',
        message: `Payment for order ${orderNumber} was successful.`,
      }
    : {
        title: 'Payment Failed',
        message: `Payment for order ${orderNumber} failed. Please try again.`,
      };

  return createNotification({
    user_id: userId,
    type: 'payment',
    title: notification.title,
    message: notification.message,
    data: { order_id: orderId, order_number: orderNumber },
  });
}

export async function sendDeliveryNotification(
  userId: string,
  orderId: string,
  orderNumber: string,
  message: string
) {
  return createNotification({
    user_id: userId,
    type: 'delivery',
    title: 'Delivery Update',
    message,
    data: { order_id: orderId, order_number: orderNumber },
  });
}

export async function sendSubscriptionNotification(
  userId: string,
  subscriptionId: string,
  title: string,
  message: string
) {
  return createNotification({
    user_id: userId,
    type: 'subscription',
    title,
    message,
    data: { subscription_id: subscriptionId },
  });
}
