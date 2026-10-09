'use client';

import { Check } from 'lucide-react';

interface WorkingDaysSelectorProps {
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
}

export default function WorkingDaysSelector({
  selectedDays,
  onDaysChange,
}: WorkingDaysSelectorProps) {
  const days = [
    { value: 'monday', label: 'Mon', fullName: 'Monday' },
    { value: 'tuesday', label: 'Tue', fullName: 'Tuesday' },
    { value: 'wednesday', label: 'Wed', fullName: 'Wednesday' },
    { value: 'thursday', label: 'Thu', fullName: 'Thursday' },
    { value: 'friday', label: 'Fri', fullName: 'Friday' },
    { value: 'saturday', label: 'Sat', fullName: 'Saturday' },
    { value: 'sunday', label: 'Sun', fullName: 'Sunday' },
  ];

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      onDaysChange(selectedDays.filter((d) => d !== day));
    } else {
      onDaysChange([...selectedDays, day]);
    }
  };

  const selectWeekdays = () => {
    onDaysChange(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  };

  const selectMonToSat = () => {
    onDaysChange(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);
  };

  const selectAllDays = () => {
    onDaysChange(days.map((d) => d.value));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-sm font-semibold text-gray-800 block">
            3. Delivery Days in Week ({selectedDays.length} days selected)
          </label>
          <span className="text-[0.65rem] text-orange-600 font-bold">
            Weekends auto-excluded for 5-day plans • Skipped meals auto-extended
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <button
            type="button"
            onClick={selectWeekdays}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1 ${
              selectedDays.length === 5 && !selectedDays.includes('saturday') && !selectedDays.includes('sunday')
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <span>💼 Mon-Fri</span>
            <span className="opacity-80 text-[0.65rem]">(Office/Col)</span>
          </button>
          <button
            type="button"
            onClick={selectMonToSat}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
              selectedDays.length === 6 && !selectedDays.includes('sunday')
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Mon-Sat
          </button>
          <button
            type="button"
            onClick={selectAllDays}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
              selectedDays.length === 7
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            All 7 Days (PG/Hostel)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isSelected = selectedDays.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`py-2.5 px-2 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                isSelected
                  ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold shadow-xs'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="text-xs">{day.label}</span>
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                  isSelected ? 'bg-orange-500 text-white' : 'bg-transparent'
                }`}
              >
                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDays.length === 0 && (
        <p className="text-xs font-semibold text-red-500 mt-1">
          Please select at least one delivery day.
        </p>
      )}
    </div>
  );
}
