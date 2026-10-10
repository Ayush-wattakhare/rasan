'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatsOverview } from '@/components/vendor/stats-overview';
import { RecentOrders } from '@/components/vendor/recent-orders';
import { QuickActions } from '@/components/vendor/quick-actions';
import { BatchPrepHub } from '@/components/vendor/batch-prep-hub';
import { useToast } from '@/lib/hooks/use-toast';
import { orderService } from '@/lib/services/order-service';
import type { Order } from '@/lib/supabase/types';
import { LayoutDashboard, UtensilsCrossed, ShieldCheck, AlertCircle, RefreshCcw, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function VendorDashboardPage() {
  const { toast } = useToast();

  const [vendorData, setVendorData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 4.9,
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
        const totalRevenue = list
          .filter((o) => o.payment_status === 'paid')
          .reduce((sum, o) => sum + (o.total || 0), 0);
        const pendingOrders = list.filter(
          (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing'
        ).length;

        setStats({
          totalOrders,
          totalRevenue,
          averageRating: Number(vendor.rating) || 5.0,
          pendingOrders,
        });
      } catch (orderError) {
        console.warn('Orders fetch note:', orderError);
        setStats({
          totalOrders: 0,
          totalRevenue: 0,
          averageRating: Number(vendor.rating) || 5.0,
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
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );

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
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="w-10 h-10 text-orange-600 animate-spin" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] italic">
            Connecting to Kitchen Hub...
          </p>
        </div>
      </div>
    );
  }

  if (error && !vendorData) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Kitchen Setup Required</h2>
            <p className="text-xs text-gray-500 font-medium">{error}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={loadVendorData}
              className="bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl h-12 uppercase tracking-widest text-xs"
            >
              Retry Connection
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-gray-200 text-gray-700 font-black rounded-xl h-12 uppercase tracking-widest text-xs"
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
      {/* MISSION HERO */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-12 md:py-16">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/5 rounded-full blur-[100px] -ml-32 -mb-32"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <LayoutDashboard className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.3em] italic">
                  Kitchen Operations Hub
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                  CHEF <br />
                  <span className="text-orange-500">{vendorData?.business_name || "Anita's Kitchen"}</span>
                </h1>
                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-2">
                  Kitchen Status: <span className="text-green-400 font-black">● Online & Receiving</span>
                  <span className="text-gray-600">•</span>
                  <span>{vendorData?.address || 'Pimpri-Chinchwad, Pune'}</span>
                </p>
              </div>

              {/* CHEF PASS */}
              <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-5 flex items-center gap-5 max-w-md shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-black text-2xl italic shadow-lg">
                  {vendorData?.business_name?.charAt(0) || '👩‍🍳'}
                </div>
                <div className="space-y-0.5">
                  <div className="text-[0.55rem] font-black text-orange-400 uppercase tracking-widest">
                    VERIFIED HOME CHEF
                  </div>
                  <div className="text-lg font-black text-white uppercase italic tracking-tight">
                    {vendorData?.business_name || "Anita's Home Kitchen"}
                  </div>
                  <div className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-400" /> ID: {vendorData?.id ? vendorData.id.slice(0, 8).toUpperCase() : 'PARTNER-01'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
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
                  vendorData?.is_paused ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-800 hover:bg-gray-700'
                } text-white font-black uppercase tracking-widest h-14 px-6 rounded-2xl shadow-xl transition-all text-xs`}
              >
                {vendorData?.is_paused ? '⏸️ Kitchen Paused' : '⚡ Pause Orders (30m)'}
              </Button>

              <Button
                size="lg"
                className="bg-amber-600 hover:bg-amber-500 text-white font-black uppercase tracking-widest h-14 px-7 rounded-2xl shadow-xl transition-all text-xs"
                asChild
              >
                <Link href="/subscriber-broadcast">
                  <Megaphone className="w-4 h-4 mr-2" />
                  Kitchen Circle & Broadcast
                </Link>
              </Button>

              <Button
                size="lg"
                className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest h-14 px-8 rounded-2xl shadow-xl transition-all text-xs"
                asChild
              >
                <Link href="/menu-management">
                  <UtensilsCrossed className="w-4 h-4 mr-2" />
                  Manage Menu
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="space-y-10">
          {/* Stats Overview */}
          <StatsOverview stats={stats} />

          {/* Chef Batch Prep Calculator & Kitchen Capacity Hub */}
          <BatchPrepHub
            orders={allOrders}
            vendor={vendorData}
            onRefresh={loadVendorData}
          />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">
                  Live Orders & Ingestion
                </h2>
                <div className="h-0.5 flex-1 bg-gray-100 mx-4"></div>
              </div>
              <RecentOrders orders={orders} onUpdateStatus={handleUpdateStatus} />
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="mb-4 flex items-center gap-4">
                <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">
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
