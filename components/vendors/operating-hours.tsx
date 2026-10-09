import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OperatingHoursProps {
  operatingHours: {
    [key: string]: {
      is_open: boolean;
      open_time: string;
      close_time: string;
    };
  };
  isCurrentlyOpen: boolean;
}

const dayNames = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function OperatingHours({
  operatingHours,
  isCurrentlyOpen,
}: OperatingHoursProps) {
  return (
    <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
      <CardHeader className="pb-4 pt-8 px-8 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl">🕒</div>
             <CardTitle className="text-xl font-black text-[#1A1A1A] tracking-tight uppercase italic">Kitchen Schedule</CardTitle>
          </div>
          <div className={`px-4 py-2 rounded-2xl text-[0.65rem] font-black uppercase tracking-[0.2em] shadow-sm border ${
            isCurrentlyOpen 
              ? 'bg-green-50 text-green-700 border-green-100 animate-pulse' 
              : 'bg-red-50 text-red-700 border-red-100'
          }`}>
            {isCurrentlyOpen ? '🟢 Accepting Orders' : '🔴 Kitchen Closed'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dayNames.map(({ key, label }) => {
            const schedule = operatingHours[key];
            const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === key;
            
            return (
              <div
                key={key}
                className={`p-4 rounded-2xl border transition-all ${
                  isToday 
                    ? 'border-orange-500 bg-orange-50/30 ring-4 ring-orange-500/10' 
                    : 'border-gray-50 bg-gray-50/30'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className={`text-[0.6rem] font-black uppercase tracking-widest ${isToday ? 'text-orange-600' : 'text-gray-400'}`}>
                    {label} {isToday && '• TODAY'}
                  </span>
                  {schedule?.is_open ? (
                    <span className="text-sm font-extrabold text-[#1A1A1A] tracking-tight">
                      {schedule.open_time} <span className="text-gray-300 mx-1">—</span> {schedule.close_time}
                    </span>
                  ) : (
                    <span className="text-sm font-extrabold text-gray-300 italic">Resting</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
