'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ChefHat,
  MessageCircle,
  Calendar,
  Utensils,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  Megaphone,
  Heart,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/lib/hooks/use-toast';
import { format } from 'date-fns';

interface EmbeddedKitchenCircleProps {
  vendorId: string;
  vendorName: string;
  isActiveSubscriber?: boolean;
}

export function EmbeddedKitchenCircle({
  vendorId,
  vendorName,
  isActiveSubscriber = true,
}: EmbeddedKitchenCircleProps) {
  const [loading, setLoading] = useState(true);
  const [tomorrowMenu, setTomorrowMenu] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/vendors/${vendorId}/community-feed`);
      if (!res.ok) throw new Error('Failed to load community feed');
      const data = await res.json();
      setTomorrowMenu(data.tomorrowMenu);
      setMessages(data.messages || []);
    } catch (err: any) {
      console.warn('Error loading community feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchFeed();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (vendorId) {
      fetchFeed();
    }
  }, [vendorId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (customText?: string) => {
    const text = customText || inputText;
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}/community-feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setMessages((prev) => [...prev, data.message]);
      setInputText('');
      toast({
        title: 'Message posted to Kitchen Circle! 🎉',
        description: 'Your chef and fellow subscribers can see your message.',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to post message',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const defaultMenu = {
    date: 'Tomorrow',
    meal_type: 'Lunch & Dinner',
    items: [
      { name: 'Paneer Butter Masala', type: 'Main Curry', icon: '🍲' },
      { name: 'Homely Dal Tadka', type: 'Lentil', icon: '🥣' },
      { name: '3 Phulkas (Desi Ghee)', type: 'Breads', icon: '🫓' },
      { name: 'Jeera Basmati Rice', type: 'Rice', icon: '🍚' },
      { name: 'Kachumber Salad & Green Chutney', type: 'Sides', icon: '🥗' },
      { name: 'Gulab Jamun (1 pc)', type: 'Sweet', icon: '🍨' },
    ],
    chef_note:
      'Prepared fresh tomorrow morning with cold-pressed oil and zero preservatives. Mild spices used.',
  };

  const menuToDisplay = tomorrowMenu || defaultMenu;

  return (
    <div className="space-y-6" id="kitchen-circle">
      {/* Circle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[2rem] bg-gradient-to-r from-[#1A1A1A] via-gray-900 to-black text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-orange-600 text-white text-[0.65rem] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-xs flex items-center gap-1.5">
              <Megaphone className="w-3 h-3" /> Kitchen Circle & Broadcast Hub
            </span>
            <span className="text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Kitchen Feed
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight">
            {vendorName}’s Kitchen Community
          </h3>
          <p className="text-xs text-gray-400 font-medium max-w-xl">
            See tomorrow's fresh tiffin menu posted by your chef, read kitchen announcements, and chat with fellow subscribers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Tomorrow's Fresh Menu */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-3xl border-orange-100/80 shadow-md p-6 bg-gradient-to-b from-orange-50/40 via-white to-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Tomorrow's Menu</h4>
                  <p className="text-[0.65rem] text-gray-400 font-semibold">{menuToDisplay.date || 'Tomorrow'}</p>
                </div>
              </div>
              <span className="bg-orange-100 text-orange-800 text-[0.6rem] font-black uppercase px-2.5 py-0.5 rounded-full border border-orange-200">
                {menuToDisplay.meal_type || 'Lunch & Dinner'}
              </span>
            </div>

            {/* Menu Items Grid */}
            <div className="space-y-2">
              {(menuToDisplay.items || []).map((dish: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white border border-gray-100/90 shadow-2xs flex items-center justify-between gap-3 hover:border-orange-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl shrink-0">{dish.icon || '🍛'}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-tight">{dish.name}</p>
                      <p className="text-[0.6rem] text-orange-600 font-bold uppercase tracking-wider mt-0.5">
                        {dish.type || 'Course'}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              ))}
            </div>

            {/* Chef's Cooking Note */}
            {menuToDisplay.chef_note && (
              <div className="p-3.5 bg-orange-50/70 rounded-2xl border border-orange-100/80 flex items-start gap-2.5 text-xs text-orange-950 font-medium">
                <ChefHat className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[0.7rem]">
                  <strong>Chef's Note:</strong> {menuToDisplay.chef_note}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right 7 Cols: Interactive Broadcast & Subscriber Chat */}
        <div className="lg:col-span-7 flex flex-col">
          <Card className="rounded-3xl border-gray-100 shadow-md p-5 sm:p-6 flex-1 flex flex-col space-y-4 bg-white min-h-[480px]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 tracking-tight">Subscriber Circle & Chat</h4>
                  <p className="text-[0.65rem] text-gray-400 font-semibold">
                    Direct interaction between {vendorName} and subscribers
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing || loading}
                  className="h-8 px-2.5 rounded-xl border-gray-200 text-[0.65rem] font-bold text-gray-600 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 gap-1.5 cursor-pointer shadow-2xs"
                  title="Refresh chat messages"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
                <span className="text-[0.65rem] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                  ● Live Group
                </span>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[340px] text-xs">
              {loading ? (
                <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                  <span className="text-xs font-semibold">Loading circle discussions...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <ChefHat className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="font-bold text-gray-600">Welcome to the Kitchen Circle!</p>
                  <p className="text-xs max-w-xs mx-auto">
                    Be the first to say hello to the chef or ask about tomorrow's spices.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`p-3.5 rounded-2xl max-w-[85%] space-y-1 ${
                      msg.is_vendor
                        ? 'bg-orange-50/80 border border-orange-200 text-orange-950 ml-0 mr-auto shadow-2xs'
                        : 'bg-gray-100/90 text-gray-900 ml-auto mr-0'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[0.65rem] font-black tracking-wider uppercase ${
                        msg.is_vendor ? 'text-orange-700 flex items-center gap-1' : 'text-gray-600'
                      }`}>
                        {msg.is_vendor && <ChefHat className="w-3 h-3 text-orange-600 inline" />}
                        {msg.sender_name}
                      </span>
                      {msg.created_at && (
                        <span className="text-[0.55rem] text-gray-400 font-medium">
                          {format(new Date(msg.created_at), 'p')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed font-medium">{msg.message}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar border-t border-gray-100">
              {[
                'Less spicy tomorrow please 🌶️',
                'Extra green chutney please 🥗',
                'Looking forward to lunch! ❤️',
                'Deliver at 12:30 PM sharp ⏰',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  disabled={sending}
                  className="text-[0.65rem] font-medium bg-gray-50 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 px-3 py-1 rounded-full whitespace-nowrap transition cursor-pointer shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask chef about tomorrow's tiffin, request mild spice..."
                disabled={sending}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-orange-600 focus:bg-white transition"
              />
              <Button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="h-11 px-5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-xs tracking-wider shadow-md shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
