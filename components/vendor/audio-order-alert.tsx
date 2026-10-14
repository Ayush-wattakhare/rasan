'use client';

import { useEffect, useState, useRef } from 'react';
import { BellRing, Check, X, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  playKitchenOrderChime,
  isKitchenChimeMuted,
  setKitchenChimeMuted,
} from '@/lib/utils/audio-chime';
import { createClient } from '@/lib/supabase/client';

interface AudioOrderAlertProps {
  pendingCount: number;
  vendorId?: string;
  onRefresh?: () => void;
}

export function AudioOrderAlert({ pendingCount, vendorId, onRefresh }: AudioOrderAlertProps) {
  const [showAlert, setShowAlert] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const prevCountRef = useRef(pendingCount);

  // Initialize mute state from localStorage
  useEffect(() => {
    setIsMuted(isKitchenChimeMuted());
  }, []);

  // Detect pending order increase
  useEffect(() => {
    if (pendingCount > prevCountRef.current) {
      setShowAlert(true);
      playKitchenOrderChime();
    }
    prevCountRef.current = pendingCount;
  }, [pendingCount]);

  // Connect Supabase Realtime Channel on 'orders'
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('vendor-live-kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          ...(vendorId ? { filter: `vendor_id=eq.${vendorId}` } : {}),
        },
        (payload) => {
          // If a new order is placed or transitioned into pending/confirmed
          const newRecord = payload.new as Record<string, any> | undefined;
          if (payload.eventType === 'INSERT' || newRecord?.status === 'pending') {
            setShowAlert(true);
            playKitchenOrderChime();
          }
          if (onRefresh) {
            onRefresh();
          }
        }
      )
      .subscribe();

    // 20-second fallback polling interval in case WebSockets reconnect
    const fallbackPoll = setInterval(() => {
      if (onRefresh) {
        onRefresh();
      }
    }, 20000);

    return () => {
      clearInterval(fallbackPoll);
      supabase.removeChannel(channel);
    };
  }, [vendorId, onRefresh]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setKitchenChimeMuted(nextMuted);
    if (!nextMuted) {
      playKitchenOrderChime(); // Play test chime to confirm audio is active
    }
  };

  if (!showAlert || pendingCount === 0) return null;

  return (
    <div className="animate-in slide-in-from-top-4 fixed top-24 right-6 z-50 duration-300 sm:right-8">
      <div className="flex max-w-sm flex-col gap-4 rounded-[2rem] border border-orange-500/40 bg-[#141414] p-5 text-white shadow-2xl ring-4 ring-orange-500/10 backdrop-blur-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex animate-bounce items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-3 text-white shadow-lg shadow-orange-950/40">
              <BellRing className="h-5 w-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-orange-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-black tracking-wider text-orange-400 uppercase italic">
                  Kitchen Alert!
                </h4>
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <p className="text-xs font-bold text-gray-300">
                {pendingCount} order(s) awaiting kitchen acceptance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute kitchen chime' : 'Mute kitchen chime'}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-red-400" />
              ) : (
                <Volume2 className="h-4 w-4 text-green-400" />
              )}
            </button>
            <button
              onClick={() => setShowAlert(false)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              setShowAlert(false);
              if (onRefresh) onRefresh();
            }}
            className="flex-1 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-xs font-black tracking-widest text-white uppercase shadow-md shadow-orange-900/30 hover:from-orange-500 hover:to-amber-500"
          >
            <Check className="mr-1 h-3.5 w-3.5" /> View & Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
