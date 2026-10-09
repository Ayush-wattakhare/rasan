'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Radio, 
  Search, 
  Plus, 
  Send, 
  CheckCircle2, 
  Users, 
  ChefHat, 
  Truck, 
  Loader2, 
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/lib/hooks/use-toast';
import type { BroadcastMessage } from '@/app/api/admin/broadcasts/route';
import { formatDistanceToNow } from 'date-fns';

export function BroadcastsClient() {
  const { toast } = useToast();
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    target: 'all',
    priority: 'urgent',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBroadcasts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/broadcasts');
      const data = await res.json();
      if (data.success) {
        setBroadcasts(data.broadcasts || []);
      }
    } catch (err) {
      console.error('Failed to load broadcasts', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch broadcast');

      toast({
        title: '📡 Broadcast Transmitted',
        description: data.message || 'System notification sent to target users.',
      });

      setIsModalOpen(false);
      fetchBroadcasts();
      setForm({
        title: '',
        message: '',
        target: 'all',
        priority: 'urgent',
      });
    } catch (err: any) {
      toast({
        title: 'Transmission Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg w-full p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white max-h-[90vh] flex flex-col my-auto">
          <div className="bg-[#1A1A1A] px-6 sm:px-8 py-5 text-white relative shrink-0">
            <div className="relative z-10 space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[0.6rem] font-black uppercase tracking-wider">
                System Transmitter
              </span>
              <DialogTitle className="text-xl font-black uppercase italic tracking-tight text-white leading-tight">
                Transmit System Announcement
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs font-semibold">
                Push instant notification to all active devices in selected audience
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleCreateBroadcast} className="flex-1 flex flex-col min-h-0">
            <div className="p-6 sm:p-8 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[0.65rem] font-bold text-gray-600">Target Audience</Label>
                  <select
                    value={form.target}
                    onChange={(e) => setForm({ ...form, target: e.target.value })}
                    className="w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-xs font-bold"
                  >
                    <option value="all">Everyone (All Nodes)</option>
                    <option value="customer">Customers Only</option>
                    <option value="vendor">Home Chefs (Vendors)</option>
                    <option value="delivery">Delivery Riders (Pilots)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[0.65rem] font-bold text-gray-600">Priority Level</Label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-xs font-bold"
                  >
                    <option value="urgent">Urgent / Alert (Rain, Delays)</option>
                    <option value="info">Informational (Peak Surge)</option>
                    <option value="promo">Promotional / Notification</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[0.65rem] font-bold text-gray-600">Broadcast Title *</Label>
                <Input
                  required
                  placeholder="e.g. 🌧️ Monsoon Protocol Active across Pune"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="h-11 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[0.65rem] font-bold text-gray-600">Broadcast Message *</Label>
                <Textarea
                  required
                  placeholder="Type announcement to be delivered to all target devices..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="rounded-xl text-xs min-h-[100px]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-11 rounded-xl text-xs font-bold uppercase">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Transmit Broadcast</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tight text-gray-900">
              Active Broadcast Stream
            </h3>
            <p className="text-xs text-gray-400 font-semibold">
              Emergency notifications and platform-wide communications
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-11 px-5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Announcement
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchBroadcasts}
              className="h-11 w-11 rounded-xl border-gray-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {broadcasts.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[0.6rem] font-black uppercase tracking-wider ${
                    b.priority === 'urgent' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {b.priority}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[0.6rem] font-black uppercase tracking-wider">
                    Target: {b.target.toUpperCase()}
                  </span>
                </div>
                <span className="text-[0.65rem] text-gray-400 font-medium">
                  {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
                </span>
              </div>

              <div>
                <h4 className="text-base font-black text-gray-900 tracking-tight">{b.title}</h4>
                <p className="text-xs text-gray-600 font-medium mt-1 leading-relaxed">{b.message}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 font-medium pt-2 border-t border-gray-50">
                <span>Transmission Node: Pune Command Central</span>
                <span className="font-bold text-gray-700">Delivered to ~{b.reach_count} Active Users</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
