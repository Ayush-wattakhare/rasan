'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SubscriptionModalProps {
  meal: {
    id: string;
    name: string;
    price: number;
    image_url?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

type PlanType = 'daily' | 'weekly' | 'monthly';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SubscriptionModal({ meal, isOpen, onClose }: SubscriptionModalProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [deliveryTime, setDeliveryTime] = useState({ hour: '12', minute: '00', period: 'PM' });

  if (!isOpen) return null;

  const plans = [
    {
      type: 'daily' as PlanType,
      name: 'Daily Plan',
      price: 60,
      period: 'per meal',
      features: [
        'Pay per meal, no commitment',
        'Choose any available meal',
        'Standard delivery fee applies',
        'Order up to 2 weeks in advance',
        'Flexible meal selection',
      ],
    },
    {
      type: 'weekly' as PlanType,
      name: 'Weekly Plan',
      price: 399,
      period: 'per week',
      badge: 'Most Popular',
      savings: 'Save 5%',
      features: [
        '7 meals per week (lunch or dinner)',
        'Free delivery on all orders',
        'Customize meals 24h in advance',
        '5% savings vs daily orders',
        'Priority customer support',
      ],
    },
    {
      type: 'monthly' as PlanType,
      name: 'Monthly Plan',
      price: 1080,
      period: 'per month',
      savings: 'Save 10%',
      features: [
        '20 meals per month (based on selected days)',
        'Free delivery on all orders',
        'Premium menu selection',
        '10% savings vs daily orders',
        'Dedicated support manager',
      ],
    },
  ];

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const calculateTotal = () => {
    if (!selectedPlan) return 0;
    const plan = plans.find((p) => p.type === selectedPlan);
    return plan?.price || 0;
  };

  const handleSubscribe = () => {
    // Create subscription object
    const subscription = {
      mealId: meal.id,
      mealName: meal.name,
      planType: selectedPlan,
      workingDays: selectedDays,
      deliveryTime: `${deliveryTime.hour}:${deliveryTime.minute} ${deliveryTime.period}`,
      price: calculateTotal(),
    };

    // Store in localStorage or state management
    localStorage.setItem('pendingSubscription', JSON.stringify(subscription));
    
    // Redirect to cart
    router.push('/cart?type=subscription');
  };

  const canSubscribe = () => {
    if (!selectedPlan) return false;
    if (selectedPlan === 'daily') return true;
    return selectedDays.length > 0;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full my-8 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
            <p className="text-gray-600">Select a subscription plan for {meal.name}</p>
          </div>

          {/* Plan Selection */}
          {!selectedPlan ? (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {plans.map((plan) => (
                <Card
                  key={plan.type}
                  className="border-2 hover:border-orange-500 transition-all cursor-pointer relative overflow-hidden"
                  onClick={() => setSelectedPlan(plan.type)}
                >
                  {plan.badge && (
                    <div className="absolute top-4 right-4 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      {plan.badge}
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-orange-600">₹{plan.price}</span>
                      <span className="text-gray-600 ml-2">{plan.period}</span>
                    </div>
                    {plan.savings && (
                      <div className="inline-block bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-semibold mb-4">
                        {plan.savings}
                      </div>
                    )}
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-6 bg-orange-600 hover:bg-orange-700">
                      Select Plan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Plan Display */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {plans.find((p) => p.type === selectedPlan)?.name}
                  </h3>
                  <p className="text-gray-600">
                    ₹{plans.find((p) => p.type === selectedPlan)?.price} {plans.find((p) => p.type === selectedPlan)?.period}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedPlan(null)}>
                  Change Plan
                </Button>
              </div>

              {/* Working Days Selection (for weekly/monthly) */}
              {(selectedPlan === 'weekly' || selectedPlan === 'monthly') && (
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Select Working Days</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                          selectedDays.includes(day)
                            ? 'border-orange-600 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Time Selection */}
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-4">Choose Delivery Time</h3>
                <div className="flex gap-3">
                  <select
                    value={deliveryTime.hour}
                    onChange={(e) => setDeliveryTime({ ...deliveryTime, hour: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-600 focus:outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                      <option key={hour} value={hour.toString().padStart(2, '0')}>
                        {hour.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <select
                    value={deliveryTime.minute}
                    onChange={(e) => setDeliveryTime({ ...deliveryTime, minute: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-600 focus:outline-none"
                  >
                    {['00', '15', '30', '45'].map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>
                  <select
                    value={deliveryTime.period}
                    onChange={(e) => setDeliveryTime({ ...deliveryTime, period: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-600 focus:outline-none"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* Order Summary */}
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Selected Meal:</span>
                      <span className="font-semibold text-gray-900">{meal.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan Type:</span>
                      <span className="font-semibold text-gray-900 capitalize">{selectedPlan} Plan</span>
                    </div>
                    {selectedDays.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Working Days:</span>
                        <span className="font-semibold text-gray-900">{selectedDays.length} days</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Time:</span>
                      <span className="font-semibold text-gray-900">
                        {deliveryTime.hour}:{deliveryTime.minute} {deliveryTime.period}
                      </span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                        <span className="text-2xl font-bold text-orange-600">₹{calculateTotal()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscribe Button */}
              <Button
                onClick={handleSubscribe}
                disabled={!canSubscribe()}
                className="w-full py-6 text-lg font-semibold bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Subscribe Now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
