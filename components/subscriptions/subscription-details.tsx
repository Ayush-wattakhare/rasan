'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import {
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  Sparkles,
  Coffee,
  RotateCcw,
  MapPin,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Check,
  ShieldCheck,
  CalendarDays,
  ListFilter,
  Flame,
} from 'lucide-react';
import { EditSubscriptionTimeModal } from './edit-subscription-time-modal';
import { useRouter } from 'next/navigation';

interface SubscriptionDetailsProps {
  subscription: any;
  onClose: () => void;
  onUpdate?: () => void;
}

const PRESET_MEALS = [
  {
    id: 'standard',
    title: 'Standard Homestyle Thali',
    desc: '2 Seasonal Sabzis, 4 Phulkas, Dal Tadka, Steamed Rice & Salad',
    badge: 'Popular',
    tag: 'Ghar Ka Khana',
  },
  {
    id: 'paneer_protein',
    title: 'High-Protein Paneer Thali',
    desc: 'Paneer Bhurji / Matar Paneer, 4 Multigrain Rotis, Moong Dal, Sprout Salad',
    badge: 'High Protein',
    tag: '+Fitness',
  },
  {
    id: 'light_detox',
    title: 'Light Detox Khichdi & Kadhi',
    desc: 'Moong Dal Khichdi, Gujarati/Rajasthani Kadhi, Roasted Papad & Curd',
    badge: 'Easy Digest',
    tag: 'Low Oil',
  },
  {
    id: 'regional_special',
    title: 'Maharashtrian Puran Poli Special',
    desc: '2 Sweet Puran Polis, Katachi Amti, Rice, Batata Bhaji & Lemon',
    badge: "Chef's Special",
    tag: 'Authentic Regional',
  },
];

export default function SubscriptionDetails({
  subscription: initialSubscription,
  onClose,
  onUpdate,
}: SubscriptionDetailsProps) {
  const [subscription, setSubscription] = useState(initialSubscription);
  const [showEditTime, setShowEditTime] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState(
    initialSubscription.delivery_time || '12:00 PM'
  );
  const [actionLoadingDate, setActionLoadingDate] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Address redirect modal state
  const [addressModalDate, setAddressModalDate] = useState<string | null>(null);
  const [redirectAddress, setRedirectAddress] = useState({
    street: '',
    city: 'Pune',
    state: 'Maharashtra',
    zip_code: '411027',
  });
  const [addressLoading, setAddressLoading] = useState(false);

  // Meal swap modal state
  const [swapModalDate, setSwapModalDate] = useState<string | null>(null);
  const [selectedMealTitle, setSelectedMealTitle] = useState(PRESET_MEALS[0].title);
  const [customDietaryNotes, setCustomDietaryNotes] = useState('');
  const [swapLoading, setSwapLoading] = useState(false);

  // View state: 'calendar' vs 'list'
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Month navigation for visual calendar
  const initialMonth = initialSubscription.start_date
    ? new Date(initialSubscription.start_date)
    : new Date();
  const [currentMonth, setCurrentMonth] = useState<Date>(initialMonth);

  const router = useRouter();

  // If subscription has no deliveries, synthesize them for presentation
  const rawDeliveries: any[] = useMemo(() => {
    if (subscription.deliveries && subscription.deliveries.length > 0) {
      return subscription.deliveries;
    }
    // Fallback: create next 14 weekdays
    const days = [];
    const now = new Date();
    for (let i = 0; i < 20; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        days.push({
          date: d.toISOString().split('T')[0],
          status: 'scheduled',
          order_id: null,
        });
      }
    }
    return days;
  }, [subscription.deliveries]);

  // Map deliveries by date string for O(1) calendar lookups
  const deliveriesMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const d of rawDeliveries) {
      map.set(d.date, d);
    }
    return map;
  }, [rawDeliveries]);

  // Selected date on calendar (defaults to today or first upcoming delivery)
  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const upcoming = rawDeliveries.find((d) => d.date >= todayStr && d.status === 'scheduled');
    return upcoming ? upcoming.date : (rawDeliveries[0]?.date || todayStr);
  });

  const selectedDelivery = deliveriesMap.get(selectedDate);

  // Statistics
  const totalDeliveries = rawDeliveries.length;
  const skippedCount = rawDeliveries.filter((d) => d.status === 'skipped').length;
  const completedCount = rawDeliveries.filter((d) => d.status === 'delivered').length;
  const scheduledCount = rawDeliveries.filter((d) => d.status === 'scheduled').length;

  const isCutoffPassed = (deliveryDate: string) => {
    const now = new Date();
    if (deliveryDate < todayStr) return true; // Past date
    if (deliveryDate > todayStr) return false; // Upcoming future date

    // Today's delivery: check cutoff hour (IST)
    const istHour = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false,
      }).format(now)
    );

    const mealType = (subscription.meal_type || '').toLowerCase();
    const deliveryTimeStr = (subscription.delivery_time || '').toLowerCase();
    const isDinner =
      mealType.includes('dinner') ||
      (deliveryTimeStr.includes('pm') &&
        parseInt(deliveryTimeStr) >= 6 &&
        parseInt(deliveryTimeStr) <= 11);

    // Lunch cutoff: 8:00 AM (8), Dinner cutoff: 3:00 PM (15)
    const cutoffHour = isDinner ? 15 : 8;
    return istHour >= cutoffHour;
  };

  const handleSkipDay = async (date: string) => {
    setActionLoadingDate(date);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}/skip-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to mark off-day');
      }

      setSubscription(data.subscription);
      setActionMessage({
        type: 'success',
        text: `Off-day registered for ${date}. Subscription extended to ${data.extendedDate}!`,
      });
      router.refresh();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Could not mark off-day' });
    } finally {
      setActionLoadingDate(null);
    }
  };

  const handleUnskipDay = async (date: string) => {
    setActionLoadingDate(date);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}/unskip-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resume delivery');
      }

      setSubscription(data.subscription);
      setActionMessage({
        type: 'success',
        text: `Delivery resumed for ${date}!`,
      });
      router.refresh();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Could not resume delivery' });
    } finally {
      setActionLoadingDate(null);
    }
  };

  const handleSaveRedirectAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressModalDate) return;

    setAddressLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch(
        `/api/subscriptions/${subscription.id}/change-delivery-address`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: addressModalDate,
            address: redirectAddress,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update address');
      }

      setSubscription(data.subscription);
      setActionMessage({
        type: 'success',
        text: `Meal for ${addressModalDate} will be delivered to: ${redirectAddress.street}!`,
      });
      setAddressModalDate(null);
      router.refresh();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Could not update address' });
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSaveMealSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapModalDate) return;

    setSwapLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}/swap-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: swapModalDate,
          mealTitle: selectedMealTitle,
          dietaryNotes: customDietaryNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to customize meal');
      }

      setSubscription(data.subscription);
      setActionMessage({
        type: 'success',
        text: `Meal customized to "${selectedMealTitle}" for ${swapModalDate}!`,
      });
      setSwapModalDate(null);
      router.refresh();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Could not customize meal' });
    } finally {
      setSwapLoading(false);
    }
  };

  // Calendar days grid computation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  return (
    <>
      <EditSubscriptionTimeModal
        isOpen={showEditTime}
        onClose={() => setShowEditTime(false)}
        subscriptionId={subscription.id}
        currentDeliveryTime={deliveryTime}
        planType={subscription.plan_type}
        onSuccess={(newTime) => {
          setDeliveryTime(newTime);
          if (onUpdate) onUpdate();
        }}
      />

      {/* Single-Day Address Redirect Modal */}
      {addressModalDate && (
        <Dialog open={!!addressModalDate} onOpenChange={() => setAddressModalDate(null)}>
          <DialogContent className="max-w-md rounded-3xl p-6 bg-white border border-gray-100 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                Change Delivery Address
              </DialogTitle>
              <p className="text-xs text-gray-500">
                Single-day delivery redirect for{' '}
                <span className="font-bold text-gray-800">
                  {format(new Date(addressModalDate), 'EEEE, MMM dd')}
                </span>
              </p>
            </DialogHeader>

            <form onSubmit={handleSaveRedirectAddress} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="street" className="text-xs font-bold uppercase text-gray-500">
                  Street / Building / Office Address
                </Label>
                <Input
                  id="street"
                  required
                  placeholder="e.g. Infosys Campus, Phase 2, Hinjewadi"
                  value={redirectAddress.street}
                  onChange={(e) =>
                    setRedirectAddress({ ...redirectAddress, street: e.target.value })
                  }
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="city" className="text-[0.65rem] font-bold uppercase text-gray-500">
                    City
                  </Label>
                  <Input
                    id="city"
                    required
                    value={redirectAddress.city}
                    onChange={(e) =>
                      setRedirectAddress({ ...redirectAddress, city: e.target.value })
                    }
                    className="rounded-xl border-gray-200 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="zip" className="text-[0.65rem] font-bold uppercase text-gray-500">
                    PIN Code
                  </Label>
                  <Input
                    id="zip"
                    required
                    value={redirectAddress.zip_code}
                    onChange={(e) =>
                      setRedirectAddress({ ...redirectAddress, zip_code: e.target.value })
                    }
                    className="rounded-xl border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddressModalDate(null)}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addressLoading}
                  className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  {addressLoading ? 'Saving...' : 'Update Address'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Meal Swap & Dietary Customization Modal */}
      {swapModalDate && (
        <Dialog open={!!swapModalDate} onOpenChange={() => setSwapModalDate(null)}>
          <DialogContent className="max-w-lg rounded-3xl p-6 bg-white border border-gray-100 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-600" />
                Customize Meal for {format(new Date(swapModalDate), 'EEE, MMM dd')}
              </DialogTitle>
              <p className="text-xs text-gray-500">
                Choose what your home chef prepares for this delivery cycle date.
              </p>
            </DialogHeader>

            <form onSubmit={handleSaveMealSwap} className="space-y-4 pt-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500">
                  Select Meal Variant
                </Label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {PRESET_MEALS.map((meal) => {
                    const isSelected = selectedMealTitle === meal.title;
                    return (
                      <div
                        key={meal.id}
                        onClick={() => setSelectedMealTitle(meal.title)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/60 shadow-xs ring-2 ring-orange-500/20'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-gray-900">{meal.title}</h4>
                            <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 uppercase">
                              {meal.badge}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-snug">{meal.desc}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'border-orange-600 bg-orange-600 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Label htmlFor="dietary_notes" className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Special Instructions / Dietary Notes (Optional)
                </Label>
                <Input
                  id="dietary_notes"
                  placeholder="e.g., Less oil, Jain / no onion-garlic, mild spice"
                  value={customDietaryNotes}
                  onChange={(e) => setCustomDietaryNotes(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSwapModalDate(null)}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={swapLoading}
                  className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  {swapLoading ? 'Saving...' : 'Confirm Meal'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Main Details Dialog */}
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-[2.5rem] p-5 md:p-8 bg-[#FAFAF9]">
          <DialogHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-orange-600 text-white text-[0.65rem] font-black uppercase tracking-wider">
                    Interactive Tiffin Calendar
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[0.65rem] font-black uppercase">
                    ● {subscription.status}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase italic">
                  {subscription.vendors?.business_name || 'Home Chef Tiffin'}
                </DialogTitle>
                <p className="text-xs text-gray-500 font-medium">
                  {subscription.plan_type?.toUpperCase()} PLAN • {deliveryTime} • {subscription.meal_type?.toUpperCase()}
                </p>
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-gray-200/80 p-1 rounded-2xl self-start md:self-center">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewMode('calendar')}
                  className={`h-9 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    viewMode === 'calendar'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5 mr-1.5" /> Calendar View
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewMode('list')}
                  className={`h-9 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5 mr-1.5" /> Cycle List
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Feedback message banner */}
          {actionMessage && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-in fade-in ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {actionMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              {actionMessage.text}
            </div>
          )}

          {/* Metrics Overview Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-1">
              <span className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">
                Cycle Meals
              </span>
              <div className="text-xl font-black text-gray-900 tracking-tight">
                {totalDeliveries} <span className="text-xs text-gray-400 font-bold">Portions</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-1">
              <span className="text-[0.65rem] font-black uppercase tracking-widest text-emerald-600">
                Scheduled Active
              </span>
              <div className="text-xl font-black text-emerald-700 tracking-tight">
                {scheduledCount} <span className="text-xs text-emerald-500 font-bold">Upcoming</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-1">
              <span className="text-[0.65rem] font-black uppercase tracking-widest text-purple-600">
                Off-Days Saved
              </span>
              <div className="text-xl font-black text-purple-700 tracking-tight">
                {skippedCount} <span className="text-xs text-purple-500 font-bold">+1 Rollovers</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-1">
              <span className="text-[0.65rem] font-black uppercase tracking-widest text-blue-600">
                Delivered Meals
              </span>
              <div className="text-xl font-black text-blue-700 tracking-tight">
                {completedCount} <span className="text-xs text-blue-500 font-bold">Fulfilled</span>
              </div>
            </div>
          </div>

          {/* Off-Day & 100% Rollover Value Banner */}
          <div className="bg-gradient-to-r from-purple-50 via-amber-50 to-orange-50 border border-purple-200/80 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Coffee className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-black text-gray-900 text-sm">
                    100% Meal Protection & Smart Carry-Over
                  </span>
                  {skippedCount > 0 && (
                    <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full text-[0.65rem]">
                      {skippedCount} replacement meal(s) added
                    </span>
                  )}
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Going out of town or having an office lunch? Tap any scheduled day in the calendar to take an <strong className="text-purple-900">Off-Day</strong>. Your subscription auto-extends by <strong className="text-orange-700">+1 Day</strong> so your money is always safe!
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[0.65rem] font-bold text-gray-600 border-t border-purple-100/80">
              <span className="bg-white px-2 py-0.5 rounded-md border border-purple-200 text-purple-800">
                ⏱️ Lunch Cutoff: 8:00 AM IST
              </span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-purple-200 text-purple-800">
                ⏱️ Dinner Cutoff: 3:00 PM IST
              </span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                🔄 Auto-Extends Plan End Date
              </span>
            </div>
          </div>

          {/* CALENDAR VIEW */}
          {viewMode === 'calendar' ? (
            <div className="space-y-6">
              {/* Calendar Container */}
              <div className="bg-white rounded-3xl p-5 md:p-6 border border-gray-100 shadow-sm space-y-4">
                {/* Month Controls */}
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-black text-gray-900 tracking-tight uppercase flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-orange-600" />
                    {format(currentMonth, 'MMMM yyyy')}
                  </h3>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="h-8 w-8 p-0 rounded-xl border-gray-200 text-gray-700 hover:text-orange-600"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentMonth(new Date())}
                      className="h-8 px-2.5 rounded-xl border-gray-200 text-xs font-bold text-gray-700 hover:text-orange-600"
                    >
                      Today
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="h-8 w-8 p-0 rounded-xl border-gray-200 text-gray-700 hover:text-orange-600"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Day-of-week header */}
                <div className="grid grid-cols-7 gap-1 md:gap-2 text-center">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <div
                      key={d}
                      className="text-[0.65rem] font-black uppercase text-gray-400 py-1"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                  {calendarDays.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const delivery = deliveriesMap.get(dateStr);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = selectedDate === dateStr;

                    const isScheduled = delivery?.status === 'scheduled';
                    const isSkipped = delivery?.status === 'skipped';
                    const isDelivered = delivery?.status === 'delivered';
                    const isExtended = delivery?.is_extended;
                    const hasOverride = delivery?.meal_override;
                    const hasAddressRedirect = delivery?.address_override;

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedDate(dateStr)}
                        disabled={!delivery}
                        className={`min-h-[72px] md:min-h-[84px] p-1.5 md:p-2 rounded-2xl border text-left flex flex-col justify-between transition-all relative cursor-pointer ${
                          !isCurrentMonth
                            ? 'opacity-30 bg-gray-50 border-transparent'
                            : !delivery
                            ? 'bg-gray-50/50 border-gray-100 opacity-60 cursor-default'
                            : isSelected
                            ? 'bg-orange-50/90 border-orange-500 ring-2 ring-orange-500/20 shadow-md'
                            : isSkipped
                            ? 'bg-purple-50/70 border-purple-200 hover:border-purple-300'
                            : isExtended
                            ? 'bg-amber-50/70 border-amber-200 hover:border-amber-300'
                            : isDelivered
                            ? 'bg-green-50/70 border-green-200 hover:border-green-300'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs'
                        }`}
                      >
                        {/* Day Number and Today Indicator */}
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs md:text-sm font-black ${
                              isToday
                                ? 'w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center -ml-0.5 -mt-0.5 shadow-xs'
                                : isSelected
                                ? 'text-orange-900'
                                : 'text-gray-800'
                            }`}
                          >
                            {format(day, 'd')}
                          </span>

                          {/* Quick miniature badge */}
                          {isSkipped && (
                            <span className="text-[0.65rem]" title="Off-Day (Saved)">
                              🌙
                            </span>
                          )}
                          {isDelivered && (
                            <span className="text-[0.65rem]" title="Delivered">
                              ✅
                            </span>
                          )}
                          {isScheduled && !isExtended && (
                            <span className="text-[0.65rem]" title="Scheduled Meal">
                              🍱
                            </span>
                          )}
                          {isExtended && (
                            <span className="text-[0.65rem]" title="Extended Meal">
                              🔄
                            </span>
                          )}
                        </div>

                        {/* Status label / badges on day */}
                        <div className="w-full space-y-0.5">
                          {isScheduled && (
                            <div className="w-full">
                              <span
                                className={`block truncate text-[0.55rem] md:text-[0.6rem] font-bold px-1 py-0.2 rounded ${
                                  isExtended
                                    ? 'bg-amber-100 text-amber-800'
                                    : hasOverride
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-orange-100/80 text-orange-800'
                                }`}
                              >
                                {hasOverride ? '🥗 Swap' : isExtended ? '+1 Day' : 'Lunch'}
                              </span>
                            </div>
                          )}

                          {isSkipped && (
                            <span className="block truncate text-[0.55rem] font-bold px-1 py-0.2 rounded bg-purple-100 text-purple-800">
                              Off-Day
                            </span>
                          )}

                          {hasAddressRedirect && (
                            <span className="text-[0.55rem] text-blue-600 flex items-center gap-0.5 font-bold">
                              <MapPin className="w-2.5 h-2.5" /> Office
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Calendar Legend */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-[0.65rem] font-bold text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Active Scheduled
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Off-Day (Carry Over)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> +1 Extended Meal
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Swapped / Customized
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Office Redirect
                  </span>
                </div>
              </div>

              {/* Selected Day Control Deck */}
              {selectedDelivery ? (
                <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-orange-200/80 shadow-md space-y-5 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                    <div className="space-y-1">
                      <span className="text-[0.65rem] font-black uppercase tracking-wider text-orange-600">
                        Selected Date Operations
                      </span>
                      <h4 className="text-xl font-black text-gray-900 tracking-tight">
                        {format(new Date(selectedDate), 'EEEE, MMMM dd, yyyy')}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedDelivery.status === 'scheduled' && (
                        <Badge className="bg-emerald-100 text-emerald-800 text-xs font-bold uppercase">
                          ● Scheduled Delivery
                        </Badge>
                      )}
                      {selectedDelivery.status === 'skipped' && (
                        <Badge className="bg-purple-100 text-purple-800 text-xs font-bold uppercase">
                          🌙 Off-Day Active
                        </Badge>
                      )}
                      {selectedDelivery.status === 'delivered' && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs font-bold uppercase">
                          ✅ Delivered
                        </Badge>
                      )}
                      {selectedDelivery.is_extended && (
                        <Badge className="bg-amber-100 text-amber-800 text-xs font-bold uppercase">
                          🔄 Rollover Replacement
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Delivery details cards for selected date */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Meal Item Info */}
                    <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.65rem] font-black uppercase tracking-widest text-orange-600">
                          Meal Variant
                        </span>
                        <Utensils className="w-3.5 h-3.5 text-orange-600" />
                      </div>
                      <p className="text-sm font-black text-gray-900">
                        {selectedDelivery.meal_override?.meal_title ||
                          `${subscription.vendors?.business_name || 'Chef'} Homestyle Thali`}
                      </p>
                      {selectedDelivery.meal_override?.dietary_notes && (
                        <p className="text-xs text-orange-700 font-bold bg-white/80 px-2 py-1 rounded-lg border border-orange-200/60">
                          Note: {selectedDelivery.meal_override.dietary_notes}
                        </p>
                      )}
                    </div>

                    {/* Slot & Time */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">
                          Delivery Window
                        </span>
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <p className="text-sm font-black text-gray-900">{deliveryTime}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {subscription.meal_type || 'Lunch'} Session
                      </p>
                    </div>

                    {/* Delivery Destination */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">
                          Drop Location
                        </span>
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <p className="text-xs font-bold text-gray-900 line-clamp-2">
                        {selectedDelivery.address_override?.street ||
                          subscription.address?.street ||
                          'Home Address on Profile'}
                      </p>
                      {selectedDelivery.address_override && (
                        <span className="text-[0.6rem] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                          Redirected Address
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cutoff Status notice */}
                  {selectedDelivery.status === 'scheduled' && (
                    <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200/80 rounded-2xl px-4 py-3 text-xs">
                      <div className="flex items-center gap-2 text-amber-800 font-bold">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          {isCutoffPassed(selectedDate)
                            ? 'Cutoff passed for this date. The kitchen has started batch preparation.'
                            : 'Cutoff open. You can skip, swap meals, or redirect address until 8:00 AM IST.'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons for Selected Date */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {/* Off-Day & Resume Actions */}
                    {selectedDelivery.status === 'scheduled' && (
                      <>
                        {isCutoffPassed(selectedDate) ? (
                          <div className="bg-gray-100 text-gray-500 font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-500" />
                            Locked (Batch Cooking Underway)
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleSkipDay(selectedDate)}
                            disabled={actionLoadingDate === selectedDate}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-wider text-xs h-11 px-5 rounded-xl shadow-md shadow-purple-600/20 cursor-pointer"
                          >
                            {actionLoadingDate === selectedDate ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Coffee className="w-4 h-4 mr-2" />
                            )}
                            Take Off-Day (Carry Over +1 Day)
                          </Button>
                        )}

                        {!isCutoffPassed(selectedDate) && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSwapModalDate(selectedDate);
                              setSelectedMealTitle(
                                selectedDelivery.meal_override?.meal_title || PRESET_MEALS[0].title
                              );
                              setCustomDietaryNotes(
                                selectedDelivery.meal_override?.dietary_notes || ''
                              );
                            }}
                            className="border-orange-300 text-orange-950 hover:bg-orange-50 font-bold text-xs h-11 px-4 rounded-xl cursor-pointer"
                          >
                            <Utensils className="w-4 h-4 text-orange-600 mr-2" />
                            Swap Dish / Special Notes
                          </Button>
                        )}

                        {!isCutoffPassed(selectedDate) && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAddressModalDate(selectedDate);
                              setRedirectAddress({
                                street:
                                  selectedDelivery.address_override?.street ||
                                  subscription.address?.street ||
                                  '',
                                city:
                                  selectedDelivery.address_override?.city ||
                                  subscription.address?.city ||
                                  'Pune',
                                state:
                                  selectedDelivery.address_override?.state ||
                                  subscription.address?.state ||
                                  'Maharashtra',
                                zip_code:
                                  selectedDelivery.address_override?.zip_code ||
                                  subscription.address?.zip_code ||
                                  '411027',
                              });
                            }}
                            className="border-gray-200 text-gray-700 hover:text-orange-600 font-bold text-xs h-11 px-4 rounded-xl cursor-pointer"
                          >
                            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                            1-Day Address Redirect
                          </Button>
                        )}
                      </>
                    )}

                    {selectedDelivery.status === 'skipped' && (
                      <Button
                        onClick={() => handleUnskipDay(selectedDate)}
                        disabled={actionLoadingDate === selectedDate}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-xs h-11 px-5 rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
                      >
                        {actionLoadingDate === selectedDate ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <RotateCcw className="w-4 h-4 mr-2" />
                        )}
                        Resume Meal Delivery
                      </Button>
                    )}

                    {selectedDelivery.status === 'delivered' && (
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-200">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        Delivered & Fulfilled on {format(new Date(selectedDate), 'MMM dd')}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-white rounded-3xl border border-gray-100 text-gray-400 text-xs font-bold">
                  Tap any day in the calendar to view meal details or customize delivery.
                </div>
              )}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-orange-600" />
                  Sequential Schedule List ({rawDeliveries.length} cycles)
                </h3>
                <span className="text-[0.65rem] font-bold text-gray-400">
                  Tap any day to customize
                </span>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {rawDeliveries.map((delivery: any, index: number) => {
                  const isUpcoming = delivery.status === 'scheduled';
                  const isSkipped = delivery.status === 'skipped';
                  const isPast = delivery.status === 'delivered';
                  const isActionLoading = actionLoadingDate === delivery.date;

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSkipped
                          ? 'bg-purple-50/60 border-purple-200'
                          : delivery.is_extended
                          ? 'bg-orange-50/40 border-orange-200'
                          : 'bg-white border-gray-100 shadow-xs hover:border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Date and info */}
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {isPast ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            ) : isSkipped ? (
                              <Coffee className="h-4 w-4 text-purple-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-orange-600" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-black text-gray-900">
                                {format(new Date(delivery.date), 'EEEE, MMM dd, yyyy')}
                              </p>
                              {delivery.is_extended && (
                                <span className="bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full text-[0.6rem] uppercase">
                                  +1 Day Extended Meal
                                </span>
                              )}
                              {delivery.meal_override && (
                                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[0.6rem] uppercase">
                                  🥗 {delivery.meal_override.meal_title}
                                </span>
                              )}
                            </div>

                            {isSkipped && (
                              <p className="text-xs font-bold text-purple-700 flex items-center gap-1">
                                <span>🌙 Marked as Off-Day</span>
                                <span className="text-gray-400 font-normal">
                                  (Replacement meal added to end of plan)
                                </span>
                              </p>
                            )}

                            {delivery.address_override && (
                              <p className="text-xs text-orange-700 font-bold flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Redirected: {delivery.address_override.street}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isUpcoming && subscription.status === 'active' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isActionLoading}
                                onClick={() => {
                                  setSwapModalDate(delivery.date);
                                  setSelectedMealTitle(
                                    delivery.meal_override?.meal_title || PRESET_MEALS[0].title
                                  );
                                  setCustomDietaryNotes(
                                    delivery.meal_override?.dietary_notes || ''
                                  );
                                }}
                                className="h-8 px-2.5 text-[0.65rem] font-bold rounded-xl border-orange-200 text-orange-900 hover:bg-orange-50"
                              >
                                <Utensils className="w-3 h-3 mr-1 text-orange-600" />
                                Swap Dish
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isActionLoading}
                                onClick={() => {
                                  setAddressModalDate(delivery.date);
                                  setRedirectAddress({
                                    street: delivery.address_override?.street || subscription.address?.street || '',
                                    city: delivery.address_override?.city || subscription.address?.city || 'Pune',
                                    state: delivery.address_override?.state || subscription.address?.state || 'Maharashtra',
                                    zip_code: delivery.address_override?.zip_code || subscription.address?.zip_code || '411027',
                                  });
                                }}
                                className="h-8 px-2.5 text-[0.65rem] font-bold rounded-xl border-gray-200 text-gray-700 hover:text-orange-600 hover:border-orange-200"
                              >
                                <MapPin className="w-3 h-3 mr-1" />
                                Redirect
                              </Button>

                              {isCutoffPassed(delivery.date) ? (
                                <span
                                  className="text-[0.65rem] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 rounded-xl flex items-center gap-1"
                                  title="Cutoff has passed. Kitchen is currently preparing fresh food."
                                >
                                  🍳 Cooking
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled={isActionLoading}
                                  onClick={() => handleSkipDay(delivery.date)}
                                  className="h-8 px-3 text-[0.65rem] font-black uppercase rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer"
                                >
                                  {isActionLoading ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <Coffee className="w-3 h-3 mr-1" />
                                  )}
                                  Take Off-Day
                                </Button>
                              )}
                            </>
                          )}

                          {isSkipped && subscription.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isActionLoading}
                              onClick={() => handleUnskipDay(delivery.date)}
                              className="h-8 px-3 text-[0.65rem] font-black uppercase rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50"
                            >
                              {isActionLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <RotateCcw className="w-3 h-3 mr-1" />
                              )}
                              Resume Meal
                            </Button>
                          )}

                          {isPast && (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[0.65rem] font-bold uppercase">
                              Delivered
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Plan Settings Bar */}
          <div className="pt-4 border-t border-gray-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-500">Plan Slot:</span>
              <span className="font-black text-orange-600">{deliveryTime}</span>
              {subscription.status === 'active' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditTime(true)}
                  className="h-7 px-2.5 text-[0.65rem] font-bold text-gray-700 rounded-lg border-gray-200"
                >
                  <Edit2 className="w-2.5 h-2.5 mr-1" /> Change Slot
                </Button>
              )}
            </div>

            <div className="text-gray-400 font-bold text-[0.7rem]">
              Cycle Ends: {subscription.end_date ? format(new Date(subscription.end_date), 'MMMM dd, yyyy') : 'Active'}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
