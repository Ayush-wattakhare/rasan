import type { PaymentMethod } from '@/types';

export interface CreatePaymentOrderParams {
  amount: number;
  currency?: string;
  orderId: string;
  customerEmail?: string;
  customerName?: string;
}

export interface PaymentOrderResponse {
  id: string;
  amount: number;
  currency: string;
  orderId: string;
}

export interface VerifyPaymentParams {
  paymentId: string;
  orderId: string;
  razorpayOrderId?: string;
  signature: string;
}

export class PaymentService {
  /**
   * Create a payment order with Razorpay
   */
  async createRazorpayOrder(
    params: CreatePaymentOrderParams
  ): Promise<PaymentOrderResponse> {
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        provider: 'razorpay',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment order');
    }

    return response.json();
  }

  /**
   * Create a payment intent with Stripe
   */
  async createStripePaymentIntent(
    params: CreatePaymentOrderParams
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        provider: 'stripe',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment intent');
    }

    return response.json();
  }

  /**
   * Verify payment
   */
  async verifyPayment(
    params: VerifyPaymentParams,
    provider: 'razorpay' | 'stripe'
  ): Promise<{ success: boolean; message?: string }> {
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        provider,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Payment verification failed');
    }

    return response.json();
  }

  /**
   * Process cash payment (no external gateway)
   */
  async processCashPayment(orderId: string): Promise<{ success: boolean }> {
    // For cash payments, we just mark the order as confirmed
    // Payment will be collected on delivery
    return { success: true };
  }

  /**
   * Get payment method display name
   */
  getPaymentMethodName(method: PaymentMethod): string {
    const names: Record<PaymentMethod, string> = {
      cash: 'Cash on Delivery',
      card: 'Credit/Debit Card',
      upi: 'UPI',
      wallet: 'Wallet',
    };
    return names[method];
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(amount);
  }
}

export const paymentService = new PaymentService();
