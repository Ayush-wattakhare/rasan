'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, Clock, Calendar, Sparkles, Edit2, Check, Tag, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CartItem as CartItemType, SubscriptionType } from '@/types';
import { getItemPricing } from '@/lib/contexts/cart-context';
import { formatCurrency, getTimeOfDayInfo } from '@/lib/utils/format';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onUpdateOptions: (updates: Partial<CartItemType>) => void;
  onRemove: () => void;
}

const days = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
];

const LUNCH_BREAK_SLOTS = [
  { time: '12:00 PM', label: '12:00 - 12:30 PM', tag: 'Early Lunch / Recess' },
  { time: '12:30 PM', label: '12:30 - 01:00 PM', tag: 'College Break' },
  { time: '01:00 PM', label: '01:00 - 01:30 PM', tag: 'Office Lunch' },
  { time: '01:30 PM', label: '01:30 - 02:00 PM', tag: 'Late Lunch' },
  { time: '07:30 PM', label: '07:30 - 08:30 PM', tag: 'Dinner Break' },
];

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
  const deliveryTime = item.delivery_time || '12:30 PM';

  const [expanded, setExpanded] = useState(subType !== 'one-time');
  const [showCustomTimeInput, setShowCustomTimeInput] = useState(
    !LUNCH_BREAK_SLOTS.some((s) => s.time === deliveryTime) && deliveryTime !== '12:00 PM' && deliveryTime !== '12:30 PM'
  );

  // Parse delivery time into hours, minutes, and AM/PM period
  const parseDeliveryTime = (timeStr: string) => {
    const hasPM = /\bPM\b/i.test(timeStr);
    const hasAM = /\bAM\b/i.test(timeStr);
    const period: 'AM' | 'PM' = hasAM ? 'AM' : 'PM';

    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      let h = parseInt(match[1], 10);
      if (h <= 0 || h > 12) {
        h = h % 12 || 12;
      }
      const hourStr = String(h).padStart(2, '0');
      const minuteStr = match[2];
      return { hour: hourStr, minute: minuteStr, period };
    }
    return { hour: '01', minute: '00', period: 'PM' as 'AM' | 'PM' };
  };

  const parsedTime = parseDeliveryTime(deliveryTime);
  const currentTimeInfo = getTimeOfDayInfo(deliveryTime);

  const COMMON_MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
  const minuteOptions = COMMON_MINUTES.includes(parsedTime.minute)
    ? COMMON_MINUTES
    : [...COMMON_MINUTES, parsedTime.minute].sort();

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

  const updateCustomTime = (newHour: string, newMinute: string, newPeriod: 'AM' | 'PM') => {
    const formatted = `${newHour.padStart(2, '0')}:${newMinute.padStart(2, '0')} ${newPeriod}`;
    onUpdateOptions({ delivery_time: formatted });
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

      {/* Daily Lunch Break Slot Selector (For Students & Workers) */}
      {subType === 'one-time' && (
        <div className="mt-6 pt-6 border-t border-gray-100 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Lunch Break Delivery Slot
                  </h4>
                  <span className="text-[0.6rem] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                    Students & Workers
                  </span>
                </div>
                <p className="text-[0.68rem] text-gray-500 font-medium">
                  Fresh homemade meal delivered on time for your college recess or office break.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCustomTimeInput(!showCustomTimeInput)}
              className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1 self-start sm:self-center"
            >
              <Edit2 className="w-3 h-3" />
              {showCustomTimeInput ? 'Use Quick Slots' : 'Custom Break Time'}
            </button>
          </div>

          {/* Quick Break Slot Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {LUNCH_BREAK_SLOTS.map((slot) => {
              const isSelected = deliveryTime === slot.time && !showCustomTimeInput;
              return (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => {
                    setShowCustomTimeInput(false);
                    onUpdateOptions({ delivery_time: slot.time });
                  }}
                  className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-orange-600 border-orange-600 text-white shadow-md scale-[1.02]'
                      : 'bg-gray-50 border-gray-100 hover:border-orange-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black tracking-tight">{slot.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span
                    className={`text-[0.6rem] font-bold uppercase tracking-wider block ${
                      isSelected ? 'text-orange-100' : 'text-gray-400'
                    }`}
                  >
                    {slot.tag}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Time Selector */}
          {showCustomTimeInput && (
            <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-black text-orange-950 block">
                    Custom Break Time
                  </span>
                  <span className="text-[0.68rem] text-orange-800 font-medium">
                    Set your exact break time with hour, minute and AM / PM:
                  </span>
                </div>
                {/* Visual Period Badge (Morning / Afternoon / Night) */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border self-start sm:self-auto ${currentTimeInfo.badgeClass}`}
                >
                  <span>{currentTimeInfo.icon}</span>
                  <span>{currentTimeInfo.label} Slot</span>
                </div>
              </div>

              {/* Time Controls: Hour : Minute + AM / PM Toggle */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <label htmlFor={`hour-select-${item.meal_id}`} className="sr-only">Hour</label>
                  <select
                    id={`hour-select-${item.meal_id}`}
                    value={parsedTime.hour}
                    onChange={(e) => updateCustomTime(e.target.value, parsedTime.minute, parsedTime.period)}
                    className="bg-transparent text-xs font-black text-gray-900 focus:outline-none cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs font-black text-gray-400">:</span>
                  <label htmlFor={`minute-select-${item.meal_id}`} className="sr-only">Minute</label>
                  <select
                    id={`minute-select-${item.meal_id}`}
                    value={parsedTime.minute}
                    onChange={(e) => updateCustomTime(parsedTime.hour, e.target.value, parsedTime.period)}
                    className="bg-transparent text-xs font-black text-gray-900 focus:outline-none cursor-pointer"
                  >
                    {minuteOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AM / PM Segmented Control */}
                <div className="flex bg-white p-0.5 rounded-xl border border-gray-200 shadow-xs">
                  <button
                    type="button"
                    onClick={() => updateCustomTime(parsedTime.hour, parsedTime.minute, 'AM')}
                    className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      parsedTime.period === 'AM'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCustomTime(parsedTime.hour, parsedTime.minute, 'PM')}
                    className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      parsedTime.period === 'PM'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    PM
                  </button>
                </div>

                {/* Current Selected Value Pill */}
                <span className="text-xs font-black text-orange-600 bg-white px-2.5 py-1.5 rounded-xl border border-orange-200 shadow-xs">
                  {deliveryTime}
                </span>
              </div>

              {/* Contextual Note below explaining whether it's Morning, Afternoon, or Night */}
              <div className="flex items-center gap-2 text-[0.7rem] font-semibold text-orange-950/80 bg-orange-100/70 px-3 py-1.5 rounded-xl border border-orange-200/70">
                <Info className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>
                  <strong>Note:</strong> Delivery is scheduled for the <strong>{currentTimeInfo.label}</strong> ({currentTimeInfo.description}).
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between pt-1 gap-2 text-[0.68rem] text-gray-500">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Target Delivery Slot: <strong className="text-gray-900 font-black">{deliveryTime}</strong></span>
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.62rem] font-black border ${currentTimeInfo.badgeClass}`}>
                <span>{currentTimeInfo.icon}</span>
                <span>{currentTimeInfo.label}</span>
              </span>
            </div>
            <span className="text-gray-400 font-medium">
              Cooked & delivered hot for your {currentTimeInfo.label.toLowerCase()} break
            </span>
          </div>
        </div>
      )}

      {/* Expandable Schedule Area (For Weekly & Monthly Plans) */}
      {subType !== 'one-time' && (
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
                <Clock className="w-4 h-4 text-orange-600" /> Lunch Break Slot
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
            <div className="grid grid-cols-2 gap-1.5">
              {LUNCH_BREAK_SLOTS.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => {
                    setShowCustomTimeInput(false);
                    onUpdateOptions({ delivery_time: slot.time });
                  }}
                  className={`p-2 rounded-xl text-xs font-semibold transition-all border text-left ${
                    deliveryTime === slot.time && !showCustomTimeInput
                      ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-orange-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[0.7rem]">{slot.label}</span>
                    {deliveryTime === slot.time && !showCustomTimeInput && (
                      <Check className="w-3 h-3 stroke-[3]" />
                    )}
                  </div>
                  <span className={`text-[0.55rem] block uppercase font-bold ${
                    deliveryTime === slot.time && !showCustomTimeInput ? 'text-orange-100' : 'text-gray-400'
                  }`}>
                    {slot.tag}
                  </span>
                </button>
              ))}
            </div>

            {/* Editable Custom Time Input */}
            {showCustomTimeInput && (
              <div className="p-3 bg-orange-50/60 border border-orange-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-900">
                    Custom Slot
                  </span>
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.62rem] font-black border ${currentTimeInfo.badgeClass}`}
                  >
                    <span>{currentTimeInfo.icon}</span>
                    <span>{currentTimeInfo.label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1 shadow-xs flex-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <select
                      value={parsedTime.hour}
                      onChange={(e) => updateCustomTime(e.target.value, parsedTime.minute, parsedTime.period)}
                      className="bg-transparent text-xs font-black text-gray-900 focus:outline-none cursor-pointer flex-1"
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs font-black text-gray-400">:</span>
                    <select
                      value={parsedTime.minute}
                      onChange={(e) => updateCustomTime(parsedTime.hour, e.target.value, parsedTime.period)}
                      className="bg-transparent text-xs font-black text-gray-900 focus:outline-none cursor-pointer flex-1"
                    >
                      {minuteOptions.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* AM / PM Segmented Control */}
                  <div className="flex bg-white p-0.5 rounded-xl border border-gray-200 shadow-xs">
                    <button
                      type="button"
                      onClick={() => updateCustomTime(parsedTime.hour, parsedTime.minute, 'AM')}
                      className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        parsedTime.period === 'AM'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCustomTime(parsedTime.hour, parsedTime.minute, 'PM')}
                      className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        parsedTime.period === 'PM'
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>

                {/* Contextual Note */}
                <div className="text-[0.68rem] font-semibold text-orange-950/80 bg-orange-100/70 px-2.5 py-1 rounded-xl border border-orange-200/70">
                  Note: Scheduled for <strong>{currentTimeInfo.label}</strong> ({currentTimeInfo.description})
                </div>
              </div>
            )}

            {/* Notice */}
            <div className="flex items-start gap-1.5 pt-1 text-xs text-gray-500">
              <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
              <span>
                <strong>2-Hour Rule:</strong> You can edit break slot anytime up to 2 hours before delivery.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
