'use client';

import { useState } from 'react';
import { 
  IndianRupee, 
  Truck, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  Zap, 
  Smartphone, 
  Landmark, 
  ShieldCheck,
  MapPin,
  Store,
  Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RedeemModal } from '@/components/payouts/redeem-modal';
import Link from 'next/link';

interface EarningsClientProps {
  stats: Array<{ label: string; amount: number; count: number }>;
  allDeliveries: any[];
  partner: any;
}

export function EarningsClient({ stats, allDeliveries, partner }: EarningsClientProps) {
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number>(
    stats[3]?.amount ?? (partner.earnings?.total ?? 0)
  );

  const bankDetails = partner.bank_details;
  const hasPayoutMethod = bankDetails?.upi_id || bankDetails?.account_number;

  return (
    <>
      <RedeemModal
        isOpen={isRedeemOpen}
        onClose={() => setIsRedeemOpen(false)}
        availableBalance={currentBalance}
        userRole="delivery"
        initialBankDetails={bankDetails}
        onSuccess={(amt) => {
          setCurrentBalance((prev) => Math.max(0, prev - amt));
        }}
      />

      <div className="space-y-8">
        {/* Top Payout Action Banner */}
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[0.6rem] font-black uppercase tracking-widest text-orange-600 block">
              Withdrawable Earnings
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight italic">
                ₹{currentBalance.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-green-600 uppercase bg-green-50 px-2.5 py-1 rounded-full">
                ● Ready for Instant Transfer
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 font-medium pt-1">
              {bankDetails?.upi_id ? (
                <span className="flex items-center gap-1.5 text-gray-700">
                  <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                  UPI: <strong className="font-mono">{bankDetails.upi_id}</strong>
                </span>
              ) : null}
              {bankDetails?.account_number ? (
                <span className="flex items-center gap-1.5 text-gray-700">
                  <Landmark className="w-3.5 h-3.5 text-blue-600" />
                  Bank: •••• {bankDetails.account_number.slice(-4)}
                </span>
              ) : null}
              {!hasPayoutMethod && (
                <span className="text-amber-600 font-bold">
                  ⚠️ No payout method linked yet
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              onClick={() => setIsRedeemOpen(true)}
              className="flex-1 md:flex-initial h-14 px-8 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" /> Redeem / Cash Out
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-14 px-5 border-gray-200 text-gray-700 font-black uppercase tracking-widest rounded-2xl text-xs hover:bg-gray-50"
            >
              <Link href="/operator-profile">Edit UPI / Bank</Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                <TrendingUp className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-2xl font-black text-gray-900">₹{stat.amount.toFixed(0)}</p>
              <p className="text-xs text-gray-400 font-medium mt-1">{stat.count} deliveries</p>
            </div>
          ))}
        </div>

        {/* History with Pickup & Drop Location Details */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 uppercase italic tracking-tighter">Delivery Earnings History</h2>
                <p className="text-xs text-gray-400 font-medium">Detailed trip locations and earned payouts</p>
              </div>
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              {allDeliveries.length} Completed
            </span>
          </div>

          {allDeliveries.length === 0 ? (
            <div className="p-20 text-center">
              <Truck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="font-black text-gray-400 uppercase text-sm italic">No completed deliveries yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {allDeliveries.map((order) => {
                const orderNumber = order.order_number || `ORD-${order.id.slice(0, 8).toUpperCase()}`;
                const vendorName = order.vendors?.business_name || 'Kitchen Partner';
                const vendorAddress = order.vendors?.address || 'Pickup Point';
                const customerAddress = order.delivery_address?.street || order.delivery_address?.locality || 'Drop Location';
                const customerCity = order.delivery_address?.city 
                  ? `${order.delivery_address.city} ${order.delivery_address.zip_code ? `- ${order.delivery_address.zip_code}` : ''}`
                  : '';
                const earnedAmount = order.delivery_fee || 35;

                return (
                  <div key={order.id} className="p-5 sm:p-6 hover:bg-gray-50/60 transition-colors space-y-3.5">
                    {/* Header: Order ID, Date & Earned Payout */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center text-green-700 font-bold shrink-0">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                              Order #{orderNumber}
                            </h3>
                            <span className="text-[0.6rem] font-black text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200 uppercase tracking-wider">
                              Delivered ✓
                            </span>
                          </div>
                          <p className="text-[0.65rem] text-gray-400 font-medium pt-0.5">
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Earned Amount Pill */}
                      <div className="text-right shrink-0">
                        <span className="text-base sm:text-lg font-black text-green-600 bg-green-50/80 px-3.5 py-1.5 rounded-xl border border-green-200/80 inline-block shadow-xs">
                          +₹{earnedAmount.toFixed(0)}
                        </span>
                        <span className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-wider block mt-0.5">
                          Delivery Payout
                        </span>
                      </div>
                    </div>

                    {/* Location Route Flow: Pickup -> Dropoff */}
                    <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/60 space-y-3">
                      {/* Pickup Kitchen */}
                      <div className="flex items-start gap-2.5 text-xs">
                        <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg shrink-0 mt-0.5">
                          <Store className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[0.6rem] font-black text-orange-600 uppercase tracking-wider block">
                            Pickup Kitchen
                          </span>
                          <p className="font-black text-gray-900 truncate">
                            {vendorName}
                          </p>
                          <p className="text-[0.68rem] text-gray-500 truncate">
                            {vendorAddress}
                          </p>
                        </div>
                      </div>

                      {/* Route divider */}
                      <div className="flex items-center gap-2 pl-2">
                        <div className="w-0.5 h-3 bg-gray-300 rounded-full" />
                        <span className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">To Delivery Destination</span>
                      </div>

                      {/* Customer Drop Destination */}
                      <div className="flex items-start gap-2.5 text-xs">
                        <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg shrink-0 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[0.6rem] font-black text-emerald-600 uppercase tracking-wider block">
                            Customer Drop Destination
                          </span>
                          <p className="font-black text-gray-900 truncate">
                            {customerAddress}
                          </p>
                          {customerCity && (
                            <p className="text-[0.68rem] text-gray-500 truncate">
                              {customerCity}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
