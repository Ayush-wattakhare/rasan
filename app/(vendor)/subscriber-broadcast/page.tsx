'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Megaphone,
  MessageCircle,
  Users,
  Utensils,
  Sparkles,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Calendar,
  ChefHat,
  Loader2,
  RefreshCcw,
  Sun,
  Moon,
  MapPin,
  Phone,
  Check,
  CheckCheck,
  Share2,
  Copy,
  ExternalLink,
  Smartphone,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/lib/hooks/use-toast';

export default function SubscriberBroadcastPage() {
  const [activeTab, setActiveTab] = useState<'menu' | 'chat' | 'subscribers'>('menu');
  const [isLoading, setIsLoading] = useState(true);
  const [vendorData, setVendorData] = useState<any>(null);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const daysOfWeek = [
    { key: 'monday', label: 'Mon', full: 'Monday' },
    { key: 'tuesday', label: 'Tue', full: 'Tuesday' },
    { key: 'wednesday', label: 'Wed', full: 'Wednesday' },
    { key: 'thursday', label: 'Thu', full: 'Thursday' },
    { key: 'friday', label: 'Fri', full: 'Friday' },
    { key: 'saturday', label: 'Sat', full: 'Saturday' },
    { key: 'sunday', label: 'Sun', full: 'Sunday' },
  ];

  const todayIndex = new Date().getDay(); // 0 is Sunday
  const todayKey = todayIndex === 0 ? 'sunday' : daysOfWeek[todayIndex - 1]?.key || 'monday';

  const [selectedDayKey, setSelectedDayKey] = useState<string>(todayKey);
  const [rosterViewMode, setRosterViewMode] = useState<'daily_dispatcher' | 'master_matrix'>('daily_dispatcher');
  const [tiffinStatuses, setTiffinStatuses] = useState<Record<string, 'scheduled' | 'packed' | 'dispatched'>>({});
  const [tomorrowMenu, setTomorrowMenu] = useState<any>({
    meal_type: 'Lunch & Dinner',
    items: [
      { name: 'Paneer Butter Masala', type: 'Main Curry', icon: '🍲' },
      { name: 'Homely Dal Tadka', type: 'Lentil', icon: '🥣' },
      { name: '3 Phulkas (with pure Desi Ghee)', type: 'Breads', icon: '🫓' },
      { name: 'Jeera Basmati Rice', type: 'Rice', icon: '🍚' },
      { name: 'Kachumber Salad & Green Chutney', type: 'Sides', icon: '🥗' },
      { name: 'Gulab Jamun (1 pc)', type: 'Sweet', icon: '🍨' },
    ],
    chef_note: 'Cooked fresh tomorrow morning with cold-pressed oil and mild seasonings.',
  });

  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('Special Dish');
  const [isPublishingMenu, setIsPublishingMenu] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WhatsApp & Story Generator State
  const [showStoryModal, setShowStoryModal] = useState(false);

  const getWhatsAppFormattedText = () => {
    const bizName = vendorData?.business_name || "Anita's Home Kitchen";
    let text = `🍲 *${bizName} - Tomorrow's Tiffin Menu* 🌿\n\n`;
    text += `⏰ *Meal Window:* ${tomorrowMenu.meal_type || 'Lunch & Dinner'}\n\n`;
    text += `✨ *Tomorrow's Fresh Preparation:*\n`;
    tomorrowMenu.items?.forEach((it: any) => {
      text += `• ${it.icon || '🍛'} *${it.name}* (${it.type})\n`;
    });
    if (tomorrowMenu.chef_note) {
      text += `\n👩‍🍳 *Chef's Note:* ${tomorrowMenu.chef_note}\n`;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    text += `\n📲 *Order or Manage Tiffin on Rasan:* ${origin}/vendors`;
    return text;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getWhatsAppFormattedText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyWhatsAppText = () => {
    const text = getWhatsAppFormattedText();
    navigator.clipboard.writeText(text);
    toast({
      title: 'WhatsApp Text Copied! 📋',
      description: 'Ready to paste directly into your WhatsApp Status or broadcast list.',
    });
  };

  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/vendor/broadcast');
      if (!res.ok) throw new Error('Failed to load broadcast hub');
      const data = await res.json();
      setVendorData(data.vendor);
      setSubscribers(data.subscribers || []);
      setMessages(data.messages || []);
      if (data.tomorrowMenu) {
        setTomorrowMenu(data.tomorrowMenu);
      }
    } catch (err: any) {
      toast({
        title: 'Error Loading Broadcast Hub',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [isRefreshingChat, setIsRefreshingChat] = useState(false);

  const handleRefreshChat = async () => {
    setIsRefreshingChat(true);
    try {
      const res = await fetch('/api/vendor/broadcast');
      if (!res.ok) throw new Error('Failed to refresh');
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
      toast({
        title: 'Messages Updated! 💬',
        description: 'Loaded latest subscriber questions and chats.',
      });
    } catch {
      toast({
        title: 'Refresh failed',
        description: 'Could not fetch latest messages.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshingChat(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleAddDish = () => {
    if (!newItemName.trim()) return;
    setTomorrowMenu((prev: any) => ({
      ...prev,
      items: [...prev.items, { name: newItemName.trim(), type: newItemType, icon: '🍛' }],
    }));
    setNewItemName('');
  };

  const handleRemoveDish = (index: number) => {
    setTomorrowMenu((prev: any) => ({
      ...prev,
      items: prev.items.filter((_: any, idx: number) => idx !== index),
    }));
  };

  const handlePublishMenu = async () => {
    if (!tomorrowMenu.items || tomorrowMenu.items.length === 0) {
      toast({
        title: 'Menu is empty',
        description: 'Please add at least 1 dish to the menu.',
        variant: 'destructive',
      });
      return;
    }

    setIsPublishingMenu(true);
    try {
      const res = await fetch('/api/vendor/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_menu',
          menu: tomorrowMenu,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to broadcast menu');

      toast({
        title: "Menu Broadcasted Successfully! 📢",
        description: `Your ${subscribers.length} active subscribers can now see tomorrow's fresh menu in their app.`,
      });
      loadData();
    } catch (err: any) {
      toast({
        title: 'Broadcast Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsPublishingMenu(false);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const text = customText || chatInput;
    if (!text.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch('/api/vendor/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          message: text.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');

      setMessages((prev) => [...prev, data.message]);
      setChatInput('');
    } catch (err: any) {
      toast({
        title: 'Message Not Sent',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleUpdateTiffinStatus = async (subscriber: any, newStatus: 'packed' | 'dispatched') => {
    setTiffinStatuses((prev) => ({
      ...prev,
      [`${subscriber.id}_${selectedDayKey}`]: newStatus,
    }));

    try {
      await fetch('/api/vendor/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_tiffin_status',
          subscriberId: subscriber.id,
          status: newStatus,
          customerName: subscriber.customer_name,
          mealSlot: subscriber.delivery_time || 'Lunch',
        }),
      });

      toast({
        title: newStatus === 'packed' ? '🍱 Tiffin Packed!' : '🚀 Tiffin Dispatched!',
        description: `${subscriber.customer_name}'s meal marked as ${newStatus} for ${selectedDayKey.toUpperCase()}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Tiffin status updated',
        description: `Marked as ${newStatus}`,
      });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl pb-28 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1A1A1A] via-gray-900 to-black text-white rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-orange-600 text-white text-[0.65rem] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm flex items-center gap-1.5">
                <Megaphone className="w-3 h-3" /> Kitchen Circle Hub
              </span>
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Broadcast Active
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight italic uppercase">
              Subscriber Broadcast & Chat
            </h1>
            <p className="text-xs md:text-sm text-gray-400 max-w-xl leading-relaxed font-medium">
              Publish tomorrow's fresh tiffin menu, announce kitchen specials, and chat directly with your subscribed customers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10 text-center">
              <span className="text-3xl font-black text-white">{subscribers.length}</span>
              <p className="text-[0.65rem] font-black text-orange-400 uppercase tracking-widest mt-0.5">
                Active Subscribers
              </p>
            </div>
            <Button
              onClick={loadData}
              variant="outline"
              className="h-12 w-12 rounded-2xl bg-white/10 hover:bg-white/20 border-white/20 text-white p-0 flex items-center justify-center"
              title="Refresh"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-white/10 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 scale-105'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Utensils className="w-4 h-4" /> Tomorrow's Menu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 scale-105'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <MessageCircle className="w-4 h-4" /> Subscriber Group Chat ({messages.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subscribers')}
            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'subscribers'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 scale-105'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Calendar className="w-4 h-4" /> Daily Meal Dispatch & Roster ({subscribers.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest">Loading Broadcast Hub...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: TOMORROW'S MENU */}
          {activeTab === 'menu' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Side */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="rounded-[2.5rem] border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight">Compose Tomorrow's Menu</h3>
                      <p className="text-xs text-gray-400 font-semibold">Subscribers see this pinned in their Kitchen Circle</p>
                    </div>
                    <span className="text-2xl">🍱</span>
                  </div>

                  {/* Meal Slot Selection */}
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black uppercase tracking-wider text-gray-400 block">
                      Target Meal Slot
                    </label>
                    <div className="flex gap-2">
                      {['Lunch & Dinner', 'Lunch Only', 'Dinner Only'].map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTomorrowMenu((p: any) => ({ ...p, meal_type: slot }))}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
                            tomorrowMenu.meal_type === slot
                              ? 'border-orange-600 bg-orange-50 text-orange-950 shadow-xs'
                              : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current Dishes List */}
                  <div className="space-y-3">
                    <label className="text-[0.65rem] font-black uppercase tracking-wider text-gray-400 block">
                      Menu Dishes & Items ({tomorrowMenu.items?.length || 0})
                    </label>
                    <div className="space-y-2">
                      {tomorrowMenu.items?.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-orange-200 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{item.icon || '🍲'}</span>
                            <div>
                              <p className="text-xs font-bold text-gray-900">{item.name}</p>
                              <p className="text-[0.65rem] font-semibold text-orange-600 uppercase">{item.type}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDish(idx)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Dish Input */}
                  <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-3">
                    <span className="text-[0.65rem] font-black uppercase tracking-wider text-orange-950 block">
                      + Add Item to Tomorrow's Menu
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Dish name (e.g., Aloo Gobi / Shahi Paneer)"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="flex-1 bg-white border border-orange-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-orange-600"
                      />
                      <select
                        value={newItemType}
                        onChange={(e) => setNewItemType(e.target.value)}
                        className="bg-white border border-orange-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none"
                      >
                        <option value="Main Curry">Main Curry</option>
                        <option value="Lentil">Lentil / Dal</option>
                        <option value="Breads">Breads / Rotis</option>
                        <option value="Rice">Rice</option>
                        <option value="Sides">Sides / Salad</option>
                        <option value="Sweet">Sweet / Dessert</option>
                        <option value="Special Dish">Special Dish</option>
                      </select>
                      <Button
                        type="button"
                        onClick={handleAddDish}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase px-4 rounded-xl shrink-0"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>

                  {/* Chef's Note */}
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black uppercase tracking-wider text-gray-400 block">
                      Chef's Special Note / Spice Details
                    </label>
                    <textarea
                      value={tomorrowMenu.chef_note || ''}
                      onChange={(e) => setTomorrowMenu((p: any) => ({ ...p, chef_note: e.target.value }))}
                      placeholder="E.g., Prepared fresh tomorrow morning with cold-pressed oil, mild spice, no preservatives."
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-xs font-medium focus:outline-none focus:border-orange-600 min-h-[80px]"
                    />
                  </div>

                  {/* Action Button */}
                  <Button
                    type="button"
                    onClick={handlePublishMenu}
                    disabled={isPublishingMenu}
                    className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-600/25 flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    {isPublishingMenu ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Broadcasting to Subscribers...
                      </>
                    ) : (
                      <>
                        <Megaphone className="w-4 h-4" /> Broadcast Menu to {subscribers.length} Subscribers
                      </>
                    )}
                  </Button>
                </Card>
              </div>

              {/* Live Preview Side */}
              <div className="lg:col-span-5 space-y-4">
                <div className="sticky top-8 space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                      Subscriber Mobile Preview
                    </span>
                    <span className="text-[0.65rem] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Live Look
                    </span>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border-2 border-orange-200 shadow-xl space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-amber-500 text-white text-[0.65rem] font-black uppercase px-3.5 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Tomorrow's Menu
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-orange-800">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span>Tomorrow</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-600">{tomorrowMenu.meal_type}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {tomorrowMenu.items?.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-50/60 border border-orange-100 text-xs"
                        >
                          <span className="text-base">{item.icon || '🍛'}</span>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">{item.name}</p>
                            <p className="text-[0.65rem] text-orange-700 font-semibold">{item.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {tomorrowMenu.chef_note && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2">
                        <ChefHat className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[0.7rem] leading-relaxed">
                          <strong className="font-bold">Chef's Note:</strong> {tomorrowMenu.chef_note}
                        </p>
                      </div>
                    )}

                    {/* ── WhatsApp Story & Broadcast Deck ── */}
                    <div className="pt-3 border-t border-orange-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.65rem] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                          <Share2 className="w-3 h-3 text-emerald-600" /> WhatsApp & Social Story
                        </span>
                        <span className="text-[0.6rem] font-bold text-gray-400">1-Tap Broadcast</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          onClick={handleShareWhatsApp}
                          className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-[0.65rem] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Post to WhatsApp
                        </Button>

                        <Button
                          type="button"
                          onClick={handleCopyWhatsAppText}
                          variant="outline"
                          className="h-10 border-gray-200 hover:bg-gray-50 text-gray-700 font-black uppercase tracking-wider text-[0.65rem] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Text
                        </Button>
                      </div>

                      <Button
                        type="button"
                        onClick={() => setShowStoryModal(true)}
                        variant="outline"
                        className="w-full h-10 border-orange-200 hover:bg-orange-50 text-orange-700 font-black uppercase tracking-wider text-[0.65rem] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-orange-600" /> View Visual 9:16 Story Card
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GROUP CHAT STREAM */}
          {activeTab === 'chat' && (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Kitchen Circle Subscriber Chat</h3>
                  <p className="text-xs text-gray-400 font-semibold">
                    Direct conversation with active subscribers ({subscribers.length} members)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshChat}
                    disabled={isRefreshingChat}
                    className="h-9 px-3 rounded-xl border-gray-200 text-xs font-black uppercase text-gray-700 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 gap-1.5 cursor-pointer shadow-2xs"
                    title="Refresh subscriber messages"
                  >
                    <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshingChat ? 'animate-spin text-orange-600' : ''}`} />
                    <span>{isRefreshingChat ? 'Refreshing...' : 'Refresh'}</span>
                  </Button>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-black uppercase px-3 py-2 rounded-xl border border-emerald-200">
                    ● {subscribers.length} Subscribers Listening
                  </span>
                </div>
              </div>

              {/* Messages Container */}
              <div className="bg-gray-50/70 rounded-3xl p-5 border border-gray-100 h-[420px] overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-2">
                    <MessageCircle className="w-10 h-10 text-gray-300" />
                    <p className="text-sm font-bold text-gray-600">No messages in Kitchen Circle yet.</p>
                    <p className="text-xs max-w-sm">
                      Send a welcome message or answer customer requests about taste preferences!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isChef = msg.is_vendor;
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isChef ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[0.65rem]">
                          <span className={`font-bold ${isChef ? 'text-orange-700' : 'text-gray-600'}`}>
                            {msg.sender_name}
                          </span>
                          {isChef && (
                            <span className="bg-orange-100 text-orange-800 text-[0.55rem] font-black px-1.5 py-0.2 rounded-md uppercase">
                              Chef (You)
                            </span>
                          )}
                        </div>
                        <div
                          className={`max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                            isChef
                              ? 'bg-orange-600 text-white rounded-tr-sm shadow-md'
                              : 'bg-white text-gray-900 border border-gray-200 shadow-xs rounded-tl-sm'
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

              {/* Chef Quick Reply Chips */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                  Quick Reply:
                </span>
                {[
                  'Will make it mild spicy for you! 🌶️',
                  'Extra salad will be packed! 🥗',
                  'Preparing your fresh tiffin now! 👨‍🍳',
                  'Dispatched on time with delivery partner! 🛵',
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip)}
                    className="text-[0.7rem] font-medium bg-gray-50 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Reply Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-3 pt-2"
              >
                <input
                  type="text"
                  placeholder="Reply to subscribers or send a kitchen update..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isSendingMessage}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-xs font-medium focus:outline-none focus:border-orange-600 focus:bg-white transition"
                />
                <Button
                  type="submit"
                  disabled={!chatInput.trim() || isSendingMessage}
                  className="h-12 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-xs tracking-wider shadow-md shrink-0 flex items-center gap-1.5"
                >
                  {isSendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send Reply
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* TAB 3: DAILY MEAL MANAGEMENT & SUBSCRIBER ROSTER */}
          {activeTab === 'subscribers' && (
            <div className="space-y-6">
              {/* Stat Cards Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
                  <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest block">Active Subscribers</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-gray-900">{subscribers.length}</span>
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-[0.65rem] text-emerald-600 font-bold">100% Verified</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
                  <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest block">
                    {selectedDayKey.toUpperCase()} Lunch Tiffins
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-orange-600">
                      {
                        subscribers.filter(
                          (s) =>
                            (s.delivery_days || []).map((d: string) => d.toLowerCase()).includes(selectedDayKey.toLowerCase()) &&
                            (s.meal_type === 'lunch' || s.meal_type === 'both' || !(s.delivery_time || '').toLowerCase().includes('dinner'))
                        ).length
                      }
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Sun className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-[0.65rem] text-gray-400 font-medium">Window: 12:00 - 01:30 PM</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
                  <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest block">
                    {selectedDayKey.toUpperCase()} Dinner Tiffins
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-indigo-600">
                      {
                        subscribers.filter(
                          (s) =>
                            (s.delivery_days || []).map((d: string) => d.toLowerCase()).includes(selectedDayKey.toLowerCase()) &&
                            (s.meal_type === 'dinner' || (s.delivery_time || '').toLowerCase().includes('dinner'))
                        ).length
                      }
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Moon className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-[0.65rem] text-gray-400 font-medium">Window: 07:30 - 09:00 PM</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
                  <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest block">Total Meals to Cook</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-emerald-600">
                      {
                        subscribers.filter((s) =>
                          (s.delivery_days || []).map((d: string) => d.toLowerCase()).includes(selectedDayKey.toLowerCase())
                        ).length
                      }
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <ChefHat className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-[0.65rem] text-emerald-600 font-bold">Scheduled for {selectedDayKey}</span>
                </div>
              </div>

              {/* Day Selector Strip & Mode Toggle */}
              <Card className="rounded-3xl border-gray-100 shadow-sm p-4 sm:p-5 space-y-4 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      <span>Daily Meal Dispatch & Kitchen Planner</span>
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                      Select any day to inspect subscribers scheduled for that day, their delivery time slot, and address
                    </p>
                  </div>

                  {/* Mode Switcher */}
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setRosterViewMode('daily_dispatcher')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        rosterViewMode === 'daily_dispatcher'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Day Dispatcher
                    </button>
                    <button
                      type="button"
                      onClick={() => setRosterViewMode('master_matrix')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        rosterViewMode === 'master_matrix'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Weekly Matrix
                    </button>
                  </div>
                </div>

                {/* Day-of-Week Ribbon */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {daysOfWeek.map((day) => {
                    const isSelected = selectedDayKey === day.key;
                    const isToday = todayKey === day.key;
                    const countForDay = subscribers.filter((s) =>
                      (s.delivery_days || []).map((d: string) => d.toLowerCase()).includes(day.key)
                    ).length;

                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => setSelectedDayKey(day.key)}
                        className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all shrink-0 cursor-pointer text-xs font-bold ${
                          isSelected
                            ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                        }`}
                      >
                        <span>{day.label}</span>
                        {isToday && (
                          <span className={`text-[0.6rem] px-1.5 py-0.2 rounded-full font-black uppercase ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
                          }`}>
                            Today
                          </span>
                        )}
                        <span className={`text-[0.65rem] px-2 py-0.5 rounded-full font-extrabold ${
                          isSelected ? 'bg-black/20 text-white' : 'bg-gray-200/80 text-gray-700'
                        }`}>
                          {countForDay}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* View 1: Daily Dispatcher */}
              {rosterViewMode === 'daily_dispatcher' && (
                <div className="space-y-6">
                  {/* BATCH 1: LUNCH */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                          <Sun className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-gray-900 tracking-tight uppercase">
                            Lunch Dispatch Batch (
                            {
                              subscribers.filter(
                                (s) =>
                                  (s.delivery_days || []).map((d: string) => d.toLowerCase()).includes(selectedDayKey.toLowerCase()) &&
                                  (s.meal_type === 'lunch' || s.meal_type === 'both' || !(s.delivery_time || '').toLowerCase().includes('dinner'))
                              ).length
                            }{' '}
                            Meals)
                          </h4>
                          <span className="text-[0.65rem] font-bold text-gray-400">
                            Preferred window: 12:00 PM – 01:30 PM
                          </span>
                        </div>
                      </div>
                    </div>

                    {subscribers.filter(
                      (s) =>
                        (s.delivery_days || []).map((d: string) => d.toLowerCase()).includes(selectedDayKey.toLowerCase()) &&
                        (s.meal_type === 'lunch' || s.meal_type === 'both' || !(s.delivery_time || '').toLowerCase().includes('dinner'))
                    ).length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 text-gray-400 text-xs font-bold">
                        No subscribers have lunch scheduled on {selectedDayKey.toUpperCase()}.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subscribers
                          .filter(
                            (s) =>
                              (s.delivery_days || []).map((d: string) => d.toLowerCase()).includes(selectedDayKey.toLowerCase()) &&
                              (s.meal_type === 'lunch' || s.meal_type === 'both' || !(s.delivery_time || '').toLowerCase().includes('dinner'))
                          )
                          .map((sub) => {
                            const status = tiffinStatuses[`${sub.id}_${selectedDayKey}`] || 'scheduled';

                            return (
                              <Card
                                key={sub.id}
                                className="rounded-3xl border-gray-100 shadow-sm p-5 space-y-4 hover:border-orange-200 transition-all bg-white"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-sm shrink-0">
                                      {sub.customer_name?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-bold text-gray-900">{sub.customer_name}</h5>
                                      <div className="flex items-center gap-2 text-[0.65rem] text-gray-500 font-medium">
                                        <span>{sub.customer_phone || '+91 98000 00000'}</span>
                                        <span>•</span>
                                        <a
                                          href={`https://wa.me/${(sub.customer_phone || '').replace(/[^0-9]/g, '')}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-emerald-600 font-bold hover:underline"
                                        >
                                          WhatsApp
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[0.65rem] font-black uppercase px-2.5 py-0.5 rounded-full shrink-0">
                                    {sub.plan_type}
                                  </span>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
                                  <div>
                                    <span className="text-[0.6rem] font-bold text-gray-400 uppercase block">Delivery Target</span>
                                    <span className="font-extrabold text-gray-900 flex items-center gap-1 mt-0.5">
                                      <Clock className="w-3.5 h-3.5 text-orange-600" />
                                      {sub.delivery_time || '12:30 PM'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[0.6rem] font-bold text-gray-400 uppercase block">Weekly Active</span>
                                    <span className="font-extrabold text-gray-900 mt-0.5 block">
                                      {sub.delivery_days?.length || 5} Days / Week
                                    </span>
                                  </div>
                                </div>

                                {/* Drop Address */}
                                <div className="text-xs space-y-1">
                                  <span className="text-[0.6rem] font-bold text-gray-400 uppercase block">Drop Address</span>
                                  <p className="text-gray-700 font-medium flex items-start gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                                    <span className="line-clamp-2">
                                      {typeof sub.address === 'string' ? sub.address : sub.address?.street || 'Local Address'}, {sub.address?.city || 'Pune'}
                                    </span>
                                  </p>
                                </div>

                                {/* Preference / Note */}
                                {sub.dietary_note && (
                                  <div className="p-2.5 bg-orange-50/50 rounded-xl border border-orange-100 text-[0.7rem] text-orange-950 font-medium">
                                    <strong>Note:</strong> {sub.dietary_note}
                                  </div>
                                )}

                                {/* Status Action Bar */}
                                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[0.6rem] font-bold text-gray-400 uppercase">Status:</span>
                                    <span className={`text-[0.65rem] font-black uppercase px-2 py-0.5 rounded-md ${
                                      status === 'dispatched'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : status === 'packed'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {status}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {status !== 'packed' && status !== 'dispatched' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateTiffinStatus(sub, 'packed')}
                                        className="h-8 px-3 text-[0.65rem] font-black uppercase rounded-xl border-gray-200 hover:bg-gray-50 cursor-pointer"
                                      >
                                        Mark Packed
                                      </Button>
                                    )}
                                    {status !== 'dispatched' && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleUpdateTiffinStatus(sub, 'dispatched')}
                                        className="h-8 px-3 text-[0.65rem] font-black uppercase rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-xs flex items-center gap-1 cursor-pointer"
                                      >
                                        <Send className="w-3 h-3" /> Dispatch
                                      </Button>
                                    )}
                                    {status === 'dispatched' && (
                                      <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" /> Dispatched
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* BATCH 2: DINNER */}
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          <Moon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-gray-900 tracking-tight uppercase">
                            Dinner Dispatch Batch (
                            {
                              subscribers.filter(
                                (s) =>
                                  (s.delivery_days || []).map((d: string) => d.toLowerCase()).includes(selectedDayKey.toLowerCase()) &&
                                  (s.meal_type === 'dinner' || (s.delivery_time || '').toLowerCase().includes('dinner'))
                              ).length
                            }{' '}
                            Meals)
                          </h4>
                          <span className="text-[0.65rem] font-bold text-gray-400">
                            Preferred window: 07:30 PM – 09:00 PM
                          </span>
                        </div>
                      </div>
                    </div>

                    {subscribers.filter(
                      (s) =>
                        (s.delivery_days || []).map((d: string) => d.toLowerCase()).includes(selectedDayKey.toLowerCase()) &&
                        (s.meal_type === 'dinner' || (s.delivery_time || '').toLowerCase().includes('dinner'))
                    ).length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 text-gray-400 text-xs font-bold">
                        No subscribers have dinner scheduled on {selectedDayKey.toUpperCase()}.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subscribers
                          .filter(
                            (s) =>
                              (s.delivery_days || []).map((d: string) => d.toLowerCase()).includes(selectedDayKey.toLowerCase()) &&
                              (s.meal_type === 'dinner' || (s.delivery_time || '').toLowerCase().includes('dinner'))
                          )
                          .map((sub) => {
                            const status = tiffinStatuses[`${sub.id}_${selectedDayKey}`] || 'scheduled';

                            return (
                              <Card
                                key={sub.id}
                                className="rounded-3xl border-gray-100 shadow-sm p-5 space-y-4 hover:border-orange-200 transition-all bg-white"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0">
                                      {sub.customer_name?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-bold text-gray-900">{sub.customer_name}</h5>
                                      <div className="flex items-center gap-2 text-[0.65rem] text-gray-500 font-medium">
                                        <span>{sub.customer_phone || '+91 98000 00000'}</span>
                                        <span>•</span>
                                        <a
                                          href={`https://wa.me/${(sub.customer_phone || '').replace(/[^0-9]/g, '')}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-emerald-600 font-bold hover:underline"
                                        >
                                          WhatsApp
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 text-[0.65rem] font-black uppercase px-2.5 py-0.5 rounded-full shrink-0">
                                    {sub.plan_type}
                                  </span>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
                                  <div>
                                    <span className="text-[0.6rem] font-bold text-gray-400 uppercase block">Delivery Target</span>
                                    <span className="font-extrabold text-gray-900 flex items-center gap-1 mt-0.5">
                                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                      {sub.delivery_time || '08:00 PM'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[0.6rem] font-bold text-gray-400 uppercase block">Weekly Active</span>
                                    <span className="font-extrabold text-gray-900 mt-0.5 block">
                                      {sub.delivery_days?.length || 5} Days / Week
                                    </span>
                                  </div>
                                </div>

                                {/* Drop Address */}
                                <div className="text-xs space-y-1">
                                  <span className="text-[0.6rem] font-bold text-gray-400 uppercase block">Drop Address</span>
                                  <p className="text-gray-700 font-medium flex items-start gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                                    <span className="line-clamp-2">
                                      {typeof sub.address === 'string' ? sub.address : sub.address?.street || 'Local Address'}, {sub.address?.city || 'Pune'}
                                    </span>
                                  </p>
                                </div>

                                {/* Preference / Note */}
                                {sub.dietary_note && (
                                  <div className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[0.7rem] text-indigo-950 font-medium">
                                    <strong>Note:</strong> {sub.dietary_note}
                                  </div>
                                )}

                                {/* Status Action Bar */}
                                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[0.6rem] font-bold text-gray-400 uppercase">Status:</span>
                                    <span className={`text-[0.65rem] font-black uppercase px-2 py-0.5 rounded-md ${
                                      status === 'dispatched'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : status === 'packed'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {status}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {status !== 'packed' && status !== 'dispatched' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateTiffinStatus(sub, 'packed')}
                                        className="h-8 px-3 text-[0.65rem] font-black uppercase rounded-xl border-gray-200 hover:bg-gray-50 cursor-pointer"
                                      >
                                        Mark Packed
                                      </Button>
                                    )}
                                    {status !== 'dispatched' && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleUpdateTiffinStatus(sub, 'dispatched')}
                                        className="h-8 px-3 text-[0.65rem] font-black uppercase rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-xs flex items-center gap-1 cursor-pointer"
                                      >
                                        <Send className="w-3 h-3" /> Dispatch
                                      </Button>
                                    )}
                                    {status === 'dispatched' && (
                                      <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" /> Dispatched
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View 2: Master Weekly Delivery Matrix */}
              {rosterViewMode === 'master_matrix' && (
                <Card className="rounded-3xl border-gray-100 shadow-sm p-6 space-y-4 bg-white overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black text-gray-900 tracking-tight">Master Subscriber Delivery Matrix</h4>
                      <p className="text-xs text-gray-400 font-medium">All registered subscribers and their active weekly delivery days</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50/80 text-gray-400 uppercase text-[0.65rem] font-black border-y border-gray-100">
                        <tr>
                          <th className="p-3">Subscriber</th>
                          <th className="p-3">Plan</th>
                          <th className="p-3">Time Slot</th>
                          <th className="p-3 text-center">Mon</th>
                          <th className="p-3 text-center">Tue</th>
                          <th className="p-3 text-center">Wed</th>
                          <th className="p-3 text-center">Thu</th>
                          <th className="p-3 text-center">Fri</th>
                          <th className="p-3 text-center">Sat</th>
                          <th className="p-3 text-center">Sun</th>
                          <th className="p-3">Drop Zone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                        {subscribers.map((sub) => {
                          const activeDays = (sub.delivery_days || []).map((d: string) => d.toLowerCase());

                          return (
                            <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-gray-900">{sub.customer_name}</div>
                                <div className="text-[0.65rem] text-gray-400">{sub.customer_phone}</div>
                              </td>
                              <td className="p-3">
                                <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[0.6rem] font-bold px-2 py-0.5 rounded-full uppercase">
                                  {sub.plan_type}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-gray-900">
                                {sub.delivery_time || '12:30 PM'}
                              </td>
                              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => {
                                const isActive = activeDays.includes(d);
                                return (
                                  <td key={d} className="p-3 text-center">
                                    {isActive ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                                        ✓
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-300 text-xs">
                                        –
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="p-3 max-w-[180px] truncate text-[0.7rem] text-gray-500">
                                {typeof sub.address === 'string' ? sub.address : sub.address?.street || 'Local Address'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* ── 9:16 VISUAL STORY CARD MODAL ── */}
      <Dialog open={showStoryModal} onOpenChange={setShowStoryModal}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-6 bg-[#0E0E0E] text-white border border-white/10 shadow-2xl overflow-hidden">
          <DialogHeader className="space-y-1 text-center">
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-amber-400">
              WhatsApp & Instagram Story Card
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Formatted for 9:16 mobile status & stories
            </DialogDescription>
          </DialogHeader>

          {/* 9:16 Vertical Story Frame */}
          <div className="relative mx-auto w-full max-w-[320px] aspect-[9/16] rounded-[2rem] bg-gradient-to-b from-[#2B1705] via-[#1A0E03] to-[#0A0502] p-5 flex flex-col justify-between border-2 border-amber-500/30 shadow-[0_20px_50px_rgba(249,115,22,0.15)] overflow-hidden">
            {/* Top Glow & Badge */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[0.55rem] font-black uppercase tracking-[0.25em] bg-orange-500/20 text-orange-300 px-2.5 py-1 rounded-full border border-orange-500/30">
                  Daily Homestyle Menu
                </span>
                <span className="text-[0.6rem] font-bold text-gray-400">
                  {tomorrowMenu.meal_type || 'Lunch & Dinner'}
                </span>
              </div>

              {/* Kitchen Name & Header */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white shrink-0">
                    <ChefHat className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-white uppercase italic tracking-tight line-clamp-1">
                    {vendorData?.business_name || "Anita's Home Kitchen"}
                  </h3>
                </div>
                <p className="text-[0.6rem] text-orange-200/80 font-bold uppercase tracking-wider">
                  Authentic Ghar Ka Khana • Delivered Fresh
                </p>
              </div>

              {/* Menu Dishes List */}
              <div className="space-y-1.5 pt-2">
                {tomorrowMenu.items?.slice(0, 6).map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl px-3 py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0">{item.icon || '🍲'}</span>
                      <span className="font-black text-white text-[0.7rem] truncate">{item.name}</span>
                    </div>
                    <span className="text-[0.55rem] font-bold uppercase text-orange-400 shrink-0 ml-2">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chef Note & Footer */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              {tomorrowMenu.chef_note && (
                <div className="p-2.5 rounded-xl bg-orange-950/40 border border-orange-500/20 text-[0.65rem] text-orange-200 italic leading-snug">
                  "{tomorrowMenu.chef_note}"
                </div>
              )}

              <div className="flex items-center justify-between text-[0.6rem] text-gray-400 font-bold pt-1">
                <span>Zero Preservatives</span>
                <span>•</span>
                <span>Desi Ghee / Cold Pressed</span>
                <span>•</span>
                <span>Rasan Grid</span>
              </div>

              <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl py-2 px-3 text-center shadow-lg">
                <p className="text-[0.55rem] font-black uppercase tracking-widest text-orange-100">ORDER ON RASAN</p>
                <p className="text-[0.65rem] font-black tracking-tight mt-0.5">rasan.app/vendors</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              onClick={handleCopyWhatsAppText}
              variant="outline"
              className="flex-1 h-11 border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-wider text-xs rounded-xl cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Text
            </Button>
            <Button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
