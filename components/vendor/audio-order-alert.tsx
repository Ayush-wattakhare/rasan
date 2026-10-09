'use client';

import { useEffect, useState } from 'react';
import { BellRing, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioOrderAlertProps {
  pendingCount: number;
  onRefresh?: () => void;
}

export function AudioOrderAlert({ pendingCount, onRefresh }: AudioOrderAlertProps) {
  const [showAlert, setShowAlert] = useState(false);
  const [prevCount, setPrevCount] = useState(pendingCount);

  if (pendingCount !== prevCount) {
    setPrevCount(pendingCount);
    if (pendingCount > prevCount) {
      setShowAlert(true);
    }
  }

  useEffect(() => {
    if (pendingCount > prevCount && showAlert) {
      // Play web audio chime synthesized sound
      try {
        const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.5);
        }
      } catch (e) {
        console.log('Audio chime auto-play restricted:', e);
      }
    }
  }, [pendingCount, prevCount, showAlert]);

  if (!showAlert || pendingCount === 0) return null;

  return (
    <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-[#1A1A1A] text-white p-6 rounded-[2rem] shadow-2xl border border-orange-500/30 max-w-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2.5 rounded-2xl text-white animate-bounce">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-wider text-orange-400">Incoming Order!</h4>
              <p className="text-xs text-gray-300 font-bold">{pendingCount} order(s) awaiting kitchen acceptance</p>
            </div>
          </div>
          <button
            onClick={() => setShowAlert(false)}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              setShowAlert(false);
              if (onRefresh) onRefresh();
            }}
            className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-xl"
          >
            <Check className="w-3.5 h-3.5 mr-1" /> View Pending
          </Button>
        </div>
      </div>
    </div>
  );
}
