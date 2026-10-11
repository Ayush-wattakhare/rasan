'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Phone, 
  Navigation, 
  QrCode, 
  Banknote, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Loader2, 
  IndianRupee, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DeliveryOtpModal } from '@/components/delivery/delivery-otp-modal';

interface ActiveDeliveryCardProps {
  order: any;
  deliveryPartnerId: string;
}

export default function ActiveDeliveryCard({
  order,
  deliveryPartnerId,
}: ActiveDeliveryCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCodConfirmModal, setShowCodConfirmModal] = useState(false);
  const [paymentMarkedLocal, setPaymentMarkedLocal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const isCashOnDelivery = order.payment_method === 'cash';
  const isPaid = paymentMarkedLocal || order.payment_status === 'completed' || order.payment_status === 'paid';
  const orderTotal = order.total || 0;
  const deliveryEarnings = (order.delivery_fee && order.delivery_fee > 0) ? order.delivery_fee : 35.00;

  // Generate standard UPI payload for customer to scan and pay exact amount
  const upiPayload = `upi://pay?pa=rasan.pay@okhdfcbank&pn=Rasan%20Foods&am=${orderTotal.toFixed(2)}&cu=INR&tn=Order%20${order.order_number}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(upiPayload)}`;

  const postStatus = async (payload: Record<string, unknown>) => {
    const response = await fetch(`/api/orders/${order.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update status');
    }
  };

  const handleStatusUpdate = async (newStatus: string, paymentStatusOverride?: string) => {
    setIsUpdating(true);
    try {
      if (paymentStatusOverride === 'paid') {
        await postStatus({ payment_status: 'paid' });
        setPaymentMarkedLocal(true);
      }

      // Handover requires the customer's PIN.
      if (newStatus === 'delivered') {
        setShowCodConfirmModal(false);
        setShowQrModal(false);
        setShowOtpModal(true);
        return;
      }

      await postStatus({ status: newStatus });
      setShowCodConfirmModal(false);
      setShowQrModal(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    await postStatus({ status: 'delivered', otp });
    router.refresh();
  };

  const handleRecordPayment = async (mode: 'cash' | 'upi') => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'paid' }),
      });

      if (!response.ok) {
        throw new Error('Failed to record payment');
      }

      setPaymentMarkedLocal(true);
      setShowQrModal(false);
      setShowCodConfirmModal(false);
      router.refresh();
    } catch (err) {
      console.error('Record payment error:', err);
      alert('Could not update payment status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'picked_up':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNextAction = () => {
    if (order.status === 'picked_up') {
      return {
        label: 'Mark Out for Delivery',
        status: 'out_for_delivery',
      };
    }
    if (order.status === 'out_for_delivery') {
      return {
        label: 'Mark as Delivered',
        status: 'delivered',
      };
    }
    return null;
  };

  const nextAction = getNextAction();

  const handleMarkDeliveredClick = () => {
    // If Cash on Delivery and payment hasn't been collected yet, prompt the rider
    if (isCashOnDelivery && !isPaid && nextAction?.status === 'delivered') {
      setShowCodConfirmModal(true);
      return;
    }

    if (nextAction) {
      handleStatusUpdate(nextAction.status);
    }
  };

  const openInMaps = () => {
    const coords = order.delivery_address?.coordinates;
    const addressStr = `${order.delivery_address?.street}, ${order.delivery_address?.city}`;
    
    let url = '';
    if (coords && coords.lat && coords.lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressStr)}`;
    }
    
    window.open(url, '_blank');
  };

  return (
    <>
      {/* ── DYNAMIC UPI QR CODE MODAL FOR CUSTOMER PAYMENT ── */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-6 shadow-2xl relative border border-gray-100 text-center animate-in zoom-in-95">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-gray-900 tracking-tight">Scan & Pay Exact Amount</h3>
            <p className="text-xs text-gray-500 font-medium mb-4">
              Ask customer to scan with any UPI app
            </p>

            {/* Amount Pill */}
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 mb-4 inline-block px-6">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest block">Total to Collect</span>
              <span className="text-2xl font-black text-orange-600">{formatCurrency(orderTotal)}</span>
            </div>

            {/* Live QR Image */}
            <div className="p-3 bg-white border-2 border-gray-200 rounded-3xl shadow-inner inline-block mx-auto mb-4">
              <img
                src={qrCodeUrl}
                alt="UPI Payment QR Code"
                className="w-56 h-56 rounded-xl object-contain mx-auto"
              />
            </div>

            {/* Supported App Logos / Text */}
            <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider mb-5">
              Google Pay · PhonePe · Paytm · BHIM · Any UPI
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => handleRecordPayment('upi')}
                disabled={isUpdating}
                className="w-full h-11 bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-green-600/20 cursor-pointer"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : '✓ Payment Received via UPI'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowQrModal(false)}
                className="text-xs font-bold text-gray-500 uppercase tracking-wider"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── COD COLLECTION CONFIRMATION MODAL ── */}
      {showCodConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-6 shadow-2xl relative border border-gray-100 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Banknote className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-gray-900 tracking-tight">Collect COD Payment</h3>
            <p className="text-xs text-gray-500 font-medium mb-4">
              This order requires payment at the doorstep before handing over the meal.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-5">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Amount to Collect</span>
              <span className="text-2xl font-black text-amber-600">{formatCurrency(orderTotal)}</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <Button
                onClick={() => handleStatusUpdate('delivered', 'paid')}
                disabled={isUpdating}
                className="w-full h-12 bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-green-600/20 cursor-pointer"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : `✓ Received ${formatCurrency(orderTotal)} & Deliver`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCodConfirmModal(false);
                  setShowQrModal(true);
                }}
                className="w-full h-11 border-orange-200 text-orange-600 hover:bg-orange-50 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <QrCode className="w-4 h-4" />
                Customer Wants to Pay via QR
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCodConfirmModal(false)}
                className="text-xs font-bold text-gray-500 uppercase tracking-wider"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVE DELIVERY CARD ── */}
      <Card className="p-6 rounded-[2rem] border border-gray-100 shadow-xl bg-white space-y-4">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Order #{order.order_number}</h3>
            <p className="text-xs text-gray-500 font-semibold">
              {order.vendors?.business_name || 'Kitchen Partner'}
            </p>
          </div>
          <Badge className={`font-black text-[0.65rem] uppercase tracking-wider px-3 py-1 rounded-full ${getStatusBadgeColor(order.status)}`}>
            {order.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        {/* ── DOORSTEP PAYMENT STATUS BANNER (SWIGGY/ZOMATO STYLE) ── */}
        {isCashOnDelivery && !isPaid ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-xl text-amber-700">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-amber-900 uppercase tracking-wider">
                    Collect From Customer: {formatCurrency(orderTotal)}
                  </p>
                  <p className="text-[0.65rem] text-amber-700 font-medium">
                    Cash on Delivery (POD) · Collect before delivery
                  </p>
                </div>
              </div>
            </div>

            {/* Doorstep Collection Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setShowQrModal(true)}
                className="h-10 bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 font-black text-[0.65rem] uppercase tracking-wider rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-orange-600" />
                Show UPI QR
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleRecordPayment('cash')}
                disabled={isUpdating}
                className="h-10 bg-amber-600 hover:bg-amber-500 text-white font-black text-[0.65rem] uppercase tracking-wider rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Cash Collected
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-xl text-green-700">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-green-900 uppercase tracking-wider">
                  Prepaid Order · Do Not Collect Cash
                </p>
                <p className="text-[0.65rem] text-green-700 font-medium">
                  Payment already completed ({formatCurrency(orderTotal)})
                </p>
              </div>
            </div>
            <span className="text-[0.65rem] font-black text-green-700 uppercase tracking-wider bg-white px-2.5 py-1 rounded-full border border-green-200">
              PAID ✓
            </span>
          </div>
        )}

        {/* Address & Details */}
        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-2.5 text-xs text-gray-700">
            <MapPin className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-gray-900 uppercase text-[0.65rem] tracking-wider text-gray-400">Delivery Address</p>
              <p className="font-semibold text-gray-800 leading-snug">
                {order.delivery_address?.street}, {order.delivery_address?.city},{' '}
                {order.delivery_address?.state} {order.delivery_address?.zip_code}
              </p>
            </div>
          </div>

          {order.delivery_instructions && (
            <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-3 text-xs">
              <p className="font-black text-orange-900 uppercase text-[0.65rem] tracking-wider mb-0.5">
                Customer Instructions
              </p>
              <p className="text-orange-800 font-medium">
                {order.delivery_instructions}
              </p>
            </div>
          )}

          {/* Rider's Earnings Breakdown */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-green-600" />
              <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                Your Delivery Earnings
              </span>
            </div>
            <span className="text-sm font-black text-green-600">
              {formatCurrency(deliveryEarnings)}
            </span>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              const customerPhone = order.profiles?.phone || '9876543210';
              window.location.href = `tel:${customerPhone}`;
            }}
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 font-black text-xs uppercase tracking-wider rounded-xl h-11"
          >
            <Phone className="h-4 w-4 mr-1.5" />
            Call Customer
          </Button>

          <Button
            variant="outline"
            onClick={openInMaps}
            className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 font-black text-xs uppercase tracking-wider rounded-xl h-11"
          >
            <Navigation className="h-4 w-4 mr-1.5" />
            Navigate
          </Button>

          {nextAction && (
            <Button
              onClick={handleMarkDeliveredClick}
              disabled={isUpdating}
              className="col-span-2 sm:col-span-1 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl h-11 shadow-lg shadow-orange-600/20 cursor-pointer"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : nextAction.label}
            </Button>
          )}
        </div>
      </Card>

      <DeliveryOtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        order={order}
        onVerify={handleVerifyOtp}
      />
    </>
  );
}
