'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Utensils, Edit2, MessageCircle, Sparkles, Coffee, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import SubscriptionDetails from './subscription-details';
import { EditSubscriptionTimeModal } from './edit-subscription-time-modal';
import { VendorCommunityChat } from './vendor-community-chat';

interface SubscriptionCardProps {
  subscription: any;
}

export default function SubscriptionCard({
  subscription,
}: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditTime, setShowEditTime] = useState(false);
  const [showCommunityChat, setShowCommunityChat] = useState(false);
  const [currentDeliveryTime, setCurrentDeliveryTime] = useState(subscription.delivery_time || '12:00 PM');
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAction = async (action: 'pause' | 'resume' | 'cancel') => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/subscriptions/${subscription.id}/${action}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${action} subscription`);
      }

      router.refresh();
    } catch (error) {
      console.error(`Error ${action}ing subscription:`, error);
      alert(`Failed to ${action} subscription. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <EditSubscriptionTimeModal
        isOpen={showEditTime}
        onClose={() => setShowEditTime(false)}
        subscriptionId={subscription.id}
        currentDeliveryTime={currentDeliveryTime}
        planType={subscription.plan_type}
        onSuccess={(newTime) => {
          setCurrentDeliveryTime(newTime);
          router.refresh();
        }}
      />

      <Card className="border-none shadow-sm hover:shadow-2xl smooth-transition bg-white overflow-hidden rounded-[2.5rem] p-8 group">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📅
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                  {subscription.vendors?.business_name || 'Home Chef Tiffin'}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[0.65rem] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                    {subscription.plan_type === 'weekly'
                      ? 'Weekly Plan • 20% OFF'
                      : subscription.plan_type === 'monthly'
                      ? 'Monthly Plan • 30% OFF'
                      : 'Daily Plan'}
                  </span>
                  <span className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-wider">
                    {subscription.delivery_days?.length || 5} Days/Wk
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`px-4 py-2 rounded-xl text-[0.65rem] font-black uppercase tracking-[0.2em] shadow-sm border ${getStatusColor(
              subscription.status
            )} text-center`}
          >
            {subscription.status}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 pl-15">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <Utensils className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[0.6rem] font-black text-gray-300 uppercase tracking-widest">
                Meal Selection
              </span>
              <span className="text-sm font-bold text-[#1A1A1A] capitalize">
                {subscription.meal_type}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between group/slot bg-orange-50/40 hover:bg-orange-50 p-2.5 rounded-2xl border border-orange-100/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-orange-600">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[0.6rem] font-black text-orange-600 uppercase tracking-widest">
                  Primary Slot
                </span>
                <span className="text-sm font-bold text-[#1A1A1A]">
                  {currentDeliveryTime}
                </span>
              </div>
            </div>
            {subscription.status === 'active' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowEditTime(true)}
                className="h-8 px-2.5 text-[0.65rem] font-black uppercase text-orange-600 hover:text-white hover:bg-orange-600 rounded-xl transition-all"
                title="Edit delivery time (allowed up to 2 hours before delivery)"
              >
                <Edit2 className="w-3 h-3 mr-1" /> Edit
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gray-50/50 border border-gray-100 mb-8">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest mb-1">
                Total Plan Value
              </span>
              <span className="text-2xl font-black text-[#1A1A1A] tracking-tighter italic">
                {formatCurrency(subscription.price)}
              </span>
            </div>
            <p className="text-[0.6rem] font-bold text-gray-300 uppercase tracking-widest text-right">
              Billed {subscription.plan_type} <br />
              Next cycle:{' '}
              {subscription.end_date
                ? format(new Date(subscription.end_date), 'MMM dd')
                : 'Active'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-6 border-t border-gray-100">
          <Button
            onClick={() => setShowDetails(true)}
            className="flex-1 min-w-[160px] h-12 rounded-xl text-xs font-black uppercase tracking-wider bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-4 h-4" /> Tiffin Calendar & Off-Days
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCommunityChat(true)}
            className="flex-1 min-w-[150px] h-12 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-orange-200 text-orange-950 hover:bg-orange-50 hover:border-orange-400 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-orange-600" /> Tomorrow's Menu & Chat
          </Button>

          {subscription.status === 'active' && (
            <>
              <Button
                variant="ghost"
                onClick={() => setShowEditTime(true)}
                className="h-12 px-3 rounded-xl text-[0.65rem] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-50 border border-orange-200"
                title="Change delivery time slot"
              >
                <Clock className="w-3.5 h-3.5 mr-1" /> Time
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleAction('pause')}
                disabled={isLoading}
                className="h-12 px-3 rounded-xl text-[0.65rem] font-black uppercase tracking-widest text-yellow-700 hover:bg-yellow-50"
              >
                Pause
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleAction('cancel')}
                disabled={isLoading}
                className="h-12 px-3 rounded-xl text-[0.65rem] font-black uppercase tracking-widest text-red-600 hover:bg-red-50"
              >
                Cancel
              </Button>
            </>
          )}

          {subscription.status === 'paused' && (
            <Button
              onClick={() => handleAction('resume')}
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl bg-[#1A1A1A] hover:bg-orange-600 text-white text-[0.65rem] font-black uppercase tracking-widest shadow-xl group/resume"
            >
              Resume Plan
            </Button>
          )}
        </div>
      </Card>

      {showDetails && (
        <SubscriptionDetails
          subscription={{ ...subscription, delivery_time: currentDeliveryTime }}
          onClose={() => setShowDetails(false)}
          onUpdate={() => {
            router.refresh();
          }}
        />
      )}

      {showCommunityChat && (
        <VendorCommunityChat
          vendorId={subscription.vendors?.id || subscription.vendor_id}
          vendorName={subscription.vendors?.business_name || 'Home Kitchen'}
          isOpen={showCommunityChat}
          onClose={() => setShowCommunityChat(false)}
          subscription={subscription}
        />
      )}
    </>
  );
}
