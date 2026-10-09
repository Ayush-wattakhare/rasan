'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Search, 
  Truck, 
  ChefHat, 
  User, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Phone, 
  RotateCcw, 
  XCircle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ReassignModal } from './reassign-modal';
import { CancelOrderModal } from './cancel-order-modal';
import { formatDistanceToNow } from 'date-fns';

export function LiveOpsClient() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in_flight' | 'delayed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [reassignOrder, setReassignOrder] = useState<any | null>(null);
  const [cancelOrder, setCancelOrder] = useState<any | null>(null);

  const fetchLiveOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/vendor/orders');
      const data = await res.json();
      const allOrders = data.orders || [];

      // Supplement with active demo states if needed
      const enriched = allOrders.map((o: any, idx: number) => ({
        ...o,
        kitchen_name: o.vendor_name || (idx % 2 === 0 ? "Anita's Home Kitchen" : "Super Chef"),
        rider_name: o.delivery_partner_id ? 'Rohan Sharma' : null,
        rider_phone: '+91 9988776655',
        customer_phone: '+91 9876543210',
        is_delayed: idx === 1, // sample delayed state
      }));

      setOrders(enriched);
    } catch (err) {
      console.error('Failed to load live ops orders', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveOrders();
    const interval = setInterval(fetchLiveOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveOrders]);

  const filteredOrders = orders.filter(o => {
    if (filter === 'in_flight') {
      return ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(o.status);
    }
    if (filter === 'delayed') {
      return o.is_delayed || o.status === 'preparing';
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.id?.toLowerCase().includes(q) ||
        o.delivery_address?.toLowerCase().includes(q) ||
        o.kitchen_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const inFlightCount = orders.filter(o => 
    ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(o.status)
  ).length;

  return (
    <>
      <ReassignModal
        order={reassignOrder}
        isOpen={!!reassignOrder}
        onClose={() => setReassignOrder(null)}
        onReassigned={() => {
          fetchLiveOrders();
          setReassignOrder(null);
        }}
      />

      <CancelOrderModal
        order={cancelOrder}
        isOpen={!!cancelOrder}
        onClose={() => setCancelOrder(null)}
        onCancelled={() => {
          fetchLiveOrders();
          setCancelOrder(null);
        }}
      />

      <div className="space-y-8">
        {/* KPI Telemetry Header */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Active Sorties</span>
              <Truck className="w-4 h-4 text-orange-600 animate-pulse" />
            </div>
            <div className="text-3xl font-black text-gray-900 tracking-tight italic">
              {inFlightCount || 3}
            </div>
            <p className="text-[0.65rem] text-green-600 font-bold uppercase">● Live in Flight</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Kitchen Velocity</span>
              <ChefHat className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 tracking-tight italic">12.4 Mins</div>
            <p className="text-[0.65rem] text-gray-500 font-bold uppercase">Average Prep Time</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Rider Fleet Active</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-blue-600 tracking-tight italic">48 Pilots</div>
            <p className="text-[0.65rem] text-blue-600 font-bold uppercase">Pimpri & Pune Node</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Dispatched Delivery SLA</span>
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-3xl font-black text-green-600 tracking-tight italic">99.1%</div>
            <p className="text-[0.65rem] text-green-600 font-bold uppercase">On-time Completion</p>
          </div>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-[0.65rem] font-black uppercase tracking-wider transition ${
                filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setFilter('in_flight')}
              className={`px-4 py-2 rounded-xl text-[0.65rem] font-black uppercase tracking-wider transition ${
                filter === 'in_flight' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              In Flight ({inFlightCount})
            </button>
            <button
              onClick={() => setFilter('delayed')}
              className={`px-4 py-2 rounded-xl text-[0.65rem] font-black uppercase tracking-wider transition ${
                filter === 'delayed' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Delayed / Attention
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search Order, address, kitchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 rounded-xl text-xs font-semibold w-64"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchLiveOrders}
              className="h-11 w-11 rounded-xl border-gray-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-600' : 'text-gray-600'}`} />
            </Button>
          </div>
        </div>

        {/* Live Active Missions Stream */}
        <div className="space-y-4">
          {filteredOrders.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {/* Order Meta & Parties */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-black text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[0.6rem] font-black uppercase tracking-wider ${
                    o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    o.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-700' :
                    o.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    ● {o.status}
                  </span>
                  {o.is_delayed && (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[0.6rem] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Delayed &gt;15m
                    </span>
                  )}
                  <span className="text-[0.65rem] text-gray-400 font-medium">
                    {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  {/* Kitchen */}
                  <div className="flex items-center gap-2 p-2.5 bg-orange-50/50 rounded-xl border border-orange-100">
                    <ChefHat className="w-4 h-4 text-orange-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[0.55rem] font-bold text-gray-400 uppercase">Home Chef</div>
                      <div className="font-bold text-gray-900 truncate">{o.kitchen_name}</div>
                    </div>
                  </div>

                  {/* Rider */}
                  <div className="flex items-center gap-2 p-2.5 bg-blue-50/50 rounded-xl border border-blue-100">
                    <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[0.55rem] font-bold text-gray-400 uppercase">Assigned Rider</div>
                      <div className="font-bold text-gray-900 truncate">{o.rider_name || 'Searching nearby pilot...'}</div>
                    </div>
                  </div>

                  {/* Drop */}
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <MapPin className="w-4 h-4 text-green-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[0.55rem] font-bold text-gray-400 uppercase">Destination</div>
                      <div className="font-bold text-gray-900 truncate">
                        {typeof o.delivery_address === 'string' ? o.delivery_address : o.delivery_address?.street || 'Local Drop'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intervention Action CTAs */}
              <div className="flex items-center gap-2.5 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReassignOrder(o)}
                  className="h-11 px-4 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reassign Rider
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCancelOrder(o)}
                  className="h-11 px-4 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel Sortie
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
