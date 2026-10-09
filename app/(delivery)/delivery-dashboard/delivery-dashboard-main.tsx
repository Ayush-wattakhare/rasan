'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import NavigationMap from '@/components/delivery/navigation-map';
import { OrderLocationPreviewModal } from '@/components/delivery/order-location-preview-modal';
import { RedeemModal } from '@/components/payouts/redeem-modal';
import { DeliveryOtpModal } from '@/components/delivery/delivery-otp-modal';
import { ClockBadge } from '@/components/delivery/clock-badge';
import LocationTracker from '@/components/delivery/location-tracker';
import { createClient } from '@/lib/supabase/client';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Navigation, 
  Truck, 
  CheckCircle, 
  Route, 
  RefreshCw, 
  Zap, 
  Activity, 
  ChevronRight,
  Loader2,
  Layers,
  Home,
  Package,
  KeyRound
} from 'lucide-react';

interface DeliveryPartner {
  id: string;
  is_online: boolean;
  rating: number;
  total_deliveries: number;
  earnings: {
    today: number;
    this_week: number;
    this_month: number;
    total: number;
  };
  vehicle_type: string;
  vehicle_number: string;
  current_location?: {
    type: 'Point';
    coordinates: [number, number];
  } | null;
}

interface DeliveryDashboardMainProps {
  deliveryPartner: DeliveryPartner;
  profile: any;
  activeDeliveries: any[];
  availableOrders: any[];
  todayEarnings: number;
}

export default function DeliveryDashboardMain({
  deliveryPartner,
  profile,
  activeDeliveries: initialActiveDeliveries,
  availableOrders: initialAvailableOrders,
  todayEarnings: initialTodayEarnings,
}: DeliveryDashboardMainProps) {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(deliveryPartner.is_online);
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>(initialActiveDeliveries);
  const [availableOrders, setAvailableOrders] = useState<any[]>(initialAvailableOrders);
  const [todayEarnings, setTodayEarnings] = useState<number>(initialTodayEarnings);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedPreviewOrder, setSelectedPreviewOrder] = useState<any | null>(null);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [totalYield, setTotalYield] = useState<number>(deliveryPartner.earnings?.total || 1450);
  const [otpModalOrder, setOtpModalOrder] = useState<any | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const openGoogleMapsNavigation = (destination: string) => {
    if (!destination) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const fetchLiveOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/delivery/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.activeDeliveries) setActiveDeliveries(data.activeDeliveries);
        if (data.availableOrders) setAvailableOrders(data.availableOrders);
      }
    } catch (err) {
      console.warn('Error fetching live delivery orders:', err);
    }
  }, []);

  useEffect(() => {
    setIsClientReady(true);

    const pollInterval = setInterval(fetchLiveOrders, 30000);

    // Realtime Supabase Subscription on orders
    const supabase = createClient();
    const channel = supabase
      .channel('delivery-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchLiveOrders();
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchLiveOrders]);

  // Group available orders into "Bunch Batches" (Same Kitchen + Same Destination Area, up to 5 orders)
  const bunchBatches = useMemo(() => {
    const map: Record<string, any[]> = {};

    for (const order of availableOrders) {
      const vendorName = order.vendors?.business_name || "Anita's Home Kitchen";
      const area =
        order.delivery_address?.city ||
        order.delivery_address?.street?.split(',').pop()?.trim() ||
        'Pimpri-Chinchwad';
      const key = `${vendorName}__${area}`;

      if (!map[key]) map[key] = [];
      if (map[key].length < 5) {
        map[key].push(order);
      }
    }

    return Object.entries(map).map(([key, orders]) => {
      const [vendorName, area] = key.split('__');
      const totalBounty = orders.reduce((sum, o) => sum + (o.delivery_fee || 40), 0);
      return {
        key,
        vendorName,
        area,
        orders,
        count: orders.length,
        totalBounty,
        orderIds: orders.map((o) => o.id),
      };
    });
  }, [availableOrders]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLiveOrders();
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    try {
      const response = await fetch('/api/delivery/toggle-online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryPartnerId: deliveryPartner.id, isOnline: newStatus }),
      });
      if (response.ok) {
        fetchLiveOrders();
      } else {
        setIsOnline(!newStatus);
      }
    } catch {
      setIsOnline(!newStatus);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setActionLoadingId(orderId);
    setActiveDeliveries((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );

    try {
      const response = await fetch('/api/delivery/update-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      if (response.ok) {
        if (status === 'delivered') {
          setTodayEarnings((prev) => prev + 45);
        }
        await fetchLiveOrders();
        router.refresh();
      }
    } catch (error) {
      console.error('Update status failure:', error);
      fetchLiveOrders();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleVerifyOtpAndDeliver = async (otp: string) => {
    if (!otpModalOrder) return;
    setIsVerifyingOtp(true);
    try {
      const response = await fetch('/api/delivery/update-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: otpModalOrder.id,
          status: 'delivered',
          otp,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'PIN verification failed');
      }

      setTodayEarnings((prev) => prev + 45);
      await fetchLiveOrders();
      router.refresh();
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const acceptOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const targetOrder = availableOrders.find((o) => o.id === orderId);
      if (targetOrder) {
        setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
        setActiveDeliveries((prev) => [
          { ...targetOrder, delivery_partner_id: deliveryPartner.id, status: 'picked_up' },
          ...prev,
        ]);
      }

      setSelectedPreviewOrder(null);

      const resp = await fetch('/api/delivery/accept-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, deliveryPartnerId: deliveryPartner.id }),
      });

      if (resp.ok) {
        await fetchLiveOrders();
        router.refresh();
      }
    } catch (e) {
      console.error('Accept failure:', e);
      fetchLiveOrders();
    } finally {
      setActionLoadingId(null);
    }
  };

  const acceptBunchBatch = async (orderIds: string[]) => {
    const batchKey = orderIds.join(',');
    setActionLoadingId(batchKey);
    try {
      const acceptedItems = availableOrders.filter((o) => orderIds.includes(o.id));
      setAvailableOrders((prev) => prev.filter((o) => !orderIds.includes(o.id)));
      setActiveDeliveries((prev) => [
        ...acceptedItems.map((o) => ({ ...o, delivery_partner_id: deliveryPartner.id, status: 'picked_up' })),
        ...prev,
      ]);

      const resp = await fetch('/api/delivery/accept-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds, deliveryPartnerId: deliveryPartner.id }),
      });

      if (resp.ok) {
        await fetchLiveOrders();
        router.refresh();
      }
    } catch (e) {
      console.error('Batch accept error:', e);
      fetchLiveOrders();
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── REAL-TIME GEOLOCATION STREAM ──
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 18.6279,
    lng: 73.8009,
  });

  useEffect(() => {
    if (!isOnline || !isClientReady || typeof window === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });

        const lastUpdate = localStorage.getItem('last_location_sync');
        const now = Date.now();
        if (!lastUpdate || now - parseInt(lastUpdate) > 10000) {
          fetch(`/api/delivery/update-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              deliveryPartnerId: deliveryPartner.id,
              latitude,
              longitude,
            }),
          }).then(() => {
            localStorage.setItem('last_location_sync', now.toString());
          }).catch(() => {});
        }
      },
      (error) => {
        console.warn('Location notice (using local delivery area fallback):', error?.message || 'Default');
        setCurrentCoords((prev) => prev || { lat: 18.6279, lng: 73.8009 });
      },
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 10000 }
    );

    return () => {
      try {
        navigator.geolocation.clearWatch(watchId);
      } catch {}
    };
  }, [isOnline, isClientReady, deliveryPartner.id]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-blue-600 text-white',
      preparing: 'bg-yellow-600 text-white',
      ready: 'bg-emerald-600 text-white',
      ready_for_pickup: 'bg-emerald-600 text-white',
      picked_up: 'bg-purple-600 text-white',
      out_for_delivery: 'bg-orange-600 text-white',
      delivered: 'bg-gray-900 text-white',
    };
    return colors[status] || 'bg-gray-400 text-white';
  };

  return (
    <>
      <OrderLocationPreviewModal
        order={selectedPreviewOrder}
        isOpen={!!selectedPreviewOrder}
        onClose={() => setSelectedPreviewOrder(null)}
        onAccept={acceptOrder}
        isAccepting={actionLoadingId === selectedPreviewOrder?.id}
      />

      <RedeemModal
        isOpen={isRedeemOpen}
        onClose={() => setIsRedeemOpen(false)}
        availableBalance={totalYield}
        userRole="delivery"
        onSuccess={(amt) => {
          setTotalYield((prev) => Math.max(0, prev - amt));
          setTodayEarnings((prev) => Math.max(0, prev - amt));
        }}
      />

      <DeliveryOtpModal
        isOpen={isOtpModalOpen}
        onClose={() => {
          setIsOtpModalOpen(false);
          setOtpModalOrder(null);
        }}
        order={otpModalOrder}
        onVerify={handleVerifyOtpAndDeliver}
        isLoading={isVerifyingOtp}
      />

      <div className="min-h-screen bg-[#FAFAF9] pb-32">
        {/* ── TACTICAL HUD HEADER ── */}
        <section className="relative overflow-hidden bg-[#1A1A1A] py-12 md:py-16 text-white border-b border-white/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/5 rounded-full blur-[100px] -ml-32 -mb-32"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                  <Activity className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                  <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.3em] italic">
                    Rider Tactical Matrix v4.2
                  </span>
                  <span className="text-white/20">|</span>
                  <ClockBadge />
                </div>

                <div className="space-y-1">
                  <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                    PILOT <span className="text-orange-500">{profile?.name?.split(' ')[0] || 'ROHAN'}</span>
                  </h1>
                  <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-ping' : 'bg-red-500'}`} />
                    DUTY STATUS: <span className={isOnline ? 'text-green-400 font-black' : 'text-red-400 font-black'}>{isOnline ? 'ONLINE & TRANSMITTING' : 'OFFLINE'}</span>
                    <span className="text-gray-600">•</span>
                    <span>VEHICLE: {deliveryPartner.vehicle_number || 'MH 14 DA 2024'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <Button
                  onClick={() => setIsRedeemOpen(true)}
                  className="bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest h-14 px-6 rounded-2xl shadow-xl text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  REDEEM YIELD (₹{totalYield})
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest h-14 rounded-2xl text-xs backdrop-blur-md"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  SYNC
                </Button>

                <Button
                  size="lg"
                  onClick={toggleOnlineStatus}
                  className={`${isOnline ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white font-black uppercase tracking-widest h-14 px-8 rounded-2xl shadow-xl text-xs transition-all`}
                >
                  {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── METRIC TILES ── */}
        <div className="container mx-auto px-4 -mt-8 relative z-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
            <Card className="border-none shadow-xl bg-white rounded-3xl p-6 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest mb-1">Today's Payout</div>
                  <div className="text-3xl font-black text-gray-900 tracking-tighter italic">₹{todayEarnings}</div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsRedeemOpen(true)}
                  className="bg-green-50 hover:bg-green-100 text-green-700 font-black text-[0.6rem] uppercase tracking-wider rounded-xl h-8 px-2.5 border border-green-200"
                >
                  ⚡ Cashout
                </Button>
              </div>
              <div className="text-[0.6rem] font-bold text-green-600 uppercase mt-2 flex items-center gap-1">
                <span>Instant UPI & Bank Transfer</span>
              </div>
            </Card>

            <Card className="border-none shadow-xl bg-white rounded-3xl p-6">
              <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest mb-1">Active Missions</div>
              <div className="text-3xl font-black text-orange-600 tracking-tighter italic">{activeDeliveries.length}</div>
              <div className="text-[0.6rem] font-bold text-gray-400 uppercase mt-1">In Motion</div>
            </Card>

            <Card className="border-none shadow-xl bg-white rounded-3xl p-6">
              <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest mb-1">Trust Rating</div>
              <div className="text-3xl font-black text-gray-900 tracking-tighter italic">★ {deliveryPartner.rating || 4.9}</div>
              <div className="text-[0.6rem] font-bold text-gray-400 uppercase mt-1">Top Tier Rider</div>
            </Card>

            <Card className="border-none shadow-xl bg-white rounded-3xl p-6">
              <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest mb-1">Total Deliveries</div>
              <div className="text-3xl font-black text-gray-900 tracking-tighter italic">{deliveryPartner.total_deliveries || 48}</div>
              <div className="text-[0.6rem] font-bold text-gray-400 uppercase mt-1">Completed Sorties</div>
            </Card>
          </div>

          {/* ── MAIN WORKSPACE ── */}
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Active Deliveries */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tactical GPS & Route Simulation Engine */}
              <LocationTracker
                deliveryPartnerId={deliveryPartner.id}
                isActive={isOnline}
                activeOrder={activeDeliveries[0] || null}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">Active Deliveries</h2>
                  <Badge className="bg-orange-600 text-white rounded-full text-[0.65rem] px-3">
                    {activeDeliveries.length} IN MOTION
                  </Badge>
                </div>
              </div>

              {activeDeliveries.length > 0 ? (
                <div className="space-y-6">
                  {activeDeliveries.map((order) => {
                    const vendorName = order.vendors?.business_name || "Anita's Home Kitchen";
                    const vendorAddress = order.vendors?.address || 'Pimpri Colony, Pimpri-Chinchwad, Pune';
                    const customerAddress = order.delivery_address?.street || 'Rahatani, Pimpri-Chinchwad';
                    const customerName = order.profiles?.name || 'Customer';
                    const orderNum = order.order_number || (order.id ? order.id.slice(0, 8) : 'ORD-01');

                    return (
                      <Card key={order.id} className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden border-l-8 border-orange-600">
                        <CardContent className="p-6 md:p-8 space-y-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">
                                ACTIVE SORTIE #{orderNum}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`${getStatusColor(order.status)} font-black uppercase tracking-wider text-[0.65rem] px-3 py-1 rounded-full border-none`}>
                                  {order.status === 'ready' ? 'Ready for Pickup' : order.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">BOUNTY</div>
                              <div className="text-2xl font-black text-green-600 italic">₹{order.delivery_fee || 40}</div>
                            </div>
                          </div>

                          {/* Pickup and Drop Details */}
                          <div className="grid md:grid-cols-2 gap-6 bg-gray-50/70 p-5 rounded-2xl border border-gray-100">
                            {/* Pickup Node */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-[0.6rem] font-black uppercase tracking-widest text-orange-600">
                                <Home className="w-3.5 h-3.5" /> PICKUP: {vendorName}
                              </div>
                              <p className="text-xs text-gray-700 font-bold">{vendorAddress}</p>
                            </div>

                            {/* Drop Node */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-[0.6rem] font-black uppercase tracking-widest text-blue-600">
                                <MapPin className="w-3.5 h-3.5" /> DROP: {customerName}
                              </div>
                              <p className="text-xs text-gray-700 font-bold">{customerAddress}</p>
                            </div>
                          </div>

                          {/* Tactical Actions with 1-Tap Google Maps Navigation & Handover OTP */}
                          <div className="pt-2 flex flex-col sm:flex-row gap-3">
                            {['ready', 'ready_for_pickup'].includes(order.status) && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="lg"
                                  onClick={() => openGoogleMapsNavigation(vendorAddress)}
                                  className="bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 font-black uppercase tracking-widest h-14 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
                                >
                                  <Navigation className="w-4 h-4 text-orange-600" />
                                  <span>Kitchen GPS 🧭</span>
                                </Button>
                                <Button
                                  size="lg"
                                  disabled={actionLoadingId === order.id}
                                  onClick={() => updateOrderStatus(order.id, 'picked_up')}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg text-xs"
                                >
                                  {actionLoadingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CONFIRM PICKUP FROM KITCHEN 🥡'}
                                </Button>
                              </>
                            )}

                            {order.status === 'picked_up' && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="lg"
                                  onClick={() => {
                                    const dropTarget = order.delivery_address?.coordinates?.lat && order.delivery_address?.coordinates?.lng
                                      ? `${order.delivery_address.coordinates.lat},${order.delivery_address.coordinates.lng}`
                                      : customerAddress;
                                    openGoogleMapsNavigation(dropTarget);
                                  }}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-black uppercase tracking-widest h-14 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
                                >
                                  <Navigation className="w-4 h-4 text-blue-600" />
                                  <span>Drop GPS 🧭</span>
                                </Button>
                                <Button
                                  size="lg"
                                  disabled={actionLoadingId === order.id}
                                  onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg text-xs"
                                >
                                  {actionLoadingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'START DELIVERY ROUTE 🛵'}
                                </Button>
                              </>
                            )}

                            {order.status === 'out_for_delivery' && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="lg"
                                  onClick={() => {
                                    const dropTarget = order.delivery_address?.coordinates?.lat && order.delivery_address?.coordinates?.lng
                                      ? `${order.delivery_address.coordinates.lat},${order.delivery_address.coordinates.lng}`
                                      : customerAddress;
                                    openGoogleMapsNavigation(dropTarget);
                                  }}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-black uppercase tracking-widest h-14 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
                                >
                                  <Navigation className="w-4 h-4 text-blue-600" />
                                  <span>Drop GPS 🧭</span>
                                </Button>
                                <Button
                                  size="lg"
                                  disabled={actionLoadingId === order.id}
                                  onClick={() => {
                                    setOtpModalOrder(order);
                                    setIsOtpModalOpen(true);
                                  }}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg text-xs flex items-center justify-center gap-2"
                                >
                                  <KeyRound className="w-4 h-4" />
                                  <span>VERIFY PIN & COMPLETE 🔐</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-gray-100">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <Route className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">Zero Active Deliveries</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">
                    Click any opportunity on the right to view pickup & drop route and accept delivery!
                  </p>
                </div>
              )}
            </div>

            {/* Available Pickups & Bunch Batches */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">New Opportunities</h2>
                <Badge className="bg-green-600 text-white rounded-full text-[0.65rem] px-3">
                  {availableOrders.length} READY
                </Badge>
              </div>

              {isOnline && availableOrders.length > 0 ? (
                <div className="space-y-4">
                  {/* Bunch Batch Cards (if multiple orders from same kitchen to same area) */}
                  {bunchBatches.map((batch) => {
                    const isMulti = batch.count > 1;
                    const isAcceptingBatch = actionLoadingId === batch.orderIds.join(',');

                    if (!isMulti) return null;

                    return (
                      <Card
                        key={batch.key}
                        className="border-2 border-amber-400 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white rounded-3xl overflow-hidden shadow-lg p-5 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                              <Layers className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-[0.6rem] font-black text-amber-900 uppercase tracking-widest">
                                BUNCH BATCH CLUSTER
                              </div>
                              <h4 className="text-base font-black text-gray-900 tracking-tight">
                                {batch.count} Orders Ready from {batch.vendorName}
                              </h4>
                            </div>
                          </div>
                          <Badge className="bg-amber-500 text-white font-black text-xs px-2.5 py-1">
                            ₹{batch.totalBounty}
                          </Badge>
                        </div>

                        <div className="text-xs text-amber-950 font-medium bg-amber-50 p-2.5 rounded-xl flex items-center justify-between">
                          <span>📍 Deliver together to <strong>{batch.area}</strong></span>
                          <span className="font-bold text-amber-700">1 Kitchen Pickup</span>
                        </div>

                        <Button
                          disabled={isAcceptingBatch}
                          onClick={() => acceptBunchBatch(batch.orderIds)}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest h-12 rounded-xl text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isAcceptingBatch ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Zap className="w-4 h-4" /> ACCEPT BUNCH BATCH ({batch.count} ORDERS)
                            </>
                          )}
                        </Button>
                      </Card>
                    );
                  })}

                  {/* Individual Available Order Cards */}
                  {availableOrders.map((order) => {
                    const vendorName = order.vendors?.business_name || "Anita's Home Kitchen";
                    const dropStreet = order.delivery_address?.street || 'Pimpri-Chinchwad';
                    const orderNum = order.order_number || (order.id ? order.id.slice(0, 8) : 'ORD-01');

                    return (
                      <Card
                        key={order.id}
                        className="border border-gray-100 shadow-md hover:shadow-xl bg-white rounded-3xl overflow-hidden transition-all group cursor-pointer"
                        onClick={() => setSelectedPreviewOrder(order)}
                      >
                        <CardContent className="p-5 space-y-3.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">
                                READY FOR PICKUP #{orderNum}
                              </div>
                              <h4 className="text-xl font-black text-gray-900 italic tracking-tight">
                                BOUNTY: ₹{order.delivery_fee || 40}
                              </h4>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                              <Zap className="w-4 h-4 fill-current" />
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs font-semibold text-gray-700 bg-gray-50/80 p-3 rounded-2xl">
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-[0.6rem] font-black text-orange-600 uppercase">FROM:</span>
                              <span className="font-bold text-gray-900 truncate">{vendorName}</span>
                            </div>
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-[0.6rem] font-black text-blue-600 uppercase">TO:</span>
                              <span className="font-bold text-gray-900 truncate">{dropStreet}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPreviewOrder(order);
                              }}
                              className="flex-1 h-11 rounded-xl text-[0.65rem] font-black uppercase tracking-wider text-gray-700 border-gray-200 hover:bg-gray-100"
                            >
                              📍 View Route
                            </Button>
                            <Button
                              type="button"
                              disabled={actionLoadingId === order.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                acceptOrder(order.id);
                              }}
                              className="flex-1 bg-[#1A1A1A] hover:bg-green-600 text-white font-black uppercase tracking-widest h-11 rounded-xl text-[0.65rem] transition-all flex items-center justify-center gap-1.5"
                            >
                              {actionLoadingId === order.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>ACCEPT <ChevronRight className="w-3.5 h-3.5" /></>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <h4 className="text-sm font-black text-gray-900 uppercase">Awaiting Ready Orders</h4>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    When home chefs finish cooking and mark orders as ready, they will ping here instantly!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}