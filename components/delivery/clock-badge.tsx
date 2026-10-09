'use client';

import { useState, useEffect } from 'react';

export function ClockBadge() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <span className="text-[0.6rem] font-mono text-orange-400">{time || 'LIVE'}</span>;
}
