'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCart } from '@/lib/hooks/use-cart';
import {
  getStoredDeliveryLocation,
  RASAN_LOCATION_EVENT,
  AccurateLocationResult,
} from '@/lib/hooks/use-location';
import { Button } from '@/components/ui/button';
import UserMenu from './user-menu';
import NotificationBell from './notification-bell';
import MobileNav from './mobile-nav';
import { LocationSelectorModal } from '@/components/location/location-selector-modal';
import { 
  Search, 
  ShoppingBag, 
  MapPin, 
  ChevronDown, 
  Store, 
  Truck, 
  Utensils, 
  Package, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

interface HeaderProps {
  user?: {
    id: string;
    email: string;
    role: string;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount } = useCart();
  
  // Customer Search & Location States
  const [location, setLocation] = useState('Pimpri');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; price: number; rating: number | null; is_vegetarian: boolean }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Vendor Search States
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [vendorOrders, setVendorOrders] = useState<any[]>([]);
  const [vendorResults, setVendorResults] = useState<any[]>([]);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);

  // Delivery Search States
  const [deliverySearchQuery, setDeliverySearchQuery] = useState('');
  const [deliveryResults, setDeliveryResults] = useState<any[]>([]);
  const [showDeliveryDropdown, setShowDeliveryDropdown] = useState(false);

  // Synchronize customer location
  useEffect(() => {
    const stored = getStoredDeliveryLocation();
    if (stored?.details?.locality) {
      setLocation(stored.details.locality);
    } else {
      setLocation('Pimpri');
    }

    const handleLocationChange = (e: CustomEvent<AccurateLocationResult>) => {
      if (e.detail?.details?.locality) {
        setLocation(e.detail.details.locality);
      }
    };

    window.addEventListener(RASAN_LOCATION_EVENT as any, handleLocationChange as any);
    return () => {
      window.removeEventListener(RASAN_LOCATION_EVENT as any, handleLocationChange as any);
    };
  }, []);

  // Customer meal search autocomplete
  useEffect(() => {
    if (user && user.role !== 'customer') return;

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/meals?search=${encodeURIComponent(searchQuery.trim())}&limit=5`);
        const json = await res.json();
        setSearchResults(json.meals || []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  // Vendor order & menu search autocomplete
  useEffect(() => {
    if (user?.role !== 'vendor') return;

    if (vendorSearchQuery.trim().length < 1) {
      setVendorResults([]);
      setShowVendorDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/vendor/orders');
        const json = await res.json();
        const allOrders = json.orders || [];
        const q = vendorSearchQuery.toLowerCase().trim();

        const matched = allOrders.filter((o: any) => {
          const idMatch = o.id?.toLowerCase().includes(q);
          const addressMatch = o.delivery_address?.toLowerCase().includes(q);
          const statusMatch = o.status?.toLowerCase().includes(q);
          const itemsMatch = (o.items || []).some((item: any) => 
            item.name?.toLowerCase().includes(q) || item.meal_name?.toLowerCase().includes(q)
          );
          return idMatch || addressMatch || statusMatch || itemsMatch;
        });

        setVendorResults(matched.slice(0, 5));
        setShowVendorDropdown(true);
      } catch {
        setVendorResults([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [vendorSearchQuery, user]);

  // Delivery mission search autocomplete
  useEffect(() => {
    if (user?.role !== 'delivery') return;

    if (deliverySearchQuery.trim().length < 1) {
      setDeliveryResults([]);
      setShowDeliveryDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/delivery/orders');
        const json = await res.json();
        const available = json.available_orders || [];
        const active = json.active_deliveries || [];
        const all = [...active, ...available];
        const q = deliverySearchQuery.toLowerCase().trim();

        const matched = all.filter((o: any) => {
          const idMatch = o.id?.toLowerCase().includes(q);
          const addressMatch = o.delivery_address?.toLowerCase().includes(q);
          const kitchenMatch = o.kitchen_name?.toLowerCase().includes(q) || o.vendor_name?.toLowerCase().includes(q);
          return idMatch || addressMatch || kitchenMatch;
        });

        setDeliveryResults(matched.slice(0, 5));
        setShowDeliveryDropdown(true);
      } catch {
        setDeliveryResults([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [deliverySearchQuery, user]);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(loc) => {
          if (loc.details.locality) {
            setLocation(loc.details.locality);
          }
        }}
      />

      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 md:h-20 items-center justify-between gap-4 md:gap-6">
            
            {/* Logo with Modern Flair */}
            <Link 
              href={user?.role === 'vendor' ? '/vendor-dashboard' : user?.role === 'delivery' ? '/delivery-dashboard' : '/'} 
              className="flex items-center gap-2 group shrink-0"
            >
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-xl shadow-lg group-hover:scale-110 smooth-transition">
                <span className="text-xl md:text-2xl leading-none">🍱</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl md:text-2xl text-[#1A1A1A] tracking-tighter leading-tight">Rasan</span>
                <span className="text-[0.6rem] font-bold text-orange-600 uppercase tracking-widest leading-none">
                  {user?.role === 'vendor' ? 'Chef Terminal' : user?.role === 'delivery' ? 'Pilot Radar' : 'Home Made'}
                </span>
              </div>
            </Link>

            {/* ── ROLE-AWARE CENTER HEADER BAR ── */}

            {/* 1. VENDOR CENTER BAR: Kitchen Status & Order Lookups */}
            {user?.role === 'vendor' && (
              <div className="hidden lg:flex items-center gap-3 flex-1 max-w-2xl bg-gray-50/90 p-1.5 rounded-2xl border border-gray-200/80 focus-within:bg-white focus-within:border-orange-500 focus-within:shadow-lg transition-all duration-300">
                {/* Kitchen Status Pill */}
                <Link
                  href="/vendor-profile"
                  className="flex items-center gap-2.5 px-3.5 py-1.5 bg-green-50 hover:bg-green-100/80 rounded-xl transition-all border border-green-200/60 shrink-0 group"
                  title="Manage Kitchen Status and Profile"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <div className="text-left">
                    <div className="text-[0.55rem] font-black uppercase tracking-wider text-green-700">Kitchen Live</div>
                    <div className="text-xs font-black text-gray-900 group-hover:text-green-800">Taking Orders</div>
                  </div>
                </Link>

                <div className="w-px h-8 bg-gray-200 shrink-0" />

                {/* Vendor Order & Dish Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={vendorSearchQuery}
                    onChange={(e) => setVendorSearchQuery(e.target.value)}
                    onFocus={() => vendorSearchQuery.length >= 1 && setShowVendorDropdown(true)}
                    onBlur={() => setTimeout(() => setShowVendorDropdown(false), 250)}
                    placeholder="Search Order #ID, customer name, address, or meal..."
                    className="w-full bg-transparent pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none placeholder-gray-400"
                  />

                  {/* Autocomplete Dropdown for Vendor */}
                  {showVendorDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-3 py-1 text-[0.6rem] font-black text-orange-600 uppercase tracking-widest">
                        Kitchen Order Matches
                      </div>
                      {vendorResults.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          {vendorResults.map((order) => (
                            <Link
                              key={order.id}
                              href={`/vendor-orders`}
                              onClick={() => {
                                setShowVendorDropdown(false);
                                setVendorSearchQuery('');
                              }}
                              className="flex items-center justify-between p-2.5 hover:bg-orange-50/60 rounded-xl transition-all group"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-black">
                                  #{order.id.slice(0, 4)}
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-xs text-gray-900 group-hover:text-orange-600">
                                    Order #{order.id.slice(0, 8).toUpperCase()}
                                  </div>
                                  <div className="text-[0.65rem] text-gray-500 font-medium truncate max-w-[220px]">
                                    {order.delivery_address || 'Home Delivery'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-[0.6rem] font-black uppercase px-2 py-0.5 rounded-full ${
                                  order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {order.status}
                                </span>
                                <div className="text-xs font-black text-gray-900 mt-0.5">₹{order.total}</div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs font-medium text-gray-400">
                          No matching orders found for &quot;{vendorSearchQuery}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. DELIVERY CENTER BAR: Pilot Tactical Radar & Dispatch Search */}
            {user?.role === 'delivery' && (
              <div className="hidden lg:flex items-center gap-3 flex-1 max-w-2xl bg-gray-50/90 p-1.5 rounded-2xl border border-gray-200/80 focus-within:bg-white focus-within:border-orange-500 focus-within:shadow-lg transition-all duration-300">
                {/* Pilot Duty Radar Pill */}
                <Link
                  href="/operator-profile"
                  className="flex items-center gap-2.5 px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100/80 rounded-xl transition-all border border-orange-200/60 shrink-0 group"
                  title="View Pilot Matrix & Radar Status"
                >
                  <Activity className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                  <div className="text-left">
                    <div className="text-[0.55rem] font-black uppercase tracking-wider text-orange-700">Rider Node</div>
                    <div className="text-xs font-black text-gray-900 group-hover:text-orange-800">Online & Armed</div>
                  </div>
                </Link>

                <div className="w-px h-8 bg-gray-200 shrink-0" />

                {/* Delivery Order Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={deliverySearchQuery}
                    onChange={(e) => setDeliverySearchQuery(e.target.value)}
                    onFocus={() => deliverySearchQuery.length >= 1 && setShowDeliveryDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDeliveryDropdown(false), 250)}
                    placeholder="Search Mission #ID, drop locality, or kitchen..."
                    className="w-full bg-transparent pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none placeholder-gray-400"
                  />

                  {/* Autocomplete Dropdown for Delivery */}
                  {showDeliveryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-3 py-1 text-[0.6rem] font-black text-orange-600 uppercase tracking-widest">
                        Matching Missions
                      </div>
                      {deliveryResults.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          {deliveryResults.map((order) => (
                            <Link
                              key={order.id}
                              href={`/available-orders`}
                              onClick={() => {
                                setShowDeliveryDropdown(false);
                                setDeliverySearchQuery('');
                              }}
                              className="flex items-center justify-between p-2.5 hover:bg-orange-50/60 rounded-xl transition-all group"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-black">
                                  <Truck className="w-3.5 h-3.5" />
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-xs text-gray-900 group-hover:text-orange-600">
                                    Mission #{order.id.slice(0, 8).toUpperCase()}
                                  </div>
                                  <div className="text-[0.65rem] text-gray-500 font-medium truncate max-w-[220px]">
                                    {order.delivery_address || 'Hyperlocal delivery'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-black text-green-600">+₹{order.delivery_fee || 40}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs font-medium text-gray-400">
                          No missions found for &quot;{deliverySearchQuery}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. CUSTOMER / GUEST CENTER BAR: Food Discovery & Location */}
            {(!user || user.role === 'customer') && (
              <div className="hidden lg:flex items-center gap-3 flex-1 max-w-2xl bg-gray-50/80 p-1.5 rounded-2xl border border-gray-200/80 focus-within:bg-white focus-within:border-orange-500 focus-within:shadow-lg transition-all duration-300">
                {/* Deliver To Map Selector Button */}
                <button 
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-white rounded-xl group transition-all cursor-pointer shrink-0"
                  onClick={() => setIsLocationModalOpen(true)}
                  title="Select delivery location on interactive map"
                >
                  <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-[0.6rem] text-gray-400 font-black uppercase tracking-wider flex items-center gap-1">
                      Deliver to <span className="text-[0.55rem] text-orange-600 font-black px-1 rounded bg-orange-100/60">MAP</span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1 leading-tight">
                      <span className="max-w-[110px] truncate">{location}</span>
                      <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-orange-600 transition-colors shrink-0" />
                    </div>
                  </div>
                </button>

                <div className="w-px h-8 bg-gray-200 shrink-0" />

                {/* Customer search input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder="Craving homemade biryani, parathas or thali?"
                    className="w-full bg-transparent pl-10 pr-4 py-2 text-sm font-medium focus:outline-none placeholder-gray-400"
                  />

                  {/* Autocomplete Dropdown */}
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                      {isSearching ? (
                        <div className="p-4 text-center text-xs font-bold text-gray-400">Searching fresh meals…</div>
                      ) : searchResults.length > 0 ? (
                        <div className="space-y-1">
                          <div className="px-3 py-1 text-[0.6rem] font-black text-orange-600 uppercase tracking-widest">Instant Results</div>
                          {searchResults.map((meal) => (
                            <Link
                              key={meal.id}
                              href={`/meals/${meal.id}`}
                              onClick={() => { setShowDropdown(false); setSearchQuery(''); }}
                              className="flex items-center justify-between p-2.5 hover:bg-orange-50/60 rounded-xl transition-all group"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${meal.is_vegetarian ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="font-bold text-sm text-gray-900 group-hover:text-orange-600 transition-colors">{meal.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {meal.rating && <span className="text-xs text-amber-500 font-bold">★ {meal.rating.toFixed(1)}</span>}
                                <span className="text-xs font-black text-gray-900">₹{meal.price}</span>
                              </div>
                            </Link>
                          ))}
                          <Link
                            href={`/meals?search=${encodeURIComponent(searchQuery)}`}
                            onClick={() => setShowDropdown(false)}
                            className="block text-center p-2 text-xs font-bold text-orange-600 hover:bg-orange-50 rounded-xl transition"
                          >
                            View all results for &quot;{searchQuery}&quot; →
                          </Link>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs font-bold text-gray-400">No home-cooked meals found matching &quot;{searchQuery}&quot;</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Location Trigger (Customers only) */}
            {(!user || user.role === 'customer') && (
              <div className="lg:hidden flex items-center">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-50/80 border border-orange-100 hover:bg-orange-100 rounded-xl text-orange-900 text-xs font-bold transition-all"
                >
                  <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span className="max-w-[80px] truncate text-[0.7rem]">{location}</span>
                  <ChevronDown className="w-3 h-3 text-orange-500 shrink-0" />
                </button>
              </div>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  {/* Cart Icon (Customers only) */}
                  {user.role === 'customer' && (
                    <Link href="/cart" className="group relative p-2.5 sm:p-3 hover:bg-orange-50 rounded-2xl transition-all">
                      <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 group-hover:text-orange-600" />
                      {itemCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-orange-600 text-white text-[0.6rem] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
                          {itemCount}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Vendor Direct Quick-Action (+ New Dish) */}
                  {user.role === 'vendor' && (
                    <Button
                      size="sm"
                      asChild
                      className="hidden sm:inline-flex bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl px-3.5 h-9 shadow-md"
                    >
                      <Link href="/menu-management">
                        <Utensils className="w-3.5 h-3.5 mr-1.5" /> + Add Dish
                      </Link>
                    </Button>
                  )}

                  {/* Delivery Direct Quick-Action (Earnings / Cashout) */}
                  {user.role === 'delivery' && (
                    <Button
                      size="sm"
                      asChild
                      className="hidden sm:inline-flex bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase tracking-wider rounded-xl px-3.5 h-9 shadow-md"
                    >
                      <Link href="/earnings">
                        <Zap className="w-3.5 h-3.5 mr-1.5" /> Cashout
                      </Link>
                    </Button>
                  )}

                  {/* Notifications */}
                  <NotificationBell userId={user.id} />

                  {/* User Menu */}
                  <div className="hidden md:block pl-2 border-l border-gray-100">
                    <UserMenu user={user} />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-gray-900 font-bold rounded-xl" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button size="sm" className="bg-[#1A1A1A] hover:bg-orange-600 text-white font-bold px-4 sm:px-6 rounded-xl shadow-lg transition-all" asChild>
                    <Link href="/register">Join Now</Link>
                  </Button>
                </div>
              )}

              {/* Mobile Nav */}
              <div className="md:hidden">
                <MobileNav user={user} />
              </div>
            </div>
          </div>

          {/* Categories / Secondary Nav (Customers / Guests only) */}
          {(!user || user.role === 'customer') && (
            <div className="hidden md:flex items-center gap-8 pb-3 pt-1">
              {[
                { label: 'Menu', path: '/meals' },
                { label: 'Vendors', path: '/vendors' },
                ...(user ? [
                  { label: 'Subscriptions', path: '/subscriptions' },
                  { label: 'Order History', path: '/orders' }
                ] : [])
              ].map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-[0.65rem] font-black uppercase tracking-[0.2em] transition-all hover:text-orange-600 ${
                    isActive(link.path)
                      ? 'text-orange-600'
                      : 'text-gray-400'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>
    </>
  );
}
