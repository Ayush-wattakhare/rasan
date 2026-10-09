'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserGrowthData {
  role: string;
  count: number;
}

export default function UserGrowthChart() {
  const [data, setData] = useState<UserGrowthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserGrowth() {
      const supabase = createClient();

      const { data: profiles } = await supabase
        .from('profiles')
        .select('role');

      if (profiles) {
        const roleCount = profiles.reduce((acc, profile) => {
          acc[profile.role] = (acc[profile.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(roleCount).map(([role, count]) => ({
          role: role.charAt(0).toUpperCase() + role.slice(1),
          count,
        }));

        setData(chartData);
      }
      setLoading(false);
    }

    fetchUserGrowth();
  }, []);

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Distribution by Role</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-3xl font-bold">{total.toLocaleString()} Users</div>
            <div className="space-y-3">
              {data.map((item) => {
                const percentage = ((item.count / total) * 100).toFixed(1);
                return (
                  <div key={item.role} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.role}</span>
                      <span className="text-muted-foreground">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
