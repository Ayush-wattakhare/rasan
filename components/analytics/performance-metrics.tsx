import { Progress } from '@/components/ui/progress';

interface PerformanceMetric {
  label: string;
  value: number;
  max: number;
  color?: string;
  unit?: string;
}

interface PerformanceMetricsProps {
  metrics: PerformanceMetric[];
}

export function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl space-y-4">
      <div>
        <span className="text-[0.6rem] font-black uppercase tracking-widest text-orange-600">
          Quality Control
        </span>
        <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">
          Operational Benchmarks
        </h3>
      </div>
      <div className="space-y-5 pt-2">
        {metrics.map((metric, index) => {
          const percent = Math.min(100, Math.round((metric.value / (metric.max || 1)) * 100));
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800">{metric.label}</span>
                <span className="font-black text-orange-600">
                  {metric.unit ? `${metric.value}${metric.unit}` : `${metric.value} / ${metric.max}`} ({percent}%)
                </span>
              </div>
              <Progress value={percent} className="h-2.5 bg-gray-100" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

