import { createClient } from '@/lib/supabase/server';
import SystemStats from '@/components/admin/system-stats';
import RevenueOverview from '@/components/admin/revenue-overview';
import UserGrowthChart from '@/components/admin/user-growth-chart';
import RecentActivity from '@/components/admin/recent-activity';
import AdminDashboardActions from '@/components/admin/admin-dashboard-actions';
import AdminCommandActions from '@/components/admin/admin-command-actions';
import AdminTacticalMap from '@/components/admin/admin-tactical-map';
import { 
  ShieldCheck, BarChart3, Users, Zap, RefreshCcw, Database, 
  AlertTriangle, Radio, Settings2, Lock, Globe, Map as MapIcon, 
  Activity, Clock, ChevronRight, MessageSquare 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch system stats
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const [usersResult, ordersResult, vendorsResult, subscriptionsResult, lateOrdersResult, failedPaymentsResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id, total', { count: 'exact' }),
    supabase.from('vendors').select('id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
    // Real anomaly: orders stuck in pending/confirmed/preparing > 30 mins
    supabase.from('orders')
      .select('id, status, created_at')
      .in('status', ['pending', 'confirmed', 'preparing'])
      .lt('created_at', thirtyMinutesAgo)
      .order('created_at', { ascending: true })
      .limit(5),
    // Real anomaly: failed payments
    supabase.from('orders')
      .select('id, payment_status, created_at')
      .eq('payment_status', 'failed')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
  const rasanEarnings = Math.round(totalRevenue * 0.25);
  const vendorPayouts = Math.round(totalRevenue * 0.75);

  const stats = {
    totalUsers: usersResult.count || 0,
    totalOrders: ordersResult.count || 0,
    totalRevenue,
    rasanEarnings,
    vendorPayouts,
    activeSubscriptions: subscriptionsResult.count || 0,
  };

  // Build real anomalies list
  const anomalies: Array<{ id: string; type: string; time: string; severity: string }> = [
    ...(lateOrdersResult.data || []).map((o) => ({
      id: o.id.slice(0, 6).toUpperCase(),
      type: `Late Order (${o.status})`,
      time: `${Math.round((Date.now() - new Date(o.created_at).getTime()) / 60000)}m`,
      severity: 'critical',
    })),
    ...(failedPaymentsResult.data || []).map((o) => ({
      id: o.id.slice(0, 6).toUpperCase(),
      type: 'Payment Failed',
      time: `${Math.round((Date.now() - new Date(o.created_at).getTime()) / 60000)}m`,
      severity: 'warning',
    })),
  ].slice(0, 4);

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-24">
      {/* ── NEXUS HERO ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-12 md:py-16 border-b border-white/5">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-600/5 rounded-full blur-[120px] -mr-32 -mt-32"></div>
        
        <div className="container mx-auto px-8 relative z-10">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
            <div className="space-y-6 max-w-3xl">
              <div className="inline-flex flex-wrap items-center gap-3">
                 <div id="nexus-tag" data-testid="nexus-tag" className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.3em] italic">AUTHORITY v9.4</span>
                 </div>
                 <div id="status-tag" data-testid="status-tag" className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-600/5 border border-orange-500/10 text-orange-500 backdrop-blur-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                    <span className="text-[0.6rem] font-black uppercase tracking-widest">Platform Healthy</span>
                 </div>
              </div>
              
              <div className="space-y-2">
                <h1 id="nexus-title" data-testid="nexus-title" className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.8] uppercase italic">
                  NEXUS <span className="text-orange-600">COMMAND</span>
                </h1>
                <p id="nexus-subtitle" data-testid="nexus-subtitle" className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[0.55rem] pt-2 flex items-center gap-2">
                   <Database className="w-3.5 h-3.5" /> LIVE TELEMETRY • GLOBAL PERSISTENCE
                </p>

                {/* ── ADMIN ID PASS ── */}
                <div id="admin-id-pass" data-testid="admin-pass" className="mt-8 bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] p-5 flex items-center gap-6 max-w-md shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-orange-600/20 transition-all text-white"></div>
                   <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-orange-600 font-black text-2xl italic shadow-2xl relative z-10 shrink-0">
                      {user?.email?.charAt(0).toUpperCase() || 'A'}
                   </div>
                   <div className="space-y-0.5 relative z-10 flex-1 min-w-0">
                      <div className="text-[0.5rem] font-black text-orange-500 uppercase tracking-[0.4em] mb-0.5">SYSTEM ADMINISTRATOR</div>
                      <div className="text-lg font-black text-white uppercase italic tracking-tighter leading-none truncate">
                         {user?.email?.split('@')[0] || 'MASTER'}
                      </div>
                      <div className="text-[0.55rem] font-bold text-gray-500 uppercase tracking-[0.1em] pt-1 flex items-center gap-2">
                         <ShieldCheck className="w-3 h-3 text-green-500" /> ROOT_LEVEL_SECURED
                      </div>
                   </div>
                   <Badge className="bg-orange-600 h-6 px-3 rounded-full font-black italic tracking-widest text-[0.5rem] border-none shadow-lg shrink-0">RANK 01</Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-[280px]">
               <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between">
                     <span className="text-[0.55rem] font-black text-white uppercase tracking-[0.2em] italic text-gray-400">Mission Telemetry</span>
                     <BarChart3 className="w-3.5 h-3.5 text-orange-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <span className="text-[0.5rem] font-bold text-gray-500 uppercase tracking-widest block">Success</span>
                        <span className="text-lg font-black text-white italic leading-tight">99.8%</span>
                     </div>
                     <div className="space-y-1 text-right">
                        <span className="text-[0.5rem] font-bold text-gray-500 uppercase tracking-widest block">Velocity</span>
                        <span className="text-lg font-black text-white italic leading-tight">28m</span>
                     </div>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                     <div className="bg-orange-600 w-[85%] h-full"></div>
                  </div>
               </div>
               <AdminDashboardActions />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-8 -mt-10 relative z-20 space-y-12">
        {/* System Stats Block */}
        <SystemStats stats={stats} />

        {/* ── OPERATIONAL COMMAND & ANOMALIES ── */}
        <div className="grid gap-6 lg:grid-cols-3">
           <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-4">
                 <h2 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter shrink-0">TACTICAL SORTIE MAP</h2>
                 <div className="h-[1px] flex-1 bg-gray-200"></div>
                 <Badge variant="outline" className="text-orange-600 border-orange-100 bg-orange-50 font-black italic tracking-widest text-[0.55rem]">LIVE_FEED</Badge>
              </div>
              <AdminTacticalMap />
           </div>

           <div className="space-y-4">
              <div className="flex items-center gap-4">
                 <h2 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter shrink-0">COMMAND CENTER</h2>
                 <div className="h-[1px] flex-1 bg-gray-200"></div>
                 <Settings2 className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <div className="bg-white rounded-[2rem] p-6 shadow-2xl border border-gray-50 space-y-6">
                 <AdminCommandActions />

                 <div className="space-y-3 pt-4 border-t border-gray-100">
                    <h3 className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400">
                      Anomalies {anomalies.length > 0 ? `(${anomalies.length})` : ''}
                    </h3>
                    {anomalies.length === 0 ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <p className="text-[0.6rem] font-black text-green-700 uppercase italic">All systems normal — no anomalies detected</p>
                      </div>
                    ) : anomalies.map(anomaly => (
                       <div key={anomaly.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100 group cursor-pointer">
                          <div className="flex items-center gap-3">
                             <div className={"w-1.5 h-1.5 rounded-full " + (anomaly.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-orange-500')}></div>
                             <div>
                                <p className="text-[0.6rem] font-black text-gray-900 uppercase italic leading-tight">{anomaly.type}</p>
                                <p className="text-[0.5rem] font-bold text-gray-400 uppercase tracking-widest">{anomaly.id} • {anomaly.time}</p>
                             </div>
                          </div>
                          <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-orange-600 transition-all" />
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
        
        <div className="grid gap-12 lg:grid-cols-2">
           <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <h2 id="revenue-title" data-testid="revenue-overview-title" className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter shrink-0">REVENUE RADIAL</h2>
                 <div className="h-[2px] flex-1 bg-gray-100"></div>
                 <Zap className="w-4 h-4 text-orange-600 fill-orange-600" />
              </div>
              <div id="revenue-overview-container" data-testid="revenue-overview" className="bg-white rounded-[2.5rem] p-2 shadow-2xl overflow-hidden border border-gray-50">
                <RevenueOverview />
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <h2 id="growth-title" data-testid="user-growth-title" className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter shrink-0">POPULATION</h2>
                 <div className="h-[2px] flex-1 bg-gray-100"></div>
                 <Users className="w-4 h-4 text-orange-600" />
              </div>
              <div id="user-growth-container" data-testid="user-growth" className="bg-white rounded-[2.5rem] p-2 shadow-2xl overflow-hidden border border-gray-50">
                <UserGrowthChart />
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="flex items-center gap-4">
              <h2 id="activity-title" data-testid="recent-activity-title" className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter shrink-0">PROTOCOL LOGS</h2>
              <div className="h-[2px] flex-1 bg-gray-100"></div>
              <Button variant="ghost" className="text-[0.6rem] font-black uppercase tracking-widest text-orange-600 hover:text-orange-500">Full Archive</Button>
           </div>
           <RecentActivity />
        </div>
      </div>
    </div>
  );
}
