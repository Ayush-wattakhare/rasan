'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, Clock, Calendar, Sparkles, Edit2, Check, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CartItem as CartItemType, SubscriptionType } from '@/types';
import { getItemPricing } from '@/lib/contexts/cart-context';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onUpdateOptions: (updates: Partial<CartItemType>) => void;
  onRemove: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const days = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
];

const STANDARD_TIMES = ['12:00 PM', '01:00 PM', '08:00 PM'];

export function CartItem({
  item,
  onUpdateQuantity,
  onUpdateOptions,
  onRemove,
}: CartItemProps) {
  const subType = item.subscription_type || 'one-time';
  const deliveryDays =
    item.delivery_days && item.delivery_days.length > 0
      ? item.delivery_days
      : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const deliveryTime = item.delivery_time || '12:00 PM';

  const [expanded, setExpanded] = useState(subType !== 'one-time');
  const [showCustomTimeInput, setShowCustomTimeInput] = useState(
    !STANDARD_TIMES.includes(deliveryTime)
  );
  const [customTimeValue, setCustomTimeValue] = useState('');

  // Calculate dynamic pricing taking into account selected days, plan duration, and discounts
  const pricing = getItemPricing({
    ...item,
    delivery_days: deliveryDays,
  });

  const toggleDay = (dayId: string) => {
    let newDays: string[];
    if (deliveryDays.includes(dayId)) {
      // Don't allow deselecting all days
      if (deliveryDays.length <= 1) return;
      newDays = deliveryDays.filter((d) => d !== dayId);
    } else {
      newDays = [...deliveryDays, dayId];
    }
    onUpdateOptions({ delivery_days: newDays });
  };

  const format24To12 = (val: string) => {
    if (!val) return '12:00 PM';
    const [h, m] = val.split(':').map(Number);
    if (isNaN(h)) return val;
    const period = h >= 12 ? 'PM' : 'AM';
    const formattedH = h % 12 || 12;
    const formattedM = m !== undefined ? String(m).padStart(2, '0') : '00';
    return `${String(formattedH).padStart(2, '0')}:${formattedM} ${period}`;
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomTimeValue(val);
    if (val) {
      const formatted = format24To12(val);
      onUpdateOptions({ delivery_time: formatted });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 hover:shadow-lg transition-all duration-300 group">
      <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
        {/* Item Info */}
        <div className="flex items-center gap-4 sm:gap-6 flex-1">
          <div className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
            {item.image_url ? (
              <Image src={item.image_url} alt={item.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">🍱</div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900 leading-none">{item.name}</h3>
              {item.is_veg && <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>}
            </div>
            <p className="text-sm font-semibold text-gray-500">
              {formatCurrency(item.price)} per meal
            </p>
            {pricing.savings > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md inline-flex border border-green-200">
                <Tag className="w-3 h-3" />
                <span>Save {pricing.discountPct}% with {pricing.subType === 'weekly' ? 'Weekly' : 'Monthly'} Plan</span>
              </div>
            )}
          </div>
        </div>

        {/* Plan Toggles */}
        <div className="flex bg-gray-100/80 p-1.5 rounded-2xl self-start lg:self-center">
          {[
            { id: 'one-time', label: 'Daily', discount: 0, tag: 'Standard' },
            { id: 'weekly', label: 'Weekly', discount: 20, tag: '20% OFF' },
            { id: 'monthly', label: 'Monthly', discount: 30, tag: '30% OFF' },
          ].map((plan) => {
            const isSelected = subType === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => {
                  onUpdateOptions({
                    subscription_type: plan.id as SubscriptionType,
                    discount_percentage: plan.discount,
                  });
                  if (plan.id !== 'one-time') setExpanded(true);
                  else setExpanded(false);
                }}
                className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white text-orange-600 shadow-md scale-100 font-extrabold'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <span>{plan.label}</span>
                {plan.discount > 0 && (
                  <span
                    className={`text-[0.65rem] px-1.5 py-0.5 rounded-full font-extrabold ${
                      isSelected
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    -{plan.discount}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quantity Controls & Dynamic Price */}
        <div className="flex items-center justify-between lg:justify-end gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-gray-600 hover:text-gray-900"
              onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <span className="w-8 text-center font-bold text-sm text-gray-900">
              {item.quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-gray-600 hover:text-gray-900"
              onClick={() => onUpdateQuantity(item.quantity + 1)}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="text-right min-w-[120px]">
            {pricing.savings > 0 ? (
              <>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-xs text-gray-400 line-through font-semibold">
                    {formatCurrency(pricing.basePrice)}
                  </span>
                  <span className="text-[0.65rem] font-bold text-green-700 bg-green-50 px-1.5 py-0.2 rounded border border-green-200">
                    -{pricing.discountPct}% OFF
                  </span>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">
                  {formatCurrency(pricing.finalPrice)}
                </p>
                <p className="text-[0.65rem] font-bold text-green-600">
                  Save {formatCurrency(pricing.savings)}
                </p>
                <p className="text-[0.65rem] text-gray-400 font-medium">
                  {pricing.cycleDescription}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total</p>
                <p className="text-2xl font-black text-gray-900 tracking-tight">
                  {formatCurrency(pricing.finalPrice)}
                </p>
                <p className="text-[0.65rem] text-gray-400 font-medium">
                  {pricing.cycleDescription}
                </p>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Expandable Schedule Area (For Weekly & Monthly Plans) */}
      {(subType !== 'one-time' || expanded) && (
        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Days selector */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Select Delivery Days ({deliveryDays.length} days/week selected)
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateOptions({
                      delivery_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                    })
                  }
                  className="text-xs font-semibold text-orange-600 hover:underline px-2 py-0.5 rounded bg-orange-50"
                >
                  Mon-Fri
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateOptions({
                      delivery_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
                    })
                  }
                  className="text-xs font-semibold text-gray-600 hover:underline px-2 py-0.5 rounded bg-gray-100"
                >
                  Mon-Sat
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateOptions({ delivery_days: days.map((d) => d.id) })}
                  className="text-xs font-semibold text-gray-600 hover:underline px-2 py-0.5 rounded bg-gray-100"
                >
                  All 7 Days
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {days.map((day) => {
                const isSelected = deliveryDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border-2 flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-orange-50 border-orange-500 text-orange-900 shadow-xs'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-orange-200'
                    }`}
                  >
                    <span>{day.label}</span>
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-orange-500 text-white' : 'bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span>💡 Total meals:</span>
              <strong className="text-gray-800 font-bold">
                {pricing.multiplier} meal{pricing.multiplier > 1 ? 's' : ''}
              </strong>
              <span>({deliveryDays.length} days/week × {subType === 'monthly' ? '4 weeks' : '1 week'})</span>
              {pricing.savings > 0 && (
                <span className="text-green-600 font-bold ml-1">
                  • {pricing.discountPct}% Plan Discount Applied
                </span>
              )}
            </p>
          </div>

          {/* Preference Time Selector */}
          <div className="space-y-3 md:w-80 border-t md:border-t-0 md:border-l md:pl-6 border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-orange-600" /> Delivery Time Slot
              </h4>
              <button
                type="button"
                onClick={() => setShowCustomTimeInput(!showCustomTimeInput)}
                className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                {showCustomTimeInput ? 'Use Standard' : 'Custom'}
              </button>
            </div>

            {/* Standard Quick Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {STANDARD_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setShowCustomTimeInput(false);
                    onUpdateOptions({ delivery_time: t });
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                    deliveryTime === t && !showCustomTimeInput
                      ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-orange-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Editable Custom Time Input */}
            {showCustomTimeInput && (
              <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-800">
                    Custom Time
                  </span>
                  <span className="text-xs font-bold text-orange-600 bg-white px-2 py-0.5 rounded border border-orange-200">
                    {deliveryTime}
                  </span>
                </div>
                <input
                  type="time"
                  value={customTimeValue}
                  onChange={handleCustomTimeChange}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            {/* Notice */}
            <div className="flex items-start gap-1.5 pt-1 text-xs text-gray-500">
              <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
              <span>
                <strong>2-Hour Rule:</strong> You can edit preference time slot anytime up to 2 hours before delivery.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
