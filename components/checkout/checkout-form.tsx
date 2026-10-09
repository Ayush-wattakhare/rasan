'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ShieldCheck,
  MapPin,
  CreditCard,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  ChefHat,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/lib/hooks/use-toast';
import { DeliveryAddressSection } from './delivery-address-section';
import { PaymentMethodSelector } from './payment-method-selector';
import { OrderSummary } from './order-summary';
import { useCart } from '@/lib/hooks/use-cart';
import { orderService } from '@/lib/services/order-service';
import { paymentService } from '@/lib/services/payment-service';
import { getStoredDeliveryLocation } from '@/lib/hooks/use-location';
import type { Address, PaymentMethod } from '@/types';
import type { OrderInsert } from '@/lib/supabase/types';

interface CheckoutFormProps {
  userId: string;
  savedAddresses: Address[];
}

export function CheckoutForm({
  userId,
  savedAddresses,
}: CheckoutFormProps) {
  const router = useRouter();
  const { cart, clearCart, isLoading } = useCart();
  const { toast } = useToast();

  const addressSectionRef = useRef<HTMLDivElement>(null);
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  // Auto-initialize address from saved addresses or stored map location
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(() => {
    if (savedAddresses && savedAddresses.length > 0) {
      return savedAddresses[0];
    }
    if (typeof window !== 'undefined') {
      const stored = getStoredDeliveryLocation();
      if (stored) {
        return {
          street: stored.details.street || stored.details.full_address || `${stored.details.locality || 'Pimpri'} Main Road`,
          city: stored.details.city || 'Pimpri-Chinchwad',
          state: stored.details.state || 'Maharashtra',
          zip_code: stored.details.zip_code || '411017',
          coordinates: { lat: stored.lat, lng: stored.lng },
        };
      }
    }
    return null;
  });

  // Default payment method to UPI for seamless 1-click checkout
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>('upi');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [createdSubscription, setCreatedSubscription] = useState<any | null>(null);
  const [countdown, setCountdown] = useState(4);

  const isSubscriptionOrder = cart.items.some(
    (item) => item.subscription_type === 'weekly' || item.subscription_type === 'monthly'
  );
  const subscriptionItem = cart.items.find(
    (item) => item.subscription_type === 'weekly' || item.subscription_type === 'monthly'
  );

  // If address was not found in state on initial mount, check stored location once client loads
  useEffect(() => {
    if (!selectedAddress) {
      const stored = getStoredDeliveryLocation();
      if (stored) {
        setSelectedAddress({
          street: stored.details.street || stored.details.full_address || `${stored.details.locality || 'Pimpri'} Main Road`,
          city: stored.details.city || 'Pimpri-Chinchwad',
          state: stored.details.state || 'Maharashtra',
          zip_code: stored.details.zip_code || '411017',
          coordinates: { lat: stored.lat, lng: stored.lng },
        });
      }
    }
  }, [selectedAddress]);

  // Auto-redirect to live order tracking or subscription hub after order is placed
  useEffect(() => {
    if (!placedOrder) return;
    if (countdown <= 0) {
      if (isSubscriptionOrder || createdSubscription) {
        router.push('/subscriptions');
      } else {
        router.push(`/orders/${placedOrder.id}`);
      }
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [placedOrder, countdown, router, isSubscriptionOrder, createdSubscription]);

  // Handle redirect if cart is empty (NEVER redirect if an order was just placed!)
  useEffect(() => {
    if (!isLoading && cart.items.length === 0 && !placedOrder) {
      router.push('/cart');
    }
  }, [cart.items.length, isLoading, router, placedOrder]);

  // Celebration View (Tailored for Scheduled Subscriptions vs Instant Orders)
  if (placedOrder) {
    const isSub = isSubscriptionOrder || createdSubscription;

    return (
      <div className="fixed inset-0 z-50 bg-[#FDFCFB]/95 backdrop-blur-md overflow-y-auto flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-gray-100 p-8 sm:p-12 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

          {/* Icon */}
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-24 h-24 bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-500 rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-orange-500/25">
              {isSub ? '🍱' : '👨‍🍳'}
            </div>
          </div>

          <div className="space-y-2">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold shadow-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${isSub ? 'bg-emerald-500' : 'bg-orange-500'} animate-pulse`}></span>
              <span>
                {isSub
                  ? `SCHEDULED: ${subscriptionItem?.subscription_type?.toUpperCase()} TIFFIN PLAN`
                  : 'LIVE: PREPARING YOUR MEAL'}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              {isSub ? 'Tiffin Subscription Activated! 🎉' : 'Order Placed Successfully! 🎉'}
            </h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              {isSub
                ? 'Your recurring meal plan is active. Fresh homely meals will be prepared and delivered on your selected days and time slot.'
                : 'Your home kitchen has received the order and is preparing fresh homemade food for you right now.'}
            </p>
          </div>

          {/* Order/Subscription Snapshot Card */}
          <div className="bg-gray-50/90 rounded-2xl p-5 border border-gray-100 text-left space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-400 font-bold uppercase text-[0.65rem] block mb-0.5">
                  {isSub ? 'Plan Tier' : 'Order ID'}
                </span>
                <span className="font-extrabold text-gray-900 text-sm capitalize">
                  {isSub
                    ? `${subscriptionItem?.subscription_type} Plan (${subscriptionItem?.subscription_type === 'weekly' ? '20% OFF' : '30% OFF'})`
                    : `#${placedOrder.order_number || placedOrder.id?.slice(0, 8).toUpperCase()}`}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase text-[0.65rem] block mb-0.5">
                  {isSub ? 'First Delivery' : 'Est. Delivery'}
                </span>
                <span className="font-extrabold text-orange-600 text-sm flex items-center gap-1">
                  {isSub ? (
                    <>
                      <Calendar className="w-3.5 h-3.5" /> Tomorrow ({subscriptionItem?.delivery_time || '12:30 PM'})
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" /> 25 - 35 Mins
                    </>
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase text-[0.65rem] block mb-0.5">
                  {isSub ? 'Delivery Days' : 'Amount'}
                </span>
                <span className="font-extrabold text-gray-900 text-xs">
                  {isSub
                    ? `${subscriptionItem?.delivery_days?.length || 5} Days / Week`
                    : `₹${placedOrder.total} (${placedOrder.payment_method?.toUpperCase()})`}
                </span>
              </div>
            </div>

            {placedOrder.delivery_address && (
              <div className="pt-3 border-t border-gray-200/60 text-xs">
                <span className="text-gray-400 font-bold uppercase text-[0.65rem] block mb-0.5">Delivery Destination</span>
                <p className="text-gray-700 font-medium truncate">
                  {placedOrder.delivery_address.street}, {placedOrder.delivery_address.city} - {placedOrder.delivery_address.zip_code}
                </p>
              </div>
            )}
          </div>

          {/* Direct Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {isSub ? (
              <>
                <Button
                  size="lg"
                  onClick={() => router.push('/subscriptions')}
                  className="flex-1 h-14 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-600/20 hover:shadow-orange-600/30 transition-all text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Manage Off-Days & Plan</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/orders')}
                  className="flex-1 h-14 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-2xl text-base cursor-pointer"
                >
                  <span>View Receipt</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => router.push(`/orders/${placedOrder.id}`)}
                  className="flex-1 h-14 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-600/20 hover:shadow-orange-600/30 transition-all text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Track Live Order</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/orders')}
                  className="flex-1 h-14 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-2xl text-base cursor-pointer"
                >
                  <span>Order History</span>
                </Button>
              </>
            )}
          </div>

          {/* Countdown notice */}
          <p className="text-xs text-gray-400 font-medium">
            Redirecting automatically in{' '}
            <strong className="text-orange-600 font-bold">{countdown}s</strong>...
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Verifying Bag Status...</p>
      </div>
    );
  }

  const subtotal = cart.subtotal;
  const deliveryFee = cart.delivery_fee;
  const platformFee = cart.platform_fee;
  const total = cart.total;

  const handlePlaceOrder = async () => {
    // 1. Validate Address
    if (!selectedAddress) {
      toast({
        title: 'Delivery Address Required',
        description: 'Please select or add a delivery address above to continue.',
        variant: 'destructive',
      });
      addressSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 2. Validate Payment Method
    if (!paymentMethod) {
      toast({
        title: 'Payment Method Required',
        description: 'Please choose your preferred payment method (UPI, Card, Wallet, or Cash).',
        variant: 'destructive',
      });
      paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsProcessing(true);

    const vendorId = cart.vendor_id || (cart.items[0] as any)?.vendor_id || 'v1';

    try {
      // Validate items availability
      try {
        const validation = await orderService.validateOrderItems(cart.items as any);
        if (!validation.valid) {
          toast({
            title: 'Items Unavailable',
            description: `The following items are no longer available: ${validation.unavailableItems.join(', ')}`,
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }
      } catch (validationErr) {
        console.warn('Item availability check bypassed in dev:', validationErr);
      }

      const isCash = paymentMethod === 'cash';

      // Create order data
      const orderData: OrderInsert = {
        customer_id: userId,
        vendor_id: vendorId as string,
        items: cart.items.map((item) => ({
          meal_id: item.meal_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subscription_type: item.subscription_type,
          delivery_days: item.delivery_days,
          delivery_time: item.delivery_time,
          discount_percentage: item.discount_percentage,
        })) as any,
        subtotal,
        delivery_fee: deliveryFee,
        tax: platformFee || 0,
        discount: 0,
        total,
        payment_method: paymentMethod,
        delivery_address: selectedAddress,
        delivery_instructions: deliveryInstructions || null,
        status: isCash ? 'confirmed' : 'pending',
        payment_status: isCash ? 'pending' : 'paid',
      };

      const order = await orderService.createOrder(orderData);

      const createSubscriptionIfApplicable = async () => {
        if (!isSubscriptionOrder || !subscriptionItem) return null;
        try {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + 1);
          const startDateStr = startDate.toISOString().split('T')[0];

          const endDate = new Date(startDate);
          if (subscriptionItem.subscription_type === 'weekly') {
            endDate.setDate(endDate.getDate() + 7);
          } else {
            endDate.setDate(endDate.getDate() + 30);
          }
          const endDateStr = endDate.toISOString().split('T')[0];

          const subRes = await fetch('/api/subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vendor_id: vendorId,
              plan_type: subscriptionItem.subscription_type,
              meal_type: 'lunch',
              start_date: startDateStr,
              end_date: endDateStr,
              delivery_days: subscriptionItem.delivery_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
              delivery_time: subscriptionItem.delivery_time || '12:30 PM',
              address: selectedAddress,
              price: total,
              auto_renew: false,
            }),
          });
          if (subRes.ok) {
            const subData = await subRes.json();
            setCreatedSubscription(subData);
            return subData;
          }
        } catch (subErr) {
          console.warn('Subscription auto-creation error:', subErr);
        }
        return null;
      };

      if (isCash) {
        await createSubscriptionIfApplicable();
        setPlacedOrder(order);
        clearCart();
        toast({
          title: isSubscriptionOrder ? 'Subscription Activated! 🎉' : 'Order Placed (Cash on Delivery) 🎉',
          description: isSubscriptionOrder
            ? 'Your scheduled meal subscription has been activated.'
            : 'Your home-cooked meal is being prepared by the chef.',
        });
      } else {
        // Razorpay or instant test payment flow
        const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

        if (!rzpKey || rzpKey === 'your_razorpay_key_id') {
          toast({
            title: isSubscriptionOrder ? 'Subscription Activated! 🎉' : 'Payment Successful 💳',
            description: `Paid ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total)} via ${paymentMethod.toUpperCase()}. Order confirmed!`,
          });

          try {
            await orderService.updatePaymentStatus(order.id, 'paid', `test_pay_${Date.now()}`);
          } catch (e) {
            console.error('Payment status update log:', e);
          }

          await createSubscriptionIfApplicable();
          setPlacedOrder(order);
          clearCart();
          return;
        }

        const paymentOrder = await paymentService.createRazorpayOrder({
          amount: total,
          orderId: order.id,
        });

        const options = {
          key: rzpKey,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: 'Rasan',
          description: 'Authentic Home-Cooked Meal',
          order_id: paymentOrder.id,
          handler: async (response: any) => {
            try {
              setIsProcessing(true);
              await paymentService.verifyPayment(
                {
                  paymentId: response.razorpay_payment_id,
                  orderId: order.id,
                  razorpayOrderId: response.razorpay_order_id,
                  signature: response.razorpay_signature,
                },
                'razorpay'
              );

              await createSubscriptionIfApplicable();
              setPlacedOrder(order);
              clearCart();
              toast({
                title: isSubscriptionOrder ? 'Subscription Activated! 🎉' : 'Payment Successful 🎉',
                description: isSubscriptionOrder
                  ? 'Your scheduled meal subscription has been activated.'
                  : 'Your order has been confirmed and assigned to the home chef.',
              });
            } catch (err: any) {
              toast({
                title: 'Verification Failed',
                description: err.message || 'Could not verify payment',
                variant: 'destructive',
              });
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
            },
          },
          theme: {
            color: '#EA580C',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (error: any) {
      console.error('Order placement error:', error);
      toast({
        title: 'Order Processing Failed',
        description: error?.message || 'Could not place order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isReady = !!selectedAddress && !!paymentMethod;

  return (
    <div className="space-y-10 pb-32">
      {/* 1. Delivery Destination */}
      <div ref={addressSectionRef} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1A1A] tracking-tight">Delivery Destination</h3>
              <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">
                Where should we deliver your home-cooked meal?
              </p>
            </div>
          </div>
          {selectedAddress && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Address Selected
            </div>
          )}
        </div>

        <DeliveryAddressSection
          addresses={
            savedAddresses.length > 0
              ? savedAddresses
              : selectedAddress
              ? [selectedAddress]
              : []
          }
          selectedAddress={selectedAddress}
          onSelectAddress={setSelectedAddress}
        />
      </div>

      {/* 2. Delivery Instructions */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-white shadow-lg">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#1A1A1A] tracking-tight">Special Delivery Instructions</h3>
            <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">
              Gate codes, landmark details, or &apos;leave at door&apos; requests
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <Textarea
            id="instructions"
            placeholder="e.g. Ring doorbell twice, flat 402 on 4th floor, please leave at security if unavailable..."
            className="min-h-[100px] rounded-2xl border-gray-100 bg-gray-50/50 font-medium focus:bg-white transition-all shadow-inner border-none pt-4 text-sm"
            value={deliveryInstructions}
            onChange={(e) => setDeliveryInstructions(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Payment Method */}
      <div ref={paymentSectionRef} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1A1A] tracking-tight">Payment Method</h3>
              <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">
                Select your preferred payment mode
              </p>
            </div>
          </div>
          {paymentMethod && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> {paymentMethod.toUpperCase()} Selected
            </div>
          )}
        </div>

        <PaymentMethodSelector
          selectedMethod={paymentMethod}
          onSelectMethod={setPaymentMethod}
        />
      </div>

      {/* 4. Order Summary */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-white shadow-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#1A1A1A] tracking-tight">Review & Validate</h3>
            <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">
              Confirm your items and final impact total
            </p>
          </div>
        </div>
        <OrderSummary
          items={cart.items as any}
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          tax={platformFee}
          discount={0}
          total={total}
        />
      </div>

      {/* 5. Finalize & Pay Button with Instant Feedback */}
      <div className="pt-8 border-t-2 border-dashed border-gray-100 space-y-3">
        {!isReady && (
          <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-bold animate-pulse">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {!selectedAddress && !paymentMethod
                ? 'Please select your delivery address and payment method above.'
                : !selectedAddress
                ? 'Please select or add a delivery destination above.'
                : 'Please select a payment method above.'}
            </span>
          </div>
        )}

        <Button
          size="lg"
          className="w-full h-18 bg-orange-600 hover:bg-[#1A1A1A] text-white font-black uppercase tracking-[0.25em] rounded-[2rem] shadow-[0_20px_50px_rgba(249,115,22,0.3)] hover:shadow-[0_20px_50px_rgba(26,26,26,0.3)] transition-all duration-500 group relative overflow-hidden active:scale-[0.99] cursor-pointer"
          onClick={handlePlaceOrder}
          disabled={isProcessing}
        >
          <span className="relative z-10 flex items-center justify-center gap-3 text-base md:text-lg">
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Transaction...
              </>
            ) : (
              <>
                Finalize & Pay{' '}
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(total)}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </Button>
      </div>
    </div>
  );
}
