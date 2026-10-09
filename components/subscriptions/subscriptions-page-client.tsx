'use client';

import { useState } from 'react';
import SubscriptionList from './subscription-list';
import CreateSubscriptionDialog from './create-subscription-dialog';
import TiffinSubscription from '@/components/home/tiffin-subscription';
import { EmbeddedKitchenCircle } from './embedded-kitchen-circle';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface SubscriptionsPageClientProps {
  subscriptions: any[];
  vendors: any[];
  planPricing: any[];
}

export default function SubscriptionsPageClient({
  subscriptions,
  vendors,
  planPricing,
}: SubscriptionsPageClientProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const handleSelectPlan = (plan: 'daily' | 'weekly' | 'monthly') => {
    setSelectedPlanType(plan);
    setIsDialogOpen(true);
  };

  const hasActiveSubscriptions = Boolean(subscriptions && subscriptions.some((s) => s.status === 'active'));
  const activeSub = hasActiveSubscriptions ? (subscriptions || []).find((s) => s.status === 'active') : null;
  const activeVendorId = activeSub?.vendors?.id || activeSub?.vendor_id || null;
  const activeVendorName = activeSub?.vendors?.business_name || 'Home Kitchen';

  return (
    <div className="container mx-auto p-4 md:p-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
            My <span className="text-orange-600">Subscriptions</span>
          </h1>
          <p className="text-[0.65rem] md:text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-2">
            Status: {hasActiveSubscriptions ? 'Elite Member' : 'No Active Journeys'}
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedPlanType('weekly');
            setIsDialogOpen(true);
          }}
          className="bg-[#1A1A1A] hover:bg-orange-600 text-white font-black uppercase tracking-[0.2em] px-8 py-6 rounded-[2rem] shadow-2xl transition-all duration-500 scale-100 hover:scale-105 active:scale-95 group cursor-pointer"
        >
          <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-transform" />
          Craft New Plan
        </Button>
      </div>

      {/* Main Content */}
      {!subscriptions || subscriptions.length === 0 ? (
        <div className="space-y-12">
          <div className="bg-orange-50/50 rounded-[3rem] p-4 border border-orange-100 overflow-hidden shadow-sm">
            <TiffinSubscription onSelectPlan={handleSelectPlan} />
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Active Subscriber Command Center Guide */}
          {hasActiveSubscriptions && (
            <div className="bg-gradient-to-br from-[#1A1A1A] via-gray-900 to-black text-white rounded-[2.5rem] p-6 md:p-8 shadow-xl relative overflow-hidden border border-white/10">
              <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-orange-600 text-white text-[0.65rem] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">
                        Subscriber Hub
                      </span>
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Active Plan
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight italic uppercase">
                      Effortless Tiffin & Off-Day Control
                    </h2>
                    <p className="text-xs text-gray-400 max-w-xl leading-relaxed font-medium">
                      Manage every aspect of your meal delivery without confusion. Your money is 100% protected on off-days.
                    </p>
                  </div>
                </div>

                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1.5 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-base">
                      🌴
                    </div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Take Off-Day (Carry Over)</h4>
                    <p className="text-[0.7rem] text-gray-400 leading-relaxed">
                      Tap "Manage Off-Days" on your plan to skip any day. Your cycle extends by +1 day automatically!
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1.5 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base">
                      🍱
                    </div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tomorrow's Menu Feed</h4>
                    <p className="text-[0.7rem] text-gray-400 leading-relaxed">
                      See what your home chef is cooking next and chat with fellow subscribers in the Kitchen Circle below.
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1.5 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-base">
                      📍
                    </div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">1-Day Address Redirect</h4>
                    <p className="text-[0.7rem] text-gray-400 leading-relaxed">
                      Going to office tomorrow? Change your delivery address for any single day without altering your home profile.
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1.5 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-base">
                      ⏸️
                    </div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Pause Vacation Cycle</h4>
                    <p className="text-[0.7rem] text-gray-400 leading-relaxed">
                      Traveling out of town? Pause your subscription anytime and resume whenever you return.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Subscriptions Cards */}
          <SubscriptionList subscriptions={subscriptions} />

          {/* Dedicated Embedded Kitchen Circle & Broadcast Feed - Active Subscribers Only */}
          {hasActiveSubscriptions && activeVendorId && (
            <div className="pt-4">
              <EmbeddedKitchenCircle
                vendorId={activeVendorId}
                vendorName={activeVendorName}
                isActiveSubscriber={true}
              />
            </div>
          )}

          <div className="pt-12 border-t border-gray-100">
            <h2 className="text-xl font-black uppercase italic tracking-tight text-gray-800 mb-6">Explore Other Tiffin Plans</h2>
            <div className="bg-orange-50/30 rounded-[3rem] p-4 border border-orange-100/60 overflow-hidden">
              <TiffinSubscription onSelectPlan={handleSelectPlan} />
            </div>
          </div>
        </div>
      )}

      {/* Subscription Dialog */}
      <CreateSubscriptionDialog
        vendors={vendors || []}
        planPricing={planPricing || []}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        defaultPlanType={selectedPlanType}
      />
    </div>
  );
}
