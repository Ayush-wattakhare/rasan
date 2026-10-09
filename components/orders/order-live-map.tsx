'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

interface LatLng { lat: number; lng: number }

interface OrderLiveMapProps {
  orderId: string;
  vendorLocation?: LatLng;
  deliveryLocation?: LatLng;
  initialRiderLocation?: LatLng;
  deliveryPartnerId?: string;
}

// Calculate Haversine distance in km
function haversineDistance(pt1: LatLng, pt2: LatLng): number {
  const R = 6371; // Earth's radius in km
  const dLat = (pt2.lat - pt1.lat) * (Math.PI / 180);
  const dLng = (pt2.lng - pt1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pt1.lat * (Math.PI / 180)) *
      Math.cos(pt2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function OrderLiveMap({
  orderId,
  vendorLocation,
  deliveryLocation,
  initialRiderLocation,
  deliveryPartnerId,
}: OrderLiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const animRef = useRef<number | null>(null);

  const [riderPos, setRiderPos] = useState<LatLng | null>(initialRiderLocation || null);
  const [loaded, setLoaded] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const supabase = createClient();

  // -- Fallback HTTP polling for rider location --------------------------------
  useEffect(() => {
    if (!deliveryPartnerId) return;

    const fetchLatestLocation = async () => {
      try {
        const res = await fetch(`/api/delivery-partners/${deliveryPartnerId}/location`);
        if (res.ok) {
          const data = await res.json();
          if (data?.lat && data?.lng) {
            setRiderPos({ lat: data.lat, lng: data.lng });
            setLastSync(new Date());
          }
        }
      } catch (err) {
        // Silently handle fallback error
      }
    };

    const interval = setInterval(fetchLatestLocation, 5000);
    return () => clearInterval(interval);
  }, [deliveryPartnerId]);

  // -- Real-time rider position via Supabase Realtime ---------------------------
  useEffect(() => {
    if (!deliveryPartnerId) return;

    const channel = supabase
      .channel(`rider-location-${deliveryPartnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_partners',
          filter: `id=eq.${deliveryPartnerId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData?.current_lat && newData?.current_lng) {
            setRiderPos({ lat: newData.current_lat, lng: newData.current_lng });
            setLastSync(new Date());
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [deliveryPartnerId, supabase]);

  // -- Compute distance and estimated arrival -----------------------------------
  const targetDestination = deliveryLocation || vendorLocation;
  const distanceKm = useMemo(() => {
    const currentRider = riderPos || vendorLocation;
    if (!currentRider || !targetDestination) return null;
    return haversineDistance(currentRider, targetDestination);
  }, [riderPos, vendorLocation, targetDestination]);

  const etaMins = useMemo(() => {
    if (distanceKm === null) return null;
    return Math.max(2, Math.ceil(distanceKm * 3.5) + 3);
  }, [distanceKm]);

  // -- Update rider marker with smooth animation -------------------------------
  useEffect(() => {
    if (!mapRef.current || !riderMarkerRef.current || !riderPos) return;

    const marker = riderMarkerRef.current;
    const startLatLng = marker.getLatLng();
    const targetLatLng = [riderPos.lat, riderPos.lng];

    const startTime = performance.now();
    const duration = 1000; // 1 second smooth lerp transition

    const animateStep = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const lat = startLatLng.lat + (targetLatLng[0] - startLatLng.lat) * progress;
      const lng = startLatLng.lng + (targetLatLng[1] - startLatLng.lng) * progress;

      marker.setLatLng([lat, lng]);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animateStep);
      } else {
        // Auto-fit bounds when updated
        const points: [number, number][] = [];
        if (vendorLocation) points.push([vendorLocation.lat, vendorLocation.lng]);
        if (deliveryLocation) points.push([deliveryLocation.lat, deliveryLocation.lng]);
        points.push([riderPos.lat, riderPos.lng]);

        if (points.length >= 2 && mapRef.current) {
          mapRef.current.fitBounds(points, { padding: [50, 50], maxZoom: 16 });
        }
      }
    };

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animateStep);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [riderPos, vendorLocation, deliveryLocation]);

  // -- Initialize Leaflet map (client-only, after mount) ------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css' as any);

      if (cancelled || !containerRef.current) return;

      // Default center: vendor or delivery location or Mumbai
      const center: [number, number] = vendorLocation
        ? [vendorLocation.lat, vendorLocation.lng]
        : deliveryLocation
          ? [deliveryLocation.lat, deliveryLocation.lng]
          : [19.076, 72.877];

      const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false }).setView(center, 15);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.attribution({ position: 'bottomleft', prefix: '' }).addTo(map);

      // Standard OpenStreetMap clean street tiles (No API key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        subdomains: 'abc',
      }).addTo(map);

      // -- Vendor / Kitchen Pin — Swiggy Orange Store style -------------------
      if (vendorLocation) {
        const vendorIcon = L.divIcon({
          className: '',
          html: `
            <div style="transform:translate(-50%,-100%);text-align:center;">
              <div style="background:#1A1A1A;color:white;font-size:9px;font-weight:900;padding:3px 9px;border-radius:14px;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,0.3);margin-bottom:5px;border:1px solid rgba(255,255,255,0.15);letter-spacing:0.06em;">🍳 Kitchen</div>
              <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#ff5200,#e04400);border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(255,82,0,0.55);margin:0 auto;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
                  <path d="M7 2v20"/>
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                </svg>
              </div>
            </div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 55],
        });
        L.marker([vendorLocation.lat, vendorLocation.lng], { icon: vendorIcon })
          .addTo(map)
          .bindPopup('<b style="color:#ff5200">🍳 Kitchen Partner</b><br><small>Meal being prepared here</small>');
      }

      // -- Customer Destination — Zomato Green House Pin -----------------------
      if (deliveryLocation) {
        const customerIcon = L.divIcon({
          className: '',
          html: `
            <div style="transform:translate(-50%,-100%);text-align:center;">
              <div style="background:#15803d;color:white;font-size:9px;font-weight:900;padding:3px 9px;border-radius:14px;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,0.2);margin-bottom:5px;border:1px solid rgba(255,255,255,0.2);letter-spacing:0.06em;">🏠 Your Place</div>
              <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#15803d);border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(34,197,94,0.55);margin:0 auto;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
            </div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 55],
        });
        L.marker([deliveryLocation.lat, deliveryLocation.lng], { icon: customerIcon })
          .addTo(map)
          .bindPopup('<b style="color:#15803d">🏠 Delivery Destination</b><br><small>Your meal is heading here!</small>');
      }

      // -- Animated Dashed Orange Route Line -----------------------------------
      if (vendorLocation && deliveryLocation) {
        L.polyline(
          [[vendorLocation.lat, vendorLocation.lng], [deliveryLocation.lat, deliveryLocation.lng]],
          { color: '#ff5200', weight: 4, dashArray: '10 14', opacity: 0.9, lineCap: 'round' }
        ).addTo(map);

        map.fitBounds([
          [vendorLocation.lat, vendorLocation.lng],
          [deliveryLocation.lat, deliveryLocation.lng],
        ], { padding: [60, 60] });
      }

      // -- Rider Pin — Swiggy Blue Scooter with Radar Glow Pulse ---------------
      const riderStart = riderPos || vendorLocation || null;
      if (riderStart) {
        const riderIcon = L.divIcon({
          className: '',
          html: `
            <div style="transform:translate(-50%,-50%);position:relative;">
              <div style="position:absolute;top:-26px;left:50%;transform:translateX(-50%);background:#4f46e5;color:white;font-size:9px;font-weight:900;padding:3px 9px;border-radius:12px;white-space:nowrap;box-shadow:0 4px 12px rgba(79,70,229,0.5);letter-spacing:0.04em;">⚡ On the way!</div>
              <div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#4338ca);border:3.5px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 0 rgba(99,102,241,0.7);animation:swiggyRiderPulse 1.8s ease-in-out infinite;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="18.5" cy="17.5" r="3.5"/>
                  <circle cx="5.5" cy="17.5" r="3.5"/>
                  <circle cx="15" cy="5" r="1"/>
                  <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
                </svg>
              </div>
              <style>@keyframes swiggyRiderPulse{0%{box-shadow:0 0 0 0 rgba(99,102,241,0.75),0 8px 24px rgba(99,102,241,0.5)}70%{box-shadow:0 0 0 14px rgba(99,102,241,0),0 8px 24px rgba(99,102,241,0.4)}100%{box-shadow:0 0 0 0 rgba(99,102,241,0),0 8px 24px rgba(99,102,241,0.4)}}</style>
            </div>`,
          iconSize: [46, 46],
          iconAnchor: [23, 23],
        });
        const riderMarker = L.marker([riderStart.lat, riderStart.lng], { icon: riderIcon })
          .addTo(map)
          .bindPopup('<b style="color:#4f46e5">🛵 Your Rider</b><br><small>En route with your order!</small>');
        riderMarkerRef.current = riderMarker;
      }

      mapRef.current = map;
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[380px] rounded-3xl overflow-hidden shadow-2xl" style={{border:'2px solid #f0f0f0'}}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Swiggy-style ETA pill — top right floating card */}
      {loaded && (
        <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 px-4 py-3 space-y-1 min-w-[160px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">Live GPS</span>
            <span className="ml-auto text-[0.5rem] font-bold text-gray-300">
              {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          {etaMins !== null && (
            <div>
              <span className="text-[0.55rem] text-gray-400 font-bold uppercase tracking-wider block">Arriving in</span>
              <span className="text-2xl font-black text-gray-900 italic tracking-tight leading-none">{etaMins} <span className="text-base font-black text-orange-600">min</span></span>
            </div>
          )}
          {distanceKm !== null && (
            <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
              <span className="text-[0.55rem] text-gray-400 font-bold uppercase">Distance</span>
              <span className="text-xs font-black text-indigo-600 italic">{distanceKm.toFixed(1)} km</span>
            </div>
          )}
        </div>
      )}

      {/* Swiggy-style bottom legend bar */}
      {loaded && (
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-2.5 flex items-center gap-4 border border-gray-100 shadow-xl">
          <span className="flex items-center gap-1.5 text-[0.6rem] font-black text-gray-700 uppercase tracking-widest">
            <span className="w-3 h-3 rounded-full bg-[#ff5200] border-2 border-white shadow-md" /> Kitchen
          </span>
          <span className="flex items-center gap-1.5 text-[0.6rem] font-black text-gray-700 uppercase tracking-widest">
            <span className="w-3 h-3 rounded-full bg-indigo-600 border-2 border-white shadow-md animate-pulse" /> Rider
          </span>
          <span className="flex items-center gap-1.5 text-[0.6rem] font-black text-gray-700 uppercase tracking-widest">
            <span className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-md" /> You
          </span>
        </div>
      )}

      {/* Loading state */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-14 h-14">
              <div className="w-14 h-14 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
              <span className="absolute inset-0 flex items-center justify-center text-lg">🛵</span>
            </div>
            <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">Loading live map…</p>
          </div>
        </div>
      )}
    </div>
  );
}
