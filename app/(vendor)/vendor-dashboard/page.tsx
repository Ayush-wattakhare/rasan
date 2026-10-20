'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatsOverview } from '@/components/vendor/stats-overview';
import { RecentOrders } from '@/components/vendor/recent-orders';
import { QuickActions } from '@/components/vendor/quick-actions';
import { BatchPrepHub } from '@/components/vendor/batch-prep-hub';
import { useToast } from '@/lib/hooks/use-toast';
import { orderService } from '@/lib/services/order-service';
import type { Order } from '@/lib/supabase/types';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShieldCheck,
  AlertCircle,
  RefreshCcw,
  Megaphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AudioOrderAlert } from '@/components/vendor/audio-order-alert';
import { countsAsRevenue, netOrderValue } from '@/lib/analytics/revenue';

export default function VendorDashboardPage() {
  const { toast } = useToast();

  const [vendorData, setVendorData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    pendingOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadVendorData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/vendor/check-status');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load vendor profile');
      }

      const vendor = result.data?.vendor;
      if (!vendor) {
        throw new Error('No vendor profile found for this account.');
      }

      setVendorData(vendor);

      try {
        const ordersRes = await fetch('/api/vendor/orders');
        const ordersData = await ordersRes.json();
        const list: Order[] = ordersData.orders || [];
        setAllOrders(list);
        setOrders(list.slice(0, 8));

        const totalOrders = list.length;
        // Same rule as analytics/admin: real money only, cancelled orders and refunds excluded.
        const totalRevenue = (list as any[])
          .filter(countsAsRevenue)
          .reduce((sum, o) => sum + netOrderValue(o), 0);
        const pendingOrders = list.filter(
          (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing'
        ).length;

        setStats({
          totalOrders,
          totalRevenue,
          averageRating: Number(vendor.rating) || 0,
          pendingOrders,
        });
      } catch (orderError) {
        console.warn('Orders fetch note:', orderError);
        setStats({
          totalOrders: 0,
          totalRevenue: 0,
          averageRating: Number(vendor.rating) || 0,
          pendingOrders: 0,
        });
      }
    } catch (err: any) {
      console.error('Failed to load vendor data:', err);
      setError(err.message || 'Could not load vendor operations hub');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendorData();
  }, [loadVendorData]);

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    // Optimistic UI update for instantaneous feedback
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));

    try {
      const res = await fetch('/api/vendor/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      toast({
        title: status === 'ready' ? '🍱 Fresh Meal Ready for Pickup!' : 'Status Synchronized',
        description: `Order #${orderId.slice(0, 8)} status updated to ${status.replace('_', ' ')}.`,
      });
      loadVendorData();
    } catch (err: any) {
      toast({
        title: 'Sync Error',
        description: err.message || 'Failed to update order status',
        variant: 'destructive',
      });
      loadVendorData();
    }
  };

  if (isLoading && !vendorData) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="h-10 w-10 animate-spin text-orange-600" />
          <p className="text-xs font-black tracking-[0.3em] text-gray-400 uppercase italic">
            Connecting to Kitchen Hub...
          </p>
        </div>
      </div>
    );
  }

  if (error && !vendorData) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-gray-900">
              Kitchen Setup Required
            </h2>
            <p className="text-xs font-medium text-gray-500">{error}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={loadVendorData}
              className="h-12 rounded-xl bg-orange-600 text-xs font-black tracking-widest text-white uppercase hover:bg-orange-500"
            >
              Retry Connection
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-xl border-gray-200 text-xs font-black tracking-widest text-gray-700 uppercase"
            >
              <Link href="/become-vendor">Configure Kitchen Profile</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      <AudioOrderAlert
        pendingCount={stats.pendingOrders}
        vendorId={vendorData?.id}
        onRefresh={loadVendorData}
      />
      {/* MISSION HERO */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-12 md:py-16">
        <div className="absolute top-0 right-0 -mt-32 -mr-32 h-96 w-96 rounded-full bg-orange-600/10 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 -mb-32 -ml-32 h-64 w-64 rounded-full bg-red-600/5 blur-[100px]"></div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
                <LayoutDashboard className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-[0.6rem] font-black tracking-[0.3em] text-white uppercase italic">
                  Kitchen Operations Hub
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-4xl leading-none font-black tracking-tighter text-white uppercase italic md:text-6xl">
                  CHEF <br />
                  <span className="text-orange-500">
                    {vendorData?.business_name || "Anita's Kitchen"}
                  </span>
                </h1>
                <p className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">
                  Kitchen Status:{' '}
                  <span className="font-black text-green-400">● Online & Receiving</span>
                  <span className="text-gray-600">•</span>
                  <span>{vendorData?.address || 'Pimpri-Chinchwad, Pune'}</span>
                </p>
              </div>

              {/* CHEF PASS */}
              <div className="flex max-w-md items-center gap-5 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600 text-2xl font-black text-white italic shadow-lg">
                  {vendorData?.business_name?.charAt(0) || '👩‍🍳'}
                </div>
                <div className="space-y-0.5">
                  <div className="text-[0.55rem] font-black tracking-widest text-orange-400 uppercase">
                    VERIFIED HOME CHEF
                  </div>
                  <div className="text-lg font-black tracking-tight text-white uppercase italic">
                    {vendorData?.business_name || 'Your Kitchen'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.6rem] font-bold tracking-wider text-gray-400 uppercase">
                    <ShieldCheck className="h-3.5 w-3.5 text-orange-400" /> ID:{' '}
                    {vendorData?.id ? vendorData.id.slice(0, 8).toUpperCase() : 'PARTNER-01'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 w-full sm:w-auto">
              <Button
                size="lg"
                onClick={() => {
                  const newStatus = !vendorData?.is_paused;
                  setVendorData({ ...vendorData, is_paused: newStatus });
                  toast({
                    title: newStatus ? 'Kitchen Paused (30 Mins)' : 'Kitchen Active',
                    description: newStatus
                      ? 'Incoming orders temporarily paused during peak hours.'
                      : 'Receiving orders normally.',
                  });
                }}
                className={`${
                  vendorData?.is_paused
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-gray-800 hover:bg-gray-700'
                } h-12 sm:h-14 rounded-2xl px-5 sm:px-6 text-xs font-black tracking-widest text-white uppercase shadow-xl transition-all w-full sm:w-auto`}
              >
                {vendorData?.is_paused ? '⏸️ Kitchen Paused' : '⚡ Pause Orders (30m)'}
              </Button>

              <Button
                size="lg"
                className="h-12 sm:h-14 rounded-2xl bg-amber-600 px-5 sm:px-7 text-xs font-black tracking-widest text-white uppercase shadow-xl transition-all hover:bg-amber-500 w-full sm:w-auto"
                asChild
              >
                <Link href="/subscriber-broadcast">
                  <Megaphone className="mr-2 h-4 w-4 shrink-0" />
                  <span>Kitchen Circle &amp; Broadcast</span>
                </Link>
              </Button>

              <Button
                size="lg"
                className="h-12 sm:h-14 rounded-2xl bg-orange-600 px-6 sm:px-8 text-xs font-black tracking-widest text-white uppercase shadow-xl transition-all hover:bg-orange-500 w-full sm:w-auto"
                asChild
              >
                <Link href="/menu-management">
                  <UtensilsCrossed className="mr-2 h-4 w-4 shrink-0" />
                  <span>Manage Menu</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-20 container mx-auto -mt-8 px-4">
        <div className="space-y-10">
          {/* Stats Overview */}
          <StatsOverview stats={stats} />

          {/* Chef Batch Prep Calculator & Kitchen Capacity Hub */}
          <BatchPrepHub orders={allOrders} vendor={vendorData} onRefresh={loadVendorData} />

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase italic">
                  Live Orders & Ingestion
                </h2>
                <div className="mx-4 h-0.5 flex-1 bg-gray-100"></div>
              </div>
              <RecentOrders orders={orders} onUpdateStatus={handleUpdateStatus} />
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="mb-4 flex items-center gap-4">
                <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase italic">
                  Kitchen Controls
                </h2>
                <div className="h-0.5 flex-1 bg-gray-100"></div>
              </div>
              <QuickActions />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
