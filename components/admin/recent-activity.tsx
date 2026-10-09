'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from '@/lib/utils/format';
import { Hash, Clock, Package, Zap, UserPlus, Store, ChevronRight, Activity as ActivityIcon } from 'lucide-react';

interface Activity {
  id: string;
  type: 'order' | 'signup' | 'vendor_onboard';
  description: string;
  actor: string;
  timestamp: string;
  status?: string;
  priority: 'low' | 'medium' | 'high';
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      const supabase = createClient();

      const [ordersRes, profilesRes] = await Promise.all([
        supabase.from('orders').select('id, order_number, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('id, name, email, role, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const activityData: Activity[] = [];

      if (ordersRes.data) {
        ordersRes.data.forEach((order) => {
          activityData.push({
            id: order.id,
            type: 'order',
            description: `Mission ${order.order_number}`,
            actor: 'Platform Logic',
            timestamp: order.created_at,
            status: order.status,
            priority: order.status === 'pending' ? 'high' : 'medium',
          });
        });
      }

      if (profilesRes.data) {
        profilesRes.data.forEach((profile) => {
          activityData.push({
            id: profile.id,
            type: profile.role === 'vendor' ? 'vendor_onboard' : 'signup',
            description: profile.role === 'vendor' ? 'New Kitchen Node' : 'Population Increase',
            actor: profile.name,
            timestamp: profile.created_at,
            priority: 'low',
          });
        });
      }

      // Sort combined activities by timestamp
      activityData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(activityData.slice(0, 10));
      setLoading(false);
    }

    fetchActivity();
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-orange-600 text-white',
      delivered: 'bg-green-600 text-white',
      cancelled: 'bg-red-600 text-white',
      preparing: 'bg-blue-600 text-white',
    };
    return colors[status] || 'bg-gray-500 text-white';
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return Package;
      case 'vendor_onboard': return Store;
      case 'signup': return UserPlus;
      default: return ActivityIcon;
    }
  };

  return (
    <Card className="border-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] bg-white rounded-[2.5rem] overflow-hidden border border-gray-50">
      <CardContent className="p-1">
        {loading ? (
          <div className="h-[400px] flex flex-col items-center justify-center gap-4">
             <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest italic">Decrypting Logs...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activities.map((activity) => {
              const Icon = getIcon(activity.type);
              return (
                <div key={`${activity.type}-${activity.id}`} className="flex items-center justify-between group py-8 px-10 hover:bg-orange-50/30 transition-all cursor-crosshair">
                  <div className="flex items-center gap-8">
                    <div className={`w-14 h-14 rounded-2xl ${activity.priority === 'high' ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/20' : 'bg-gray-50 text-gray-400'} flex items-center justify-center group-hover:scale-110 transition-all duration-500`}>
                       <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                         <p className="text-[0.8rem] font-black text-gray-900 uppercase italic tracking-tight">{activity.description}</p>
                         <div className={`w-1.5 h-1.5 rounded-full ${activity.priority === 'high' ? 'bg-orange-600 animate-pulse' : 'bg-gray-200'}`}></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest">
                           <Clock className="w-3 h-3" />
                           <span>{formatDistanceToNow(activity.timestamp)} AGO</span>
                        </div>
                        <div className="flex items-center gap-2 text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest">
                           <ActivityIcon className="w-3 h-3 text-orange-600" />
                           <span>ACTOR: {activity.actor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {activity.status && (
                      <Badge className={`${getStatusColor(activity.status)} h-7 px-4 rounded-full font-black uppercase tracking-widest text-[0.6rem] border-none shadow-sm italic`}>
                        {activity.status.replace('_', ' ')}
                      </Badge>
                    )}
                    <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 group-hover:bg-white group-hover:text-orange-600 group-hover:border-orange-100 transition-all shadow-sm">
                       <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
