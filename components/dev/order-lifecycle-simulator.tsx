'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  KeyRound,
  ChefHat,
  Truck,
  ShieldCheck,
  User,
  Navigation,
  ArrowRight,
  ExternalLink,
  Flame,
  Check,
  Loader2,
  Radio,
  Landmark,
  Percent,
  Sparkles,
  MapPin,
  Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface OrderLifecycleSimulatorProps {}

const STAGES = [
  { id: '1_placed', label: '1. Order Placed', role: 'Customer', desc: '4-Digit PIN Generated' },
  { id: '2_cooking', label: '2. Kitchen Prep', role: 'Home Chef', desc: 'Small-Batch Cooking' },
  { id: '3_ready', label: '3. Food Packed', role: 'Home Chef', desc: 'Dispatched to Fleet' },
  { id: '4_en_route', label: '4. En-Route GPS', role: 'Delivery Rider', desc: 'Transmitting Route' },
  { id: '5_delivered', label: '5. Doorstep Handover', role: 'All Parties', desc: 'PIN Verified & Settled' },
];

export function OrderLifecycleSimulator() {
  const [simulation, setSimulation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSimulationState = async () => {
    try {
      const res = await fetch('/api/dev/simulate-lifecycle');
      const data = await res.json();
      if (data.active && data.simulation) {
        setSimulation(data.simulation);
      } else {
        // Automatically start initial simulation
        await handleAction('start_or_reset');
      }
    } catch (err) {
      console.error('Failed to load simulation state', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulationState();
  }, []);

  const handleAction = async (action: string) => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/dev/simulate-lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success && data.simulation) {
        setSimulation(data.simulation);
      }
    } catch (err) {
      console.error(`Error executing action ${action}:`, err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // ── Auto-Play Runner ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAutoPlaying) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(async () => {
      setSimulation((current: any) => {
        if (!current) return current;

        if (current.stage === '1_placed') {
          handleAction('chef_accept_cook');
        } else if (current.stage === '2_cooking') {
          handleAction('chef_ready_packed');
        } else if (current.stage === '3_ready') {
          handleAction('rider_accept_pickup');
        } else if (current.stage === '4_en_route') {
          if ((current.rider?.routeProgress || 0) < 90) {
            handleAction('rider_step_gps');
          } else {
            handleAction('doorstep_handover_verify');
          }
        } else if (current.stage === '5_delivered') {
          setIsAutoPlaying(false);
        }
        return current;
      });
    }, 4000);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying]);

  const currentStageIndex = STAGES.findIndex((s) => s.id === simulation?.stage);

  return (
    <div className="space-y-8">
      {/* ── CONTROLLER HERO DOCK ── */}
      <div className="bg-[#141414] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-orange-400 text-[0.6rem] font-black uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" /> 4-Party Ecosystem Orchestrator
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase italic tracking-tight">
              Order Lifecycle <span className="text-orange-500">Master Simulator</span>
            </h2>
            <p className="text-xs text-gray-400 font-semibold mt-1">
              Live automated walkthrough connecting Customer ➔ Home Chef ➔ Delivery Rider ➔ Admin Treasury.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer ${
                isAutoPlaying
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white'
              }`}
            >
              {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              {isAutoPlaying ? 'Pause Auto-Play' : 'Auto-Run Cycle (30s)'}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setIsAutoPlaying(false);
                handleAction('start_or_reset');
              }}
              disabled={isActionLoading}
              className="h-12 px-5 bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className={`w-4 h-4 ${isActionLoading ? 'animate-spin' : ''}`} /> Reset
            </Button>
          </div>
        </div>

        {/* ── 5-STAGE PROGRESSION RIBBON ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mt-8 pt-6 border-t border-white/10 relative z-10">
          {STAGES.map((stg, idx) => {
            const isCompleted = currentStageIndex > idx;
            const isCurrent = currentStageIndex === idx;

            return (
              <div
                key={stg.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-orange-500/15 border-orange-500/50 shadow-md ring-1 ring-orange-500/30'
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-white/5 border-white/5 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[0.6rem] font-black uppercase tracking-wider ${
                    isCurrent ? 'text-orange-400' : isCompleted ? 'text-emerald-400' : 'text-gray-400'
                  }`}>
                    {stg.role}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <Radio className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-white/20" />
                  )}
                </div>
                <h4 className="text-xs font-black text-white truncate">{stg.label}</h4>
                <p className="text-[0.6rem] text-gray-400 font-medium truncate mt-0.5">{stg.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4-ROLE LIVE WORKSPACES GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. CUSTOMER PERSPECTIVE */}
        <Card className="rounded-3xl border border-gray-100 shadow-xl overflow-hidden bg-white">
          <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">Customer Experience</h4>
                <p className="text-[0.65rem] text-amber-100 font-medium">Ordering, Live Tracking & Handover PIN</p>
              </div>
            </div>
            <Link
              href="/orders"
              className="text-[0.6rem] font-black uppercase bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-xl transition flex items-center gap-1"
            >
              Open Orders <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-gray-100">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[0.65rem]">Active Order</span>
              <span className="font-mono font-black text-gray-900">{simulation?.orderNumber || 'ORD-SIM-2026'}</span>
            </div>

            {/* OTP Handover PIN Box */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-[0.65rem] font-black uppercase tracking-wider text-orange-100">
                  <KeyRound className="w-3.5 h-3.5" /> Handover Security PIN
                </div>
                <p className="text-[0.65rem] text-orange-100/90 font-medium">Show to rider upon arrival</p>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-xl text-center backdrop-blur-xs font-mono font-black text-2xl tracking-widest text-white">
                {simulation?.otpPin || '8492'}
              </div>
            </div>

            {/* Meal Items */}
            <div className="space-y-1.5 bg-gray-50 p-3 rounded-2xl">
              <span className="text-[0.6rem] font-black uppercase tracking-wider text-gray-400 block mb-1">
                Ordered Items
              </span>
              {simulation?.items?.map((it: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-800">{it.quantity}x {it.name}</span>
                  <span className="font-bold text-gray-600">₹{it.price}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 2. HOME CHEF PERSPECTIVE */}
        <Card className="rounded-3xl border border-gray-100 shadow-xl overflow-hidden bg-white">
          <div className="p-5 bg-gradient-to-r from-orange-600 to-amber-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">Home Chef Kitchen Hub</h4>
                <p className="text-[0.65rem] text-orange-100 font-medium">{simulation?.vendor?.businessName}</p>
              </div>
            </div>
            <Link
              href="/vendor-dashboard"
              className="text-[0.6rem] font-black uppercase bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-xl transition flex items-center gap-1"
            >
              Kitchen Hub <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-gray-100">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[0.65rem]">Kitchen Ticket State</span>
              <Badge className={`text-[0.65rem] font-black uppercase px-2.5 py-0.5 border-none ${
                currentStageIndex >= 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
              }`}>
                {currentStageIndex === 0 ? 'New Incoming' : currentStageIndex === 1 ? 'Simmering & Baking' : 'Dispatched'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-2xl text-center">
                <span className="text-[0.6rem] font-black uppercase text-gray-400 block">Batch Portion</span>
                <span className="text-lg font-black text-gray-900 mt-0.5 block">2 Servings</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl text-center">
                <span className="text-[0.6rem] font-black uppercase text-gray-400 block">Chef Net Take</span>
                <span className="text-lg font-black text-emerald-600 mt-0.5 block">₹{simulation?.financials?.chefNetPayout || 120}</span>
              </div>
            </div>

            {/* Chef Action Trigger */}
            <div className="pt-1">
              {currentStageIndex === 0 && (
                <Button
                  onClick={() => handleAction('chef_accept_cook')}
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  <Flame className="w-4 h-4 mr-1.5" /> Accept Order & Start Cooking
                </Button>
              )}
              {currentStageIndex === 1 && (
                <Button
                  onClick={() => handleAction('chef_ready_packed')}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  <Check className="w-4 h-4 mr-1.5" /> Mark Packed & Ready for Pickup
                </Button>
              )}
              {currentStageIndex >= 2 && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-center text-xs font-bold">
                  ✓ Kitchen Preparation Complete & Dispatched
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. DELIVERY RIDER PERSPECTIVE */}
        <Card className="rounded-3xl border border-gray-100 shadow-xl overflow-hidden bg-white">
          <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">Delivery Rider Tactical Matrix</h4>
                <p className="text-[0.65rem] text-blue-100 font-medium">Rohan Sharma • {simulation?.rider?.vehicle}</p>
              </div>
            </div>
            <Link
              href="/delivery-dashboard"
              className="text-[0.6rem] font-black uppercase bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-xl transition flex items-center gap-1"
            >
              Rider Matrix <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-gray-100">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[0.65rem]">Sortie Bounty</span>
              <span className="font-black text-emerald-600 text-sm">₹{simulation?.financials?.riderBounty || 40} (100% Net)</span>
            </div>

            {/* GPS Telemetry */}
            <div className="bg-gray-900 text-white p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-[0.65rem] font-black uppercase tracking-wider text-gray-400">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <Navigation className="w-3 h-3 animate-pulse" /> Live Route Sync
                </span>
                <span>{simulation?.rider?.routeProgress || 0}% Progress</span>
              </div>

              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${simulation?.rider?.routeProgress || 0}%` }}
                />
              </div>

              <div className="flex justify-between text-[0.65rem] font-mono text-gray-400">
                <span>Lat: {simulation?.rider?.currentCoordinates?.lat}</span>
                <span>Lng: {simulation?.rider?.currentCoordinates?.lng}</span>
              </div>
            </div>

            {/* Rider Action Trigger */}
            <div className="pt-1">
              {currentStageIndex === 2 && (
                <Button
                  onClick={() => handleAction('rider_accept_pickup')}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  <Navigation className="w-4 h-4 mr-1.5" /> Accept Sortie & Start GPS
                </Button>
              )}
              {currentStageIndex === 3 && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAction('rider_step_gps')}
                    className="flex-1 h-11 bg-gray-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Step GPS Forward (+30%)
                  </Button>
                  <Button
                    onClick={() => handleAction('doorstep_handover_verify')}
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Enter PIN & Deliver
                  </Button>
                </div>
              )}
              {currentStageIndex === 4 && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-center text-xs font-bold">
                  ✓ Doorstep PIN Verified • Sortie Closed
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 4. PLATFORM ADMIN & TREASURY PERSPECTIVE */}
        <Card className="rounded-3xl border border-gray-100 shadow-xl overflow-hidden bg-white">
          <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Landmark className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">Admin Treasury & Commission</h4>
                <p className="text-[0.65rem] text-emerald-100 font-medium">Platform 7% Cut & Settlement Ledger</p>
              </div>
            </div>
            <Link
              href="/settlements"
              className="text-[0.6rem] font-black uppercase bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-xl transition flex items-center gap-1"
            >
              Settlements Ledger <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-gray-100">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[0.65rem]">Platform Take Rate</span>
              <span className="font-black text-orange-600 text-sm">7% Launch Cut (₹{simulation?.financials?.platformCommissionCut || 11})</span>
            </div>

            {/* Split breakdown */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Gross Order Value</span>
                <span className="font-bold text-gray-900">₹{simulation?.financials?.grossTotal || 215}</span>
              </div>
              <div className="flex justify-between text-orange-600 font-medium">
                <span>Rasan Platform Cut (7%)</span>
                <span>+₹{simulation?.financials?.platformCommissionCut || 11}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Chef Net Clearance (93%)</span>
                <span>₹{simulation?.financials?.chefNetPayout || 149}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Rider Bounty Net (100%)</span>
                <span>₹{simulation?.financials?.riderBounty || 40}</span>
              </div>
            </div>

            {/* UTR audit tag */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-[0.65rem] font-black uppercase text-emerald-800">Bank UTR Clearance</span>
              <span className="font-mono font-bold text-emerald-700 text-[0.7rem]">
                {simulation?.utrNumber || 'PENDING-CYCLE'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── REAL-TIME EVENT LOGS ── */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> Real-Time Orchestration Event Stream
        </h4>

        <div className="space-y-2 max-h-56 overflow-y-auto">
          {simulation?.logs?.map((log: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs"
            >
              <span className="font-mono text-[0.65rem] font-bold text-gray-400 shrink-0">{log.timestamp}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
              <span className="text-gray-800 font-medium">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
