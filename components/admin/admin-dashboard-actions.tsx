'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { RefreshCcw, BarChart3, Store, Bike, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdminAddVendorDrawer } from '@/components/admin/admin-add-vendor-drawer';
import { AdminAddDeliveryDrawer } from '@/components/admin/admin-add-delivery-drawer';

export default function AdminDashboardActions() {
  const [isFlushing, setIsFlushing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleFlush = async () => {
    setIsFlushing(true);
    toast({
      title: 'Flushing Cache',
      description: 'System memory is being purged and re-indexed. Please hold.',
    });

    // Simulate task
    setTimeout(() => {
      setIsFlushing(false);
      toast({
        title: 'System Purged',
        description: 'All nodes have been successfully flushed and reconnected.',
      });
      router.refresh();
    }, 1500);
  };

  const handleExport = async () => {
    setIsExporting(true);
    toast({
      title: 'Ledger Compilation',
      description: 'Collating system events and compiling CSV export...',
    });

    // Simulate task
    setTimeout(() => {
      setIsExporting(false);
      
      // Creating a dummy CSV logic to trigger browser download
      const headers = ['UUID', 'Timestamp', 'Event', 'Status', 'Value'];
      const data = [
        ['1a2b3c', new Date().toISOString(), 'SYSTEM_BOOT', 'SUCCESS', '0'],
        ['4d5e6f', new Date().toISOString(), 'LEDGER_EXPORT', 'SUCCESS', '0']
      ];
      
      let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + data.map(e => e.join(",")).join("\n");
        
      var encodedUri = encodeURI(csvContent);
      var link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "nexus_ledger_export.csv");
      document.body.appendChild(link); // Required for FF
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Complete',
        description: 'Ledger has been successfully compiled and downloaded to your terminal.',
      });
    }, 2000);
  };

  return (
    <div className="space-y-3">
      {/* Quick Add Partner Row */}
      <div className="flex gap-2">
        <AdminAddVendorDrawer />
        <AdminAddDeliveryDrawer />
      </div>

      {/* Utility Actions Row */}
      <div className="flex gap-3">
        <Button 
          id="btn-flush-cache" 
          data-testid="flush-cache-button" 
          variant="outline" 
          className="flex-1 h-12 rounded-xl bg-white/5 border-white/10 text-white font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all text-[0.55rem]"
          onClick={handleFlush}
          disabled={isFlushing}
        >
          <RefreshCcw className={`w-3.5 h-3.5 mr-2 ${isFlushing ? 'animate-spin text-orange-500' : ''}`} />
          {isFlushing ? 'PURGING...' : 'FLUSH'}
        </Button>
        <Button 
          id="btn-export-ledger" 
          data-testid="export-ledger-button" 
          className="flex-[1.5] h-12 rounded-xl bg-orange-600 text-white font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:bg-orange-50 hover:text-orange-600 hover:scale-[1.02] active:scale-95 text-[0.55rem]"
          onClick={handleExport}
          disabled={isExporting}
        >
          <BarChart3 className={`w-3.5 h-3.5 mr-2 ${isExporting ? 'animate-pulse' : ''}`} />
          {isExporting ? 'COMPILING...' : 'EXPORT LEDGER'}
        </Button>
      </div>
    </div>
  );
}
