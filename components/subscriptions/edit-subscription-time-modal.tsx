'use client';

import { useState } from 'react';
import { X, Clock, Check, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/hooks/use-toast';

interface EditSubscriptionTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  currentDeliveryTime: string;
  planType: string;
  onSuccess: (newTime: string) => void;
}

const PRESET_SLOTS = [
  { time: '12:00 PM', label: 'Early Lunch', category: 'lunch' },
  { time: '01:00 PM', label: 'Prime Lunch', category: 'lunch' },
  { time: '01:30 PM', label: 'Late Lunch', category: 'lunch' },
  { time: '07:30 PM', label: 'Early Dinner', category: 'dinner' },
  { time: '08:00 PM', label: 'Prime Dinner', category: 'dinner' },
  { time: '08:30 PM', label: 'Late Dinner', category: 'dinner' },
];

export function EditSubscriptionTimeModal({
  isOpen,
  onClose,
  subscriptionId,
  currentDeliveryTime,
  planType,
  onSuccess,
}: EditSubscriptionTimeModalProps) {
  const [selectedTime, setSelectedTime] = useState(currentDeliveryTime || '12:00 PM');
  const [customTime, setCustomTime] = useState('');
  const [isCustom, setIsCustom] = useState(
    !PRESET_SLOTS.some((s) => s.time.toLowerCase() === (currentDeliveryTime || '').toLowerCase())
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  // Convert 12hr "12:00 PM" string or 24hr "12:00" to standardized format
  const formatTimeSlot = (timeStr: string) => {
    if (!timeStr) return '12:00 PM';
    if (timeStr.includes(':') && (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm'))) {
      return timeStr.toUpperCase();
    }
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours)) return timeStr;
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes !== undefined ? String(minutes).padStart(2, '0') : '00';
    return `${String(formattedHours).padStart(2, '0')}:${formattedMinutes} ${period}`;
  };

  const handleSave = async () => {
    const finalTime = isCustom ? formatTimeSlot(customTime) : selectedTime;
    if (!finalTime.trim()) {
      toast({
        title: 'Please Select a Time',
        description: 'Choose a preferred delivery slot or enter a custom time.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_time: finalTime }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update delivery time');
      }

      toast({
        title: 'Delivery Time Updated ⏱️',
        description: `Your ${planType} subscription is now scheduled for ${finalTime}.`,
      });

      onSuccess(finalTime);
      onClose();
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message || 'Could not update delivery time.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-8 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="bg-orange-100 p-3 rounded-2xl text-orange-600 shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">
              Edit Preferred Delivery Time
            </h3>
            <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">
              {planType} Plan Schedule
            </p>
          </div>
        </div>

        {/* 2-Hour Cutoff Notice Banner */}
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/60 rounded-2xl p-4 mb-6 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-1 rounded-lg bg-orange-500/10 text-orange-600 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-gray-900 uppercase tracking-wide">
                Modify Anytime Policy
              </p>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                You can change your delivery time anytime! Modifications must be made at least <span className="font-black text-orange-700">2 hours prior</span> to the delivery slot so your home chef has sufficient cooking and packing time.
              </p>
            </div>
          </div>
        </div>

        {/* Preset Time Slots */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 block mb-2">
              Popular Delivery Slots
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_SLOTS.map((slot) => {
                const isSelected = !isCustom && selectedTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => {
                      setSelectedTime(slot.time);
                      setIsCustom(false);
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-600 border-orange-600 text-white shadow-md scale-[1.02]'
                        : 'bg-gray-50 border-gray-100 hover:border-orange-200 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black tracking-tight">{slot.time}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span
                      className={`text-[0.6rem] font-bold uppercase tracking-wider block mt-0.5 ${
                        isSelected ? 'text-orange-100' : 'text-gray-400'
                      }`}
                    >
                      {slot.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Time Option */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">
                Or Pick Custom Exact Time
              </label>
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`text-[0.65rem] font-bold uppercase tracking-wider ${
                  isCustom ? 'text-orange-600 underline' : 'text-gray-400 hover:text-orange-600'
                }`}
              >
                Use Custom Time
              </button>
            </div>

            <div
              className={`p-3.5 rounded-2xl border-2 transition-all ${
                isCustom
                  ? 'border-orange-500 bg-orange-50/30 ring-2 ring-orange-500/20'
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={customTime}
                  onFocus={() => setIsCustom(true)}
                  onChange={(e) => {
                    setCustomTime(e.target.value);
                    setIsCustom(true);
                  }}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-black text-gray-900 focus:outline-none focus:border-orange-500 flex-1 shadow-xs"
                />
                <span className="text-xs font-bold text-gray-500">
                  {customTime ? formatTimeSlot(customTime) : 'e.g. 01:15 PM'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-500"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 h-12 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              'Save Preferred Time'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
