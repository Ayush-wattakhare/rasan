'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

interface DeliveryOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onVerify: (otp: string) => Promise<void>;
  isLoading?: boolean;
}

export function DeliveryOtpModal({
  isOpen,
  onClose,
  order,
  onVerify,
  isLoading = false,
}: DeliveryOtpModalProps) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '']);
      setError(null);
      setIsSuccess(false);
      setTimeout(() => inputRefs[0].current?.focus(), 150);
    }
  }, [isOpen]);

  const handleDigitChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError(null);

    // Auto advance to next input
    if (char && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = digits.join('');
    if (pin.length !== 4) {
      setError('Please enter the complete 4-digit PIN provided by customer.');
      return;
    }

    setError(null);
    try {
      await onVerify(pin);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Incorrect Delivery PIN. Please recheck with customer.');
    }
  };

  if (!order) return null;

  const orderNum = order.order_number || (order.id ? order.id.slice(0, 8).toUpperCase() : '');
  const customerName = order.profiles?.name || 'Customer';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#161616] text-white border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-20 h-20 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">
              Handover Verified!
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Delivery completed. Bounty credited to your wallet.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-2 text-center sm:text-left">
              <div className="flex items-center gap-2 text-orange-500">
                <KeyRound className="w-5 h-5" />
                <span className="text-[0.65rem] font-black uppercase tracking-[0.25em]">
                  Handover Verification
                </span>
              </div>
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tight text-white">
                Enter Delivery PIN
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400 font-medium leading-relaxed">
                Ask <strong className="text-white font-bold">{customerName}</strong> for the 4-digit handover PIN shown on their order tracking screen for #{orderNum}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="flex justify-center items-center gap-3">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isLoading}
                    className="w-14 h-16 rounded-2xl bg-white/5 border-2 border-white/15 focus:border-orange-500 focus:bg-white/10 text-center text-3xl font-black font-mono text-white tracking-widest focus:outline-none transition-all duration-200"
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-950/40 border border-red-800/50 p-3 rounded-2xl text-xs font-semibold animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-white/10 hover:bg-white/5 text-gray-300 font-black uppercase tracking-widest h-12 rounded-xl text-[0.65rem]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || digits.join('').length !== 4}
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-orange-600/30 text-[0.65rem]"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Confirm Delivery ✓'
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
