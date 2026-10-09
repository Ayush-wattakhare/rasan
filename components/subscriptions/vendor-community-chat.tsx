'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  Sparkles,
  ChefHat,
  Lock,
  MessageCircle,
  Calendar,
  Utensils,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/hooks/use-toast';

interface VendorCommunityChatProps {
  vendorId: string;
  vendorName: string;
  isOpen: boolean;
  onClose: () => void;
  subscription?: any;
}

export function VendorCommunityChat({
  vendorId,
  vendorName,
  isOpen,
  onClose,
  subscription,
}: VendorCommunityChatProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isActiveSubscriber, setIsActiveSubscriber] = useState(true);
  const [tomorrowMenu, setTomorrowMenu] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/vendors/${vendorId}/community-feed`);
      if (!res.ok) throw new Error('Failed to load community feed');
      const data = await res.json();
      setIsActiveSubscriber(data.isActiveSubscriber ?? true);
      setTomorrowMenu(data.tomorrowMenu);
      setMessages(data.messages || []);
    } catch (err: any) {
      console.error('Error loading community feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && vendorId) {
      fetchFeed();
    }
  }, [isOpen, vendorId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || sending) return;

    if (!isActiveSubscriber) {
      toast({
        title: 'Subscription Inactive',
        description: 'You need an active tiffin subscription to post in this kitchen group.',
        variant: 'destructive',
      });
      return;
    }

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
    } catch (err: any) {
      toast({
        title: 'Could not send',
        description: err.message || 'Please check your connection',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full h-[90vh] max-h-[720px] shadow-2xl relative border border-gray-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 text-white p-5 sm:p-6 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/20">
              👩‍🍳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {vendorName || 'Home Kitchen'}
                </h3>
                <span className="bg-white/20 text-white text-[0.6rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Kitchen Circle
                </span>
              </div>
              <p className="text-xs text-orange-100 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {isActiveSubscriber ? 'Active Subscribers Only' : 'Subscription Expired'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#FDFCFB]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
              <p className="text-xs font-bold uppercase tracking-wider">Loading Kitchen Feed...</p>
            </div>
          ) : (
            <>
              {/* Pinned Tomorrow's Tiffin Menu */}
              {tomorrowMenu && (
                <div className="bg-white rounded-2xl p-5 border-2 border-orange-200 shadow-md space-y-3.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-amber-500 text-white text-[0.65rem] font-black uppercase px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Tomorrow's Menu
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-orange-800">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span>{tomorrowMenu.date}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-600">{tomorrowMenu.meal_type}</span>
                  </div>

                  {/* Menu Items Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {tomorrowMenu.items?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-xl bg-orange-50/50 border border-orange-100 text-xs"
                      >
                        <span className="text-base">{item.icon}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{item.name}</p>
                          <p className="text-[0.65rem] text-orange-700 font-medium">{item.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {tomorrowMenu.chef_note && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
                      <ChefHat className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[0.7rem] leading-relaxed">
                        <strong className="font-bold">Chef's Note:</strong> {tomorrowMenu.chef_note}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Chat Messages Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider px-1">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" /> Subscriber Group Stream
                  </span>
                  <span className="text-[0.65rem] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Subscribers Active
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-white rounded-2xl border border-gray-100 text-gray-400 text-xs">
                    <p className="font-bold text-gray-600 mb-1">Welcome to the Kitchen Circle! 👋</p>
                    <p className="text-[0.7rem]">
                      Ask the home chef about preparation, taste preferences, or special requests.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isChef = msg.is_vendor;
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col ${isChef ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[0.65rem]">
                          <span
                            className={`font-bold ${
                              isChef ? 'text-orange-700' : 'text-gray-600'
                            }`}
                          >
                            {msg.sender_name}
                          </span>
                          {isChef && (
                            <span className="bg-orange-100 text-orange-800 text-[0.55rem] font-extrabold px-1.5 py-0.2 rounded-md uppercase">
                              Chef
                            </span>
                          )}
                        </div>
                        <div
                          className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                            isChef
                              ? 'bg-orange-50 text-orange-950 border border-orange-200/80 rounded-tl-sm'
                              : 'bg-white text-gray-800 border border-gray-200/80 shadow-xs rounded-tr-sm'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        {isActiveSubscriber && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
              Quick Request:
            </span>
            {[
              'Less spicy please 🌶️',
              'Extra salad if possible 🥗',
              'Please deliver before 1 PM ⏰',
              'Food was delicious today! ❤️',
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip)}
                className="text-[0.7rem] font-medium bg-white hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Footer Input Area */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-100 shrink-0">
          {isActiveSubscriber ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask the home chef or request mild spice..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={sending}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-medium text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white transition"
              />
              <Button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="h-11 w-11 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white shrink-0 p-0 shadow-md transition-transform active:scale-95 flex items-center justify-center"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-0.5" />
                )}
              </Button>
            </form>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-amber-900">
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Plan expired. Renew subscription to re-activate this Kitchen Circle.</span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  window.location.href = '/subscriptions';
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl"
              >
                Renew Plan
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
