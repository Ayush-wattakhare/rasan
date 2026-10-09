import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400">
          {title}
        </span>
        <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-xs">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-3xl font-black text-gray-900 tracking-tight">{value}</div>
        <div className="flex items-center justify-between mt-2">
          {description && (
            <p className="text-xs font-semibold text-gray-500">{description}</p>
          )}
          {trend && (
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                trend.isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}
            >
              {trend.isPositive ? '↑ +' : '↓ -'}
              {trend.value}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

