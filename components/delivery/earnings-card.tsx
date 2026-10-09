'use client';

import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign } from 'lucide-react';

interface Earnings {
  today: number;
  this_week: number;
  this_month: number;
  total: number;
}

interface EarningsCardProps {
  earnings: Earnings;
}

export default function EarningsCard({ earnings }: EarningsCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const earningsData = [
    { label: 'Today', value: earnings.today, period: 'today' },
    { label: 'This Week', value: earnings.this_week, period: 'week' },
    { label: 'This Month', value: earnings.this_month, period: 'month' },
    { label: 'Total', value: earnings.total, period: 'total' },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="h-6 w-6 text-green-600" />
        <h2 className="text-xl font-semibold">Earnings</h2>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {earningsData.map((item) => (
            <TabsTrigger key={item.period} value={item.period}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {earningsData.map((item) => (
          <TabsContent key={item.period} value={item.period} className="mt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(item.value)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Earnings for {item.label.toLowerCase()}
              </p>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
