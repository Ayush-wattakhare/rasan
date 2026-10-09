'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Maximize2, RefreshCw } from 'lucide-react';

export default function TacticalMapActions() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const { toast } = useToast();

  const handleExpand = () => {
    setIsExpanding(true);
    toast({
      title: 'Satellite Uplink Required',
      description: 'Expanding to global view requires high-bandwidth satellite connection. Requesting...',
    });
    
    setTimeout(() => {
      setIsExpanding(false);
      toast({
        title: 'Uplink Established',
        description: 'Global tactical view is currently classified.',
        variant: 'destructive'
      });
    }, 1500);
  };

  const handleSync = () => {
    setIsSyncing(true);
    toast({
      title: 'Telemetry Sync Initiated',
      description: 'Ping dispatched to all orbital nodes. Awaiting location handshake...',
    });

    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: 'Telemetry Synced',
        description: 'All field operatives have successfully reported their position.',
      });
    }, 2000);
  };

  return (
    <div className="absolute bottom-6 right-6 flex gap-2 z-20">
      <Button 
        variant="outline" 
        onClick={handleExpand}
        disabled={isExpanding}
        className="bg-black/40 backdrop-blur-md border border-white/10 text-white font-black uppercase tracking-widest text-[0.5rem] h-8 rounded-lg hover:bg-white/20 px-3 transition-all"
      >
        <Maximize2 className={`w-3 h-3 mr-1.5 ${isExpanding ? 'animate-single-bounce text-orange-500' : ''}`} />
        {isExpanding ? 'Expanding...' : 'Expand'}
      </Button>
      <Button 
        onClick={handleSync}
        disabled={isSyncing}
        className="bg-orange-600 text-white font-black uppercase tracking-widest text-[0.5rem] h-8 rounded-lg px-3 transition-all hover:bg-orange-500"
      >
        <RefreshCw className={`w-3 h-3 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : 'Sync'}
      </Button>
    </div>
  );
}
