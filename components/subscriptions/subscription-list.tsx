'use client';

import SubscriptionCard from './subscription-card';

interface Subscription {
  id: string;
  plan_type: string;
  meal_type: string;
  start_date: string;
  end_date: string;
  delivery_days: string[];
  delivery_time: string;
  price: number;
  status: string;
  payment_status: string;
  auto_renew: boolean;
  vendors: {
    id: string;
    business_name: string;
    cuisine: string[];
    rating: number;
  };
}

interface SubscriptionListProps {
  subscriptions: Subscription[];
}

export default function SubscriptionList({
  subscriptions,
}: SubscriptionListProps) {
  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-sm space-y-4">
        <div className="text-6xl mb-4 grayscale opacity-20">📅</div>
        <h3 className="text-2xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
           No Active Journeys
        </h3>
        <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
          Unlock the ultimate convenience by crafting your personalized 
          meal subscription plan today.
        </p>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === 'active'
  );
  const otherSubscriptions = subscriptions.filter(
    (sub) => sub.status !== 'active'
  );

  return (
    <div className="space-y-12">
      {activeSubscriptions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
             <h2 className="text-[0.7rem] font-black text-gray-400 uppercase tracking-[0.3em] italic">
               Live Premium Subscriptions
             </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {activeSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
              />
            ))}
          </div>
        </div>
      )}

      {otherSubscriptions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-[0.7rem] font-black text-gray-400 uppercase tracking-[0.3em] italic pl-5">
             Previous Culinary Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {otherSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
