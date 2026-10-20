'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Search,
  Truck,
  ChefHat,
  MapPin,
  Clock,
  AlertTriangle,
  RefreshCw,
  Phone,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReassignModal } from './reassign-modal';
import { CancelOrderModal } from './cancel-order-modal';
import { formatDistanceToNow } from 'date-fns';

export type LiveOrder = {
  id: string;
  order_number: string | null;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  created_at: string;
  delivery_address: any;
  delivery_partner_id: string | null;
  kitchen_name: string;
  kitchen_phone: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  rider_name: string | null;
  rider_phone: string | null;
  rider_vehicle: string | null;
  minutes_in_status: number;
  is_delayed: boolean;
};

const IN_FLIGHT = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery'];
/** Statuses where swapping the rider makes sense. */
const REASSIGNABLE = ['ready', 'picked_up', 'out_for_delivery'];

function addressLine(address: any): string {
  if (!address) return 'No address';
  if (typeof address === 'string') return address;
  return [address.street, address.city].filter(Boolean).join(', ') || 'No address';
}

export function LiveOpsClient() {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [onlineRiders, setOnlineRiders] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<'all' | 'in_flight' | 'delayed'>('in_flight');
  const [searchQuery, setSearchQuery] = useState('');

  const [reassignOrder, setReassignOrder] = useState<LiveOrder | null>(null);
  const [cancelOrder, setCancelOrder] = useState<LiveOrder | null>(null);

  const fetchLiveOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ordersRes, ridersRes] = await Promise.all([
        fetch('/api/admin/orders?scope=all'),
        fetch('/api/admin/delivery-partners?online=1'),
      ]);
      const ordersData = await ordersRes.json();
      if (!ordersRes.ok) throw new Error(ordersData.error || 'Could not load orders');
      setOrders(ordersData.orders || []);
      setLoadError('');
      if (ridersRes.ok) {
        const ridersData = await ridersRes.json();
        setOnlineRiders((ridersData.riders || []).length);
      }
    } catch (err: any) {
      setLoadError(err.message || 'Could not load orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveOrders();
    const interval = setInterval(fetchLiveOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveOrders]);

  const inFlight = useMemo(() => orders.filter((o) => IN_FLIGHT.includes(o.status)), [orders]);
  const delayed = useMemo(() => inFlight.filter((o) => o.is_delayed), [inFlight]);

  // Average minutes from order to "ready" isn't stored per order; show the
  // live time-in-status of orders being cooked instead (real data).
  const cookingMinutes = useMemo(() => {
    const cooking = inFlight.filter((o) => o.status === 'preparing');
    if (cooking.length === 0) return null;
    return Math.round(cooking.reduce((s, o) => s + o.minutes_in_status, 0) / cooking.length);
  }, [inFlight]);

  const filteredOrders = useMemo(() => {
    const base = filter === 'in_flight' ? inFlight : filter === 'delayed' ? delayed : orders;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((o) =>
      [o.id, o.order_number, o.kitchen_name, o.customer_name, o.rider_name, addressLine(o.delivery_address)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [filter, inFlight, delayed, orders, searchQuery]);

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Orders In Flight</span>
              <Truck className="w-4 h-4 text-orange-600" aria-hidden="true" />
            </div>
            <div className="text-3xl font-black text-gray-900 tracking-tight italic">{inFlight.length}</div>
            <p className="text-[0.65rem] text-gray-500 font-bold uppercase">Paid or cash, not yet delivered</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Cooking Now</span>
              <ChefHat className="w-4 h-4 text-amber-500" aria-hidden="true" />
            </div>
            <div className="text-3xl font-black text-gray-900 tracking-tight italic">
              {cookingMinutes === null ? '—' : `${cookingMinutes} min`}
            </div>
            <p className="text-[0.65rem] text-gray-500 font-bold uppercase">Avg. time in preparation</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Riders Online</span>
              <Activity className="w-4 h-4 text-blue-600" aria-hidden="true" />
            </div>
            <div className="text-3xl font-black text-blue-600 tracking-tight italic">{onlineRiders ?? '—'}</div>
            <p className="text-[0.65rem] text-gray-500 font-bold uppercase">Verified &amp; on duty</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Delayed</span>
              <Clock className="w-4 h-4 text-red-600" aria-hidden="true" />
            </div>
            <div className={`text-3xl font-black tracking-tight italic ${delayed.length ? 'text-red-600' : 'text-green-600'}`}>
              {delayed.length}
            </div>
            <p className="text-[0.65rem] text-gray-500 font-bold uppercase">Stuck longer than expected</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-2xl text-xs font-bold" role="group" aria-label="Filter orders">
            {([
              ['in_flight', `In Flight (${inFlight.length})`, 'text-orange-600'],
              ['delayed', `Delayed (${delayed.length})`, 'text-red-600'],
              ['all', `Recent (${orders.length})`, 'text-gray-900'],
            ] as const).map(([key, label, active]) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-xl text-[0.65rem] font-black uppercase tracking-wider transition ${
                  filter === key ? `bg-white ${active} shadow-sm` : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              <Input
                aria-label="Search orders"
                placeholder="Order, kitchen, customer, rider…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 rounded-xl text-xs font-semibold w-64"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh"
              onClick={fetchLiveOrders}
              className="h-11 w-11 rounded-xl border-gray-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-600' : 'text-gray-600'}`} />
            </Button>
          </div>
        </div>

        {loadError && (
          <p role="alert" className="p-6 bg-red-50 rounded-3xl text-sm font-semibold text-red-700">{loadError}</p>
        )}
        {!loadError && !isLoading && filteredOrders.length === 0 && (
          <p className="p-10 bg-white rounded-3xl text-center text-sm font-semibold text-gray-400 border border-gray-100">
            No orders here right now.
          </p>
        )}

        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const live = IN_FLIGHT.includes(o.status);
            return (
              <div
                key={o.id}
                className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-black text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg">
                      #{o.order_number || o.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[0.6rem] font-black uppercase tracking-wider ${
                      o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      o.status === 'cancelled' ? 'bg-gray-200 text-gray-600' :
                      o.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-700' :
                      o.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      ● {o.status.replace(/_/g, ' ')}
                    </span>
                    {o.is_delayed && live && (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[0.6rem] font-black uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" aria-hidden="true" /> {o.minutes_in_status} min in this status
                      </span>
                    )}
                    <span className="text-[0.65rem] text-gray-400 font-medium">
                      {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })} · ₹{o.total} · {o.payment_method.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                    <div className="flex items-center gap-2 p-2.5 bg-orange-50/50 rounded-xl border border-orange-100">
                      <ChefHat className="w-4 h-4 text-orange-600 shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="text-[0.55rem] font-bold text-gray-400 uppercase">Home Chef</div>
                        <div className="font-bold text-gray-900 truncate">{o.kitchen_name}</div>
                        {o.kitchen_phone && (
                          <a href={`tel:${o.kitchen_phone}`} className="text-[0.6rem] text-orange-700 font-semibold flex items-center gap-1">
                            <Phone className="w-3 h-3" aria-hidden="true" /> {o.kitchen_phone}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 bg-blue-50/50 rounded-xl border border-blue-100">
                      <Truck className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="text-[0.55rem] font-bold text-gray-400 uppercase">Rider</div>
                        <div className="font-bold text-gray-900 truncate">
                          {o.rider_name || (o.status === 'ready' ? 'Waiting for a rider' : 'Not assigned')}
                        </div>
                        {o.rider_phone && (
                          <a href={`tel:${o.rider_phone}`} className="text-[0.6rem] text-blue-700 font-semibold flex items-center gap-1">
                            <Phone className="w-3 h-3" aria-hidden="true" /> {o.rider_phone}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                      <MapPin className="w-4 h-4 text-green-600 shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="text-[0.55rem] font-bold text-gray-400 uppercase">
                          {o.customer_name || 'Customer'}
                        </div>
                        <div className="font-bold text-gray-900 truncate">{addressLine(o.delivery_address)}</div>
                        {o.customer_phone && (
                          <a href={`tel:${o.customer_phone}`} className="text-[0.6rem] text-green-700 font-semibold flex items-center gap-1">
                            <Phone className="w-3 h-3" aria-hidden="true" /> {o.customer_phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {live && (
                  <div className="flex items-center gap-2.5 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100 flex-wrap">
                    {REASSIGNABLE.includes(o.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReassignOrder(o)}
                        className="h-11 px-4 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> {o.delivery_partner_id ? 'Reassign Rider' : 'Assign Rider'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCancelOrder(o)}
                      className="h-11 px-4 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Cancel Order
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
