'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingBag, X } from 'lucide-react';

export default function FloatingGetStarted() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling 300px
      if (window.scrollY > 300 && !isDismissed) {
        setIsVisible(true);
      } else if (window.scrollY <= 300) {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (isDismissed) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative">
        {/* Dismiss button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Main button */}
        <Button
          size="lg"
          className="shadow-2xl hover:shadow-3xl transition-all text-lg font-bold px-6 py-6 rounded-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-600"
          asChild
        >
          <Link href="/meals" className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6" />
            <div className="text-left">
              <div className="text-sm font-normal opacity-90">Get Started</div>
              <div className="text-base font-bold">Browse Meals</div>
            </div>
          </Link>
        </Button>

        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
      </div>
    </div>
  );
}
