'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  User, 
  ChefHat, 
  Truck, 
  IndianRupee, 
  ArrowRight,
  RefreshCw,
  Sparkles,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TicketResolutionModal } from './ticket-resolution-modal';
import type { SupportTicket } from '@/app/api/admin/support/tickets/route';
import { formatDistanceToNow } from 'date-fns';

export function SupportTicketsClient() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [counts, setCounts] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0, critical: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'customer' | 'vendor' | 'delivery'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedRole !== 'all') queryParams.set('role', selectedRole);
      if (selectedStatus !== 'all') queryParams.set('status', selectedStatus);
      if (selectedPriority !== 'all') queryParams.set('priority', selectedPriority);

      const res = await fetch(`/api/admin/support/tickets?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error('Failed to load support tickets', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole, selectedStatus, selectedPriority]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = tickets.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.ticket_number.toLowerCase().includes(q) ||
      t.user_name.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (t.order_id && t.order_id.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <TicketResolutionModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdated={() => {
          fetchTickets();
          setSelectedTicket(null);
        }}
      />

      <div className="space-y-8">
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Active Inquiries</span>
              <MessageSquare className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-3xl font-black text-gray-900 tracking-tight italic">
              {counts.open + counts.in_progress}
            </div>
            <p className="text-[0.65rem] text-orange-600 font-bold uppercase">
              {counts.open} Unassigned • {counts.in_progress} In Motion
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Critical Escalations</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-3xl font-black text-red-600 tracking-tight italic">
              {counts.critical}
            </div>
            <p className="text-[0.65rem] text-red-500 font-bold uppercase">Immediate Attention Needed</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Resolved Solutions</span>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-3xl font-black text-green-600 tracking-tight italic">
              {counts.resolved}
            </div>
            <p className="text-[0.65rem] text-green-600 font-bold uppercase">Closed with SLA compliance</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Dispute SLA Target</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-gray-900 tracking-tight italic">&lt; 15 Mins</div>
            <p className="text-[0.65rem] text-blue-600 font-bold uppercase">98.4% On-time resolution</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Role Switcher Tabs */}
            <div className="flex items-center bg-gray-100/80 p-1 rounded-2xl flex-wrap gap-1">
              {[
                { id: 'all', label: 'All Parties', icon: Sparkles },
                { id: 'customer', label: 'Customers', icon: User },
                { id: 'vendor', label: 'Home Chefs', icon: ChefHat },
                { id: 'delivery', label: 'Delivery Riders', icon: Truck },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = selectedRole === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedRole(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      active ? 'bg-white text-gray-900 shadow-md scale-[1.02]' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-orange-600' : 'text-gray-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search Ticket #ID, name, order, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 rounded-xl text-xs font-semibold"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchTickets}
                className="h-11 w-11 rounded-xl border-gray-200"
                title="Refresh Tickets"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-600' : 'text-gray-600'}`} />
              </Button>
            </div>
          </div>

          {/* Status & Priority Secondary Filters */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap text-xs">
            <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider mr-1">Status:</span>
            {['all', 'open', 'in_progress', 'resolved'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st as any)}
                className={`px-3 py-1 rounded-lg text-[0.65rem] font-bold uppercase transition cursor-pointer ${
                  selectedStatus === st ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}

            <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider ml-4 mr-1">Priority:</span>
            {['all', 'critical', 'high', 'medium'].map((pr) => (
              <button
                key={pr}
                type="button"
                onClick={() => setSelectedPriority(pr)}
                className={`px-3 py-1 rounded-lg text-[0.65rem] font-bold uppercase transition cursor-pointer ${
                  selectedPriority === pr ? 'bg-[#1A1A1A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {pr}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Grid / List */}
        <div className="space-y-4">
          {isLoading && tickets.length === 0 ? (
            <div className="p-20 text-center space-y-3 bg-white rounded-3xl shadow-xl border border-gray-100">
              <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Support Feed...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-20 text-center space-y-3 bg-white rounded-3xl shadow-xl border border-gray-100">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-black uppercase italic text-gray-900">All Clear! No Open Disputes</h3>
              <p className="text-xs text-gray-400 font-medium">All customer, chef, and rider queries are resolved.</p>
            </div>
          ) : (
            filteredTickets.map((t) => {
              const isCritical = t.priority === 'critical';
              const isResolved = t.status === 'resolved';

              return (
                <div
                  key={t.id}
                  className={`bg-white rounded-3xl p-6 shadow-xl border transition-all hover:shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                    isCritical && !isResolved ? 'border-red-200 bg-red-50/10 ring-1 ring-red-100' : 'border-gray-100'
                  }`}
                >
                  {/* Left: Identity & Query Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-black text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg">
                        #{t.ticket_number}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[0.6rem] font-black uppercase tracking-wider ${
                        t.user_role === 'customer' ? 'bg-orange-100 text-orange-700' :
                        t.user_role === 'vendor' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {t.user_role === 'vendor' ? '👩‍🍳 Home Chef' : t.user_role === 'delivery' ? '🛵 Rider' : '👤 Customer'}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[0.6rem] font-black uppercase tracking-wider ${
                        t.priority === 'critical' ? 'bg-red-500 text-white animate-pulse' :
                        t.priority === 'high' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {t.priority}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[0.6rem] font-black uppercase tracking-wider ${
                        t.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        t.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        ● {t.status.replace('_', ' ')}
                      </span>

                      <span className="text-[0.65rem] text-gray-400 font-medium">
                        {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-gray-900 tracking-tight">{t.subject}</h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 font-medium">
                        {t.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 font-medium pt-1 flex-wrap">
                      <span>Claimant: <strong className="text-gray-800">{t.user_name}</strong></span>
                      {t.order_id && (
                        <span>Order Ref: <strong className="font-mono text-gray-800">#{t.order_id}</strong> {t.order_total ? `(₹${t.order_total})` : ''}</span>
                      )}
                      {t.refund_amount ? (
                        <span className="text-green-600 font-black">Refund Issued: ₹{t.refund_amount}</span>
                      ) : null}
                    </div>

                    {t.resolution_notes && (
                      <div className="bg-green-50 p-2.5 rounded-xl border border-green-100 text-xs text-green-800 font-medium mt-2">
                        <strong>Resolution:</strong> {t.resolution_notes}
                      </div>
                    )}
                  </div>

                  {/* Right: Action Trigger */}
                  <div className="flex items-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <Button
                      onClick={() => setSelectedTicket(t)}
                      className={`h-12 px-6 rounded-2xl font-black uppercase tracking-wider text-xs shadow-lg flex items-center gap-2 cursor-pointer ${
                        t.status === 'resolved' 
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                          : 'bg-orange-600 hover:bg-orange-500 text-white'
                      }`}
                    >
                      {t.status === 'resolved' ? 'Review Solution' : 'Resolve & Settle'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
