'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/lib/hooks/use-toast';
import {
  ChefHat,
  Flame,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  AlertTriangle,
  Sliders,
  Utensils,
  Plus,
  Minus,
  Check,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import type { Order } from '@/lib/supabase/types';

interface BatchPrepHubProps {
  orders: Order[];
  vendor: any;
  onRefresh?: () => void;
}

interface BatchItem {
  id: string;
  name: string;
  totalQuantity: number;
  pendingCount: number;
  preparingCount: number;
  readyCount: number;
  customizations: Record<string, number>;
  orderNumbers: string[];
}

export function BatchPrepHub({ orders, vendor, onRefresh }: BatchPrepHubProps) {
  const { toast } = useToast();
  const [dailyCapacity, setDailyCapacity] = useState<number>(25);
  const [isSoldOut, setIsSoldOut] = useState<boolean>(false);
  const [isSavingCapacity, setIsSavingCapacity] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'cooking' | 'ready'>('cooking');
  const [completedBatches, setCompletedBatches] = useState<Record<string, boolean>>({});

  // Load completed checks from localStorage on client
  useEffect(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`rasan_prep_done_${todayStr}`);
      if (saved) {
        setCompletedBatches(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Fetch saved capacity from API
  useEffect(() => {
    const fetchCapacity = async () => {
      try {
        const res = await fetch('/api/vendor/capacity');
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setDailyCapacity(data.data.dailyCapacity || 25);
            setIsSoldOut(Boolean(data.data.isSoldOut));
          }
        }
      } catch {}
    };
    fetchCapacity();
  }, []);

  const saveCapacity = async (newCap: number, newSoldOut?: boolean) => {
    try {
      setIsSavingCapacity(true);
      const res = await fetch('/api/vendor/capacity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyCapacity: newCap,
          ...(newSoldOut !== undefined ? { isSoldOut: newSoldOut } : {}),
        }),
      });
      if (res.ok) {
        toast({
          title: 'Kitchen Capacity Updated',
          description: `Daily limit set to ${newCap} portions.`,
        });
      }
    } catch {
      toast({
        title: 'Update Failed',
        description: 'Could not sync capacity to server.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingCapacity(false);
    }
  };

  // Compute aggregated batches from orders
  const { batches, totalPortions, completedPortions } = useMemo(() => {
    const batchMap: Record<string, BatchItem> = {};
    let total = 0;

    for (const order of orders) {
      if (order.status === 'cancelled') continue;
      const orderNum = order.order_number || (order.id ? order.id.slice(0, 8).toUpperCase() : '');

      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const qty = Number(item.quantity) || 1;
          total += qty;

          const key = (item.name || 'Signature Thali').trim();
          if (!batchMap[key]) {
            batchMap[key] = {
              id: item.meal_id || key,
              name: key,
              totalQuantity: 0,
              pendingCount: 0,
              preparingCount: 0,
              readyCount: 0,
              customizations: {},
              orderNumbers: [],
            };
          }

          batchMap[key].totalQuantity += qty;
          if (!batchMap[key].orderNumbers.includes(orderNum)) {
            batchMap[key].orderNumbers.push(orderNum);
          }

          if (order.status === 'pending' || order.status === 'confirmed') {
            batchMap[key].pendingCount += qty;
          } else if (order.status === 'preparing') {
            batchMap[key].preparingCount += qty;
          } else if (order.status === 'ready' || order.status === 'ready_for_pickup') {
            batchMap[key].readyCount += qty;
          }

          // Aggregated special notes
          if (Array.isArray(item.customizations)) {
            for (const note of item.customizations) {
              const noteKey = String(note).trim();
              if (noteKey) {
                batchMap[key].customizations[noteKey] =
                  (batchMap[key].customizations[noteKey] || 0) + qty;
              }
            }
          }
        }
      }
    }

    const batchList = Object.values(batchMap).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    );

    let doneCount = 0;
    for (const b of batchList) {
      if (completedBatches[b.name]) {
        doneCount += b.totalQuantity;
      }
    }

    return {
      batches: batchList,
      totalPortions: total,
      completedPortions: doneCount,
    };
  }, [orders, completedBatches]);

  const toggleBatchDone = (batchName: string) => {
    const nextState = {
      ...completedBatches,
      [batchName]: !completedBatches[batchName],
    };
    setCompletedBatches(nextState);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem(`rasan_prep_done_${todayStr}`, JSON.stringify(nextState));
    } catch {}

    toast({
      title: !completedBatches[batchName] ? 'Batch Marked Cooked! 🍲' : 'Batch Reopened ⏳',
      description: `${batchName} cooking status updated.`,
    });
  };

  const copyWhatsAppSummary = () => {
    const todayStr = new Date().toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    let text = `*👨‍🍳 ${vendor?.business_name || "Anita's Kitchen"} — Prep Sheet (${todayStr})*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📊 *Target:* ${totalPortions} Portions (${dailyCapacity} Max Cap)\n\n`;

    batches.forEach((b, i) => {
      text += `${i + 1}. *${b.name}* × ${b.totalQuantity} portions\n`;
      const custKeys = Object.keys(b.customizations);
      if (custKeys.length > 0) {
        text += `   ↳ Notes: ${custKeys.map((k) => `${k} (${b.customizations[k]})`).join(', ')}\n`;
      }
      text += `   ↳ Orders: ${b.orderNumbers.slice(0, 4).join(', ')}${b.orderNumbers.length > 4 ? '...' : ''}\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🚀 Generated by Rasan Home Chef Hub`;

    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to Clipboard! 📋',
      description: 'Kitchen batch summary ready to share on WhatsApp.',
    });
  };

  const capacityPercentage = Math.min(100, Math.round((totalPortions / dailyCapacity) * 100));
  const remainingSlots = Math.max(0, dailyCapacity - totalPortions);
  const isAtLimit = totalPortions >= dailyCapacity;

  // Filtered batches for display
  const displayedBatches = batches.filter((b) => {
    if (filterMode === 'all') return true;
    if (filterMode === 'cooking') return !completedBatches[b.name];
    if (filterMode === 'ready') return completedBatches[b.name];
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── KITCHEN CAPACITY & BATCH RADAR ── */}
      <Card className="border-none shadow-2xl bg-gradient-to-br from-[#1A1A1A] via-[#222222] to-[#161616] text-white rounded-[2.5rem] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-[90px] -mr-20 -mt-20"></div>

        <CardContent className="p-8 md:p-10 relative z-10 space-y-8">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-orange-400 text-[0.6rem] font-black uppercase tracking-[0.2em]">
                <Flame className="w-3.5 h-3.5 animate-pulse" />
                Live Kitchen Engine
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tight text-white flex items-center gap-3">
                Daily Batch Prep Hub
                <Badge className="bg-orange-600 text-white font-black text-xs px-3 py-0.5 rounded-full border-none">
                  {totalPortions} Portions Booked
                </Badge>
              </h2>
              <p className="text-xs text-gray-400 font-medium">
                Aggregate meal requirements for today&apos;s orders. Cook in bulk without checking individual tickets.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={copyWhatsAppSummary}
                className="bg-white/5 hover:bg-white/10 text-white border-white/10 rounded-xl font-black text-[0.65rem] uppercase tracking-wider h-11 px-4 gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-orange-400" />
                <span>WhatsApp Sheet</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="bg-white/5 hover:bg-white/10 text-white border-white/10 rounded-xl font-black text-[0.65rem] uppercase tracking-wider h-11 px-4 gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>Print Counter Ticket</span>
              </Button>
            </div>
          </div>

          {/* Capacity Meter Bar */}
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-gray-400">
                  Kitchen Daily Capacity Gauge
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-4xl font-black tracking-tight text-white font-mono">
                    {totalPortions}
                  </span>
                  <span className="text-xl font-bold text-gray-500 font-mono">
                    / {dailyCapacity} max portions
                  </span>
                  <Badge
                    className={`ml-3 rounded-full text-[0.65rem] font-black uppercase tracking-wider px-3 py-0.5 ${
                      isAtLimit || isSoldOut
                        ? 'bg-red-600 text-white animate-pulse'
                        : capacityPercentage >= 80
                        ? 'bg-amber-600 text-white'
                        : 'bg-green-600 text-white'
                    }`}
                  >
                    {isSoldOut
                      ? '🛑 Kitchen Capped (Sold Out)'
                      : isAtLimit
                      ? '🔥 At Capacity'
                      : `🟢 ${remainingSlots} Slots Left`}
                  </Badge>
                </div>
              </div>

              {/* Adjust Capacity Controls */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider hidden sm:inline">
                  Adjust Limit:
                </span>
                <div className="flex items-center bg-white/10 border border-white/10 rounded-2xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.max(5, dailyCapacity - 5);
                      setDailyCapacity(next);
                      saveCapacity(next);
                    }}
                    disabled={isSavingCapacity || dailyCapacity <= 5}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/20 text-white flex items-center justify-center font-black transition disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center font-mono font-black text-sm">
                    {dailyCapacity}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = dailyCapacity + 5;
                      setDailyCapacity(next);
                      saveCapacity(next);
                    }}
                    disabled={isSavingCapacity}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/20 text-white flex items-center justify-center font-black transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const nextSoldOut = !isSoldOut;
                    setIsSoldOut(nextSoldOut);
                    saveCapacity(dailyCapacity, nextSoldOut);
                  }}
                  className={`h-10 px-4 rounded-xl text-[0.65rem] font-black uppercase tracking-wider border-none ${
                    isSoldOut
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-gray-300'
                  }`}
                >
                  {isSoldOut ? 'Reopen Kitchen' : 'Cap Today'}
                </Button>
              </div>
            </div>

            {/* Visual Progress Meter */}
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-700 rounded-full ${
                    isAtLimit || isSoldOut
                      ? 'bg-gradient-to-r from-red-600 to-red-500'
                      : capacityPercentage >= 80
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                      : 'bg-gradient-to-r from-green-500 to-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, capacityPercentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest">
                <span>0</span>
                <span>{capacityPercentage}% Cookload utilized</span>
                <span>{dailyCapacity} Portions</span>
              </div>
            </div>
          </div>

          {/* ── BATCH COOKING CHECKLIST SECTION ── */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-orange-500" />
                <h3 className="text-xl font-black uppercase italic tracking-tight text-white">
                  Batch Cooking Prep Sheet
                </h3>
                <span className="text-xs text-gray-400">
                  ({completedPortions}/{totalPortions} Cooked)
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1.5 bg-white/5 border border-white/10 p-1 rounded-2xl self-start">
                <button
                  type="button"
                  onClick={() => setFilterMode('cooking')}
                  className={`px-3 py-1.5 rounded-xl text-[0.65rem] font-black uppercase tracking-wider transition ${
                    filterMode === 'cooking'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Needs Cooking ({batches.filter((b) => !completedBatches[b.name]).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('ready')}
                  className={`px-3 py-1.5 rounded-xl text-[0.65rem] font-black uppercase tracking-wider transition ${
                    filterMode === 'ready'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Completed ({batches.filter((b) => completedBatches[b.name]).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-xl text-[0.65rem] font-black uppercase tracking-wider transition ${
                    filterMode === 'all'
                      ? 'bg-white/20 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All Items ({batches.length})
                </button>
              </div>
            </div>

            {/* Batch Cards Grid */}
            {displayedBatches.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedBatches.map((batch) => {
                  const isDone = Boolean(completedBatches[batch.name]);
                  const custKeys = Object.keys(batch.customizations);

                  return (
                    <div
                      key={batch.name}
                      onClick={() => toggleBatchDone(batch.name)}
                      className={`cursor-pointer rounded-3xl p-5 border transition-all duration-300 relative group overflow-hidden ${
                        isDone
                          ? 'bg-green-950/20 border-green-800/40 text-gray-300'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-white shadow-lg'
                      }`}
                    >
                      {/* Batch status indicator */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="space-y-0.5">
                          <span className="text-[0.6rem] font-black uppercase tracking-widest text-orange-400">
                            Batch Item
                          </span>
                          <h4
                            className={`text-lg font-black tracking-tight leading-snug uppercase ${
                              isDone ? 'line-through text-gray-400' : 'text-white'
                            }`}
                          >
                            {batch.name}
                          </h4>
                        </div>

                        {/* Portion Counter Badge */}
                        <div
                          className={`px-3 py-1.5 rounded-2xl font-mono font-black text-xl text-center shrink-0 shadow-md ${
                            isDone
                              ? 'bg-green-900/40 text-green-300 border border-green-600/30'
                              : 'bg-orange-600 text-white'
                          }`}
                        >
                          ×{batch.totalQuantity}
                        </div>
                      </div>

                      {/* Orders involved */}
                      <div className="text-[0.65rem] text-gray-400 font-medium flex items-center gap-1.5 mb-3">
                        <ShoppingBag className="w-3 h-3 text-gray-500" />
                        <span className="truncate">
                          Orders: {batch.orderNumbers.slice(0, 3).join(', ')}
                          {batch.orderNumbers.length > 3 ? ` +${batch.orderNumbers.length - 3} more` : ''}
                        </span>
                      </div>

                      {/* Dietary / Special Notes */}
                      {custKeys.length > 0 && (
                        <div className="bg-black/30 rounded-2xl p-2.5 mb-4 border border-white/5 space-y-1">
                          <p className="text-[0.55rem] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Cooking Notes:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {custKeys.map((k) => (
                              <span
                                key={k}
                                className="text-[0.6rem] px-2 py-0.5 rounded-lg bg-white/5 text-gray-300 font-semibold"
                              >
                                {k} ({batch.customizations[k]})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Toggle status CTA */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[0.6rem] font-black uppercase tracking-wider text-gray-400">
                          {isDone ? '✓ Cooked & Ready' : '⏳ Tap to Complete'}
                        </span>
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center transition ${
                            isDone
                              ? 'bg-green-500 text-white'
                              : 'bg-white/10 text-gray-400 group-hover:bg-orange-600 group-hover:text-white'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/5 rounded-3xl p-10 text-center border border-white/10 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                <h4 className="text-lg font-black uppercase italic tracking-tight text-white">
                  {filterMode === 'cooking' ? 'All Batches Cooked! 🎉' : 'Zero Items in this View'}
                </h4>
                <p className="text-xs text-gray-400 font-medium max-w-sm mx-auto">
                  {filterMode === 'cooking'
                    ? 'All current orders have been marked as prepared. Check back when incoming sorties land.'
                    : 'Switch filter view above to see active or completed meals.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
