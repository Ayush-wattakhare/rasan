'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Plus,
  X,
  MapPin,
  Clock as ClockIcon,
  ChefHat,
  Check,
  Calendar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import PlanSelector from './plan-selector';
import WorkingDaysSelector from './working-days-selector';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { calculateSubscriptionPricing } from '@/lib/pricing/subscription-pricing';

interface CreateSubscriptionDialogProps {
  vendors: any[];
  planPricing: any[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultPlanType?: 'daily' | 'weekly' | 'monthly';
  triggerButton?: React.ReactNode;
}

const getCalculatedDates = (planType: string, customStartDate?: string) => {
  const start = customStartDate ? new Date(customStartDate) : new Date();
  if (!customStartDate) {
    start.setDate(start.getDate() + 1); // Starts tomorrow
  }
  const startDateStr = start.toISOString().split('T')[0];

  const end = new Date(start);
  if (planType === 'weekly') {
    end.setDate(end.getDate() + 7);
  } else if (planType === 'monthly') {
    end.setDate(end.getDate() + 30);
  } else {
    end.setDate(end.getDate() + 1);
  }
  const endDateStr = end.toISOString().split('T')[0];

  return { startDate: startDateStr, endDate: endDateStr };
};

export default function CreateSubscriptionDialog({
  vendors,
  planPricing,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  defaultPlanType = 'weekly',
  triggerButton,
}: CreateSubscriptionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? (externalOnOpenChange || (() => {})) : setInternalOpen;

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const initialDates = getCalculatedDates(defaultPlanType);

  const [formData, setFormData] = useState({
    vendor_id: vendors[0]?.id || '',
    plan_type: defaultPlanType as 'daily' | 'weekly' | 'monthly',
    meal_type: 'lunch',
    start_date: initialDates.startDate,
    end_date: initialDates.endDate,
    delivery_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    delivery_time: '13:00',
    address: {
      street: '',
      city: 'Pune',
      state: 'Maharashtra',
      zip_code: '411027',
      coordinates: { lat: 18.5987, lng: 73.7978 },
    },
    auto_renew: false,
  });

  useEffect(() => {
    if (defaultPlanType) {
      const dates = getCalculatedDates(defaultPlanType);
      setFormData((prev) => ({
        ...prev,
        plan_type: defaultPlanType as 'daily' | 'weekly' | 'monthly',
        start_date: dates.startDate,
        end_date: dates.endDate,
        vendor_id: prev.vendor_id || vendors[0]?.id || '',
      }));
    }
  }, [defaultPlanType, vendors]);

  const pricingDetails = calculateSubscriptionPricing(
    formData.plan_type,
    formData.meal_type,
    formData.delivery_days.length
  );
  const currentPrice = pricingDetails.finalPrice;

  const handlePlanChange = (newPlanType: string, newMealType: string) => {
    const dates = getCalculatedDates(newPlanType, formData.start_date);
    setFormData((prev) => ({
      ...prev,
      plan_type: newPlanType as 'daily' | 'weekly' | 'monthly',
      meal_type: newMealType,
      end_date: dates.endDate,
    }));
  };

  const handleStartDateChange = (newStartDate: string) => {
    const dates = getCalculatedDates(formData.plan_type, newStartDate);
    setFormData((prev) => ({
      ...prev,
      start_date: newStartDate,
      end_date: dates.endDate,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (!formData.vendor_id) {
      setErrorMessage('Please select a Master Chef kitchen');
      setIsLoading(false);
      return;
    }

    if (!formData.delivery_days || formData.delivery_days.length === 0) {
      setErrorMessage('Please select at least one delivery day');
      setIsLoading(false);
      return;
    }

    if (!formData.address.street) {
      setErrorMessage('Please enter your delivery street address');
      setIsLoading(false);
      return;
    }

    try {
      // The server computes the price and plan dates itself.
      const payload = { ...formData };

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      setOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      setErrorMessage(error.message || 'Failed to create subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedVendor = vendors.find((v) => v.id === formData.vendor_id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {triggerButton || (
            <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all">
              <Plus className="h-4 w-4 mr-2" />
              Craft New Plan
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border border-gray-100 bg-white rounded-3xl shadow-2xl">
        {/* Clean, Inviting Header */}
        <div className="bg-gradient-to-r from-orange-50 via-white to-amber-50/40 p-6 sm:p-8 border-b border-gray-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Healthy Homemade Tiffin Service</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Customize Your Meal Plan
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Choose your preferred home chef, meal schedule, and delivery details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* Student & Worker Flexi-Promise Guarantee Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
            <span className="text-2xl leading-none mt-0.5">🎓</span>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-black text-gray-900 text-sm">
                  Student & Office Worker Flexi-Promise
                </span>
                <span className="bg-orange-100 text-orange-800 text-[0.6rem] font-bold px-2 py-0.5 rounded-full uppercase">
                  100% Carry Forward
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Going home for weekends or having an office party? <strong>Skipped off-days never expire!</strong> Every skipped meal automatically extends your subscription end date by 1 day so you never lose your money. (Skip before 8:00 AM for lunch, 3:00 PM for dinner).
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Choose Home Chef */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-800">
                1. Choose Your Home Chef / Kitchen
              </label>
              <span className="text-xs text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 border border-green-200">
                <ShieldCheck className="w-3 h-3" /> FSSAI Verified
              </span>
            </div>

            <Select
              value={formData.vendor_id}
              onValueChange={(val) => setFormData({ ...formData, vendor_id: val })}
            >
              <SelectTrigger className="h-14 px-4 rounded-xl border-gray-200 bg-gray-50/50 hover:bg-white text-gray-900 font-medium text-base shadow-xs focus:ring-2 focus:ring-orange-500">
                <SelectValue placeholder="Select a Home Chef Kitchen..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-gray-200 shadow-xl bg-white p-2">
                {vendors.map((vendor) => (
                  <SelectItem
                    key={vendor.id}
                    value={vendor.id}
                    className="p-3 rounded-xl hover:bg-orange-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-base">
                          👨‍🍳
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {vendor.business_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {vendor.cuisine || 'North & South Indian Homely Food'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                        {vendor.rating?.toFixed(1) || '4.8'} ★
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section 2: Meal Preference & Plan Duration */}
          <PlanSelector
            planPricing={planPricing}
            selectedPlanType={formData.plan_type}
            selectedMealType={formData.meal_type}
            deliveryDaysCount={formData.delivery_days.length}
            onPlanChange={handlePlanChange}
          />

          {/* Section 3: Delivery Days */}
          <WorkingDaysSelector
            selectedDays={formData.delivery_days}
            onDaysChange={(days) => setFormData({ ...formData, delivery_days: days })}
          />

          {/* Section 4: Delivery Time & Dates */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <label className="text-sm font-semibold text-gray-800 block">
              4. Delivery Timing & Dates
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Delivery Time */}
              <div className="space-y-2">
                <Label htmlFor="delivery_time" className="text-xs text-gray-600 font-medium">
                  Preferred Delivery Time
                </Label>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {[
                    { label: '12:00 PM', value: '12:00' },
                    { label: '01:00 PM', value: '13:00' },
                    { label: '08:00 PM', value: '20:00' },
                  ].map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, delivery_time: slot.value })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all border ${
                        formData.delivery_time === slot.value
                          ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
                <Input
                  id="delivery_time"
                  type="time"
                  value={formData.delivery_time}
                  onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                  className="rounded-xl border-gray-200 text-sm font-medium"
                  required
                />
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="start_date" className="text-xs text-gray-600 font-medium">
                    Start Date
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="rounded-xl border-gray-200 text-xs font-medium"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end_date" className="text-xs text-gray-600 font-medium">
                    Plan Ends On
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="rounded-xl border-gray-200 text-xs font-medium"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Delivery Address */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <label className="text-sm font-semibold text-gray-800 block">
              5. Delivery Address
            </label>

            <div className="space-y-3">
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <Input
                  required
                  placeholder="Street / Building / Flat Number"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                  className="pl-10 rounded-xl border-gray-200 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <Input
                  required
                  placeholder="City"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                  className="rounded-xl border-gray-200 text-xs font-medium"
                />
                <Input
                  required
                  placeholder="State"
                  value={formData.address.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value },
                    })
                  }
                  className="rounded-xl border-gray-200 text-xs font-medium"
                />
                <Input
                  required
                  placeholder="PIN Code"
                  value={formData.address.zip_code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, zip_code: e.target.value },
                    })
                  }
                  className="rounded-xl border-gray-200 text-xs font-medium"
                />
              </div>
            </div>

            {/* Auto-renew checkbox */}
            <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100/60 transition-colors">
              <input
                type="checkbox"
                checked={formData.auto_renew}
                onChange={(e) =>
                  setFormData({ ...formData, auto_renew: e.target.checked })
                }
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-gray-800">Auto-renew this plan</span>
                <span className="text-gray-500 ml-1.5">
                  (Continuously deliver without re-ordering every week/month)
                </span>
              </div>
            </label>
          </div>

          {/* Clean Summary & Submit Footer */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-gray-500 font-medium">Plan Total:</span>
              <div className="flex items-baseline gap-2">
                {pricingDetails.savings > 0 && (
                  <span className="text-sm text-gray-400 line-through font-semibold">
                    ₹{pricingDetails.basePrice}
                  </span>
                )}
                <span className="text-2xl font-black text-gray-900">
                  ₹{pricingDetails.finalPrice}
                </span>
                {pricingDetails.savings > 0 && (
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                    Save ₹{pricingDetails.savings} ({pricingDetails.discountPct}% OFF)
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {pricingDetails.multiplier} meals total • {formData.delivery_days.length} days/week • ₹{Math.round(pricingDetails.finalPrice / pricingDetails.multiplier)}/meal
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 sm:flex-none rounded-xl border-gray-200 text-gray-700 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 sm:flex-none rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold px-7 py-3 shadow-md hover:shadow-lg transition-all"
              >
                {isLoading ? 'Setting Up...' : `Confirm & Subscribe (₹${pricingDetails.finalPrice})`}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
