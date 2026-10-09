'use client';

import { Check, Flame, Trophy, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PlanSelectorProps {
  planPricing?: any[];
  selectedPlanType: string;
  selectedMealType: string;
  deliveryDaysCount?: number;
  onPlanChange: (planType: string, mealType: string) => void;
}

export default function PlanSelector({
  planPricing,
  selectedPlanType,
  selectedMealType,
  deliveryDaysCount = 6,
  onPlanChange,
}: PlanSelectorProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const mealTypes = [
    { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
    { id: 'lunch', label: 'Lunch', icon: '🍱' },
    { id: 'dinner', label: 'Dinner', icon: '🍛' },
    { id: 'all', label: 'Full Day', icon: '🌟' },
  ];

  const planTypes = [
    {
      id: 'daily',
      title: 'Daily Tiffin',
      tagline: 'Pay-as-you-go',
      badge: 'Standard',
      badgeClass: 'bg-gray-100 text-gray-700',
      icon: <Flame className="w-4 h-4 text-orange-500" />,
      discountPct: 0,
    },
    {
      id: 'weekly',
      title: 'Weekly Plan',
      tagline: '7 days subscription',
      badge: 'Save 20%',
      badgeClass: 'bg-orange-500 text-white',
      icon: <Star className="w-4 h-4 text-orange-600" />,
      discountPct: 20,
    },
    {
      id: 'monthly',
      title: 'Monthly Plan',
      tagline: '30 days subscription',
      badge: 'Save 30%',
      badgeClass: 'bg-emerald-600 text-white',
      icon: <Trophy className="w-4 h-4 text-emerald-600" />,
      discountPct: 30,
    },
  ];

  const getPlanPricingDetails = (planType: string, mealType: string) => {
    const days = Math.max(1, deliveryDaysCount);
    const baseMealPrices: Record<string, number> = {
      breakfast: 100,
      lunch: 150,
      dinner: 150,
      all: 350,
    };
    const basePerMeal = baseMealPrices[mealType] || 150;

    let multiplier = days;
    let discountPct = 0;

    if (planType === 'weekly') {
      discountPct = 20;
      multiplier = days;
    } else if (planType === 'monthly') {
      discountPct = 30;
      multiplier = days * 4;
    } else {
      discountPct = 0;
      multiplier = 1;
    }

    const basePrice = basePerMeal * multiplier;
    const savings = Math.round((basePrice * discountPct) / 100);
    const finalPrice = Math.max(0, basePrice - savings);

    return {
      basePrice,
      savings,
      finalPrice,
      discountPct,
      multiplier,
      perMeal: multiplier > 0 ? Math.round(finalPrice / multiplier) : basePerMeal,
    };
  };

  return (
    <div className="space-y-8">
      {/* Meal Preference Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3">
          1. Choose Meal Preference
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {mealTypes.map((type) => {
            const isSelected = selectedMealType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onPlanChange(selectedPlanType, type.id)}
                className={`relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-medium transition-all text-sm ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/80 text-orange-950 font-semibold shadow-xs'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                }`}
              >
                <span className="text-xl">{type.icon}</span>
                <span>{type.label}</span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 ml-1"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plan Type Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-800">
            2. Select Subscription Duration
          </label>
          <span className="text-xs text-gray-500 font-medium">
            Pricing calculated for {deliveryDaysCount} delivery days/week
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planTypes.map((plan) => {
            const details = getPlanPricingDetails(plan.id, selectedMealType);
            const isSelected = selectedPlanType === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => onPlanChange(plan.id, selectedMealType)}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/30 shadow-md ring-2 ring-orange-500/10'
                    : 'border-gray-200 bg-white hover:border-orange-200 hover:shadow-xs'
                }`}
              >
                {/* Header with badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100/70 flex items-center justify-center">
                      {plan.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{plan.title}</h4>
                      <p className="text-xs text-gray-500">{plan.tagline}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full ${plan.badgeClass}`}
                  >
                    {plan.badge}
                  </span>
                </div>

                {/* Price Display: Strikethrough before & discounted after */}
                <div className="my-3 pt-2 border-t border-gray-100 space-y-1">
                  {details.savings > 0 ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 line-through">
                        {formatCurrency(details.basePrice)}
                      </span>
                      <span className="text-[0.65rem] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        Save {formatCurrency(details.savings)} (-{details.discountPct}%)
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">Regular pricing</div>
                  )}

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-600 font-medium">Plan price</span>
                    <div className="text-2xl font-black text-gray-900 tracking-tight">
                      {formatCurrency(details.finalPrice)}
                    </div>
                  </div>
                </div>

                {/* Breakdown & selection indicator */}
                <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">
                    {details.multiplier} meals • {formatCurrency(details.perMeal)}/meal
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
