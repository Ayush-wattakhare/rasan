'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  Maximize2, 
  RefreshCw, 
  Navigation, 
  Store, 
  MapPin, 
  Zap, 
  Layers, 
  ShieldCheck, 
  Phone, 
  ChevronRight,
  Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/lib/hooks/use-toast';

interface TacticalNode {
  id: string;
  type: 'rider' | 'vendor' | 'customer';
  name: string;
  lat: number;
  lng: number;
  status: string;
  orderId?: string;
  eta?: string;
}

const SAMPLE_NODES: TacticalNode[] = [
  { id: 'R1', type: 'rider', name: 'Rider Rahul K.', lat: 18.5985, lng: 73.7915, status: 'Out for Delivery (Order #RD829)', orderId: 'RD829', eta: '8m' },
  { id: 'R2', type: 'rider', name: 'Rider Amit S.', lat: 18.5912, lng: 73.8050, status: 'Picked Up (Order #RD830)', orderId: 'RD830', eta: '14m' },
  { id: 'R3', type: 'rider', name: 'Rider Vikram D.', lat: 18.6040, lng: 73.7820, status: 'En Route to Kitchen', orderId: 'RD831', eta: '5m' },
  { id: 'V1', type: 'vendor', name: "Mama's Kitchen", lat: 18.5940, lng: 73.7990, status: '3 Orders in Prep' },
  { id: 'V2', type: 'vendor', name: "Annapurna Rasoi", lat: 18.6060, lng: 73.7890, status: '5 Orders in Prep' },
  { id: 'C1', type: 'customer', name: 'Delivery Destination (Rahatani)', lat: 18.6010, lng: 73.7860, status: 'Awaiting Delivery' },
  { id: 'C2', type: 'customer', name: 'Delivery Destination (Pimple Saudagar)', lat: 18.5890, lng: 73.8010, status: 'Awaiting Delivery' },
];

export default function AdminTacticalMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const riderMarkersRef = useRef<any[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const [activeCity, setActiveCity] = useState<'Pune' | 'Mumbai' | 'Bengaluru'>('Pune');
  const [selectedNode, setSelectedNode] = useState<TacticalNode | null>(SAMPLE_NODES[0]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'street' | 'dark'>('street');
  const { toast } = useToast();

  const cityCoords = {
    Pune: { lat: 18.5960, lng: 73.7930, zoom: 14, label: 'PUNE_METRO_NODE' },
    Mumbai: { lat: 19.0760, lng: 72.8777, zoom: 13, label: 'MUMBAI_CENTRAL_NODE' },
    Bengaluru: { lat: 12.9716, lng: 77.5946, zoom: 13, label: 'BENGALURU_TECH_NODE' },
  };

  // Initialize Leaflet Map with Swiggy/Zomato style CartoDB Voyager tiles
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css' as any);

      if (cancelled || !containerRef.current) return;

      const currentCity = cityCoords[activeCity];
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([currentCity.lat, currentCity.lng], currentCity.zoom);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Tile layer: CartoDB Voyager (ultra-clean, warm modern delivery style)
      const tileUrl = viewMode === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Vendor Icon (Swiggy / Zomato style Orange Store Pin)
      const createVendorIcon = (name: string) => L.divIcon({
        className: '',
        html: `
          <div class="group relative cursor-pointer" style="transform:translate(-50%, -100%);">
            <div style="background:#1A1A1A;color:white;font-size:10px;font-weight:900;padding:2px 8px;border-radius:12px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.3);margin-bottom:4px;border:1px solid rgba(255,255,255,0.2);">
              🍳 ${name}
            </div>
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#ff5200,#e04400);border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(255,82,0,0.5);margin:0 auto;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
                <path d="M7 2v20"/>
                <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      // Customer Destination Icon (Green House Pin)
      const createCustomerIcon = () => L.divIcon({
        className: '',
        html: `
          <div style="transform:translate(-50%, -100%);">
            <div style="background:#15803d;color:white;font-size:9px;font-weight:900;padding:2px 6px;border-radius:10px;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,0.2);margin-bottom:4px;border:1px solid rgba(255,255,255,0.3);">
              🏠 Destination
            </div>
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#16a34a);border:2.5px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(34,197,94,0.5);margin:0 auto;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      // Rider Marker (Swiggy 3D Moving Scooter with Radar Pulse)
      const createRiderIcon = (name: string, eta: string) => L.divIcon({
        className: '',
        html: `
          <div style="transform:translate(-50%, -50%);position:relative;">
            <div style="position:absolute;top:-28px;left:50%;transform:translateX(-50%);background:#4f46e5;color:white;font-size:9px;font-weight:900;padding:2px 8px;border-radius:12px;white-space:nowrap;box-shadow:0 4px 12px rgba(79,70,229,0.4);border:1px solid rgba(255,255,255,0.3);display:flex;align-items:center;gap:4px;">
              ⚡ ${eta}
            </div>
            <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#4338ca);border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(99,102,241,0.6);animation:swiggyRadar 2s ease-in-out infinite;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18.5" cy="17.5" r="3.5"/>
                <circle cx="5.5" cy="17.5" r="3.5"/>
                <circle cx="15" cy="5" r="1"/>
                <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
              </svg>
            </div>
            <style>
              @keyframes swiggyRadar {
                0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.7), 0 8px 24px rgba(99,102,241,0.5); }
                70% { box-shadow: 0 0 0 14px rgba(99,102,241,0), 0 8px 24px rgba(99,102,241,0.5); }
                100% { box-shadow: 0 0 0 0 rgba(99,102,241,0), 0 8px 24px rgba(99,102,241,0.5); }
              }
            </style>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      // Add Connecting Route Polylines (Swiggy animated dashed gradient line)
      const route1 = [
        [18.5940, 73.7990],
        [18.5960, 73.7950],
        [18.5985, 73.7915],
        [18.6010, 73.7860]
      ] as [number, number][];

      L.polyline(route1, {
        color: '#ff5200',
        weight: 4,
        dashArray: '8 12',
        opacity: 0.85,
        lineCap: 'round',
      }).addTo(map);

      // Add Tactical Nodes
      SAMPLE_NODES.forEach((node) => {
        let icon;
        if (node.type === 'vendor') {
          icon = createVendorIcon(node.name);
        } else if (node.type === 'customer') {
          icon = createCustomerIcon();
        } else {
          icon = createRiderIcon(node.name, node.eta || '10m');
        }

        const marker = L.marker([node.lat, node.lng], { icon })
          .addTo(map)
          .on('click', () => {
            setSelectedNode(node);
          });

        if (node.type === 'rider') {
          riderMarkersRef.current.push({ marker, node, baseLat: node.lat, baseLng: node.lng });
        }
      });

      mapRef.current = map;
      setMapLoaded(true);

      // Smooth simulated rider micro-movement animation (Swiggy/Zomato style continuous drift)
      let t = 0;
      const animateRiders = () => {
        t += 0.02;
        riderMarkersRef.current.forEach((item, index) => {
          const deltaLat = Math.sin(t + index * 1.5) * 0.0012;
          const deltaLng = Math.cos(t + index * 1.5) * 0.0012;
          const newPos = [item.baseLat + deltaLat, item.baseLng + deltaLng] as [number, number];
          item.marker.setLatLng(newPos);
        });
        animFrameRef.current = requestAnimationFrame(animateRiders);
      };

      animateRiders();
    })();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [viewMode]);

  // Handle City Change
  const handleCitySelect = (city: 'Pune' | 'Mumbai' | 'Bengaluru') => {
    setActiveCity(city);
    if (mapRef.current) {
      const target = cityCoords[city];
      mapRef.current.flyTo([target.lat, target.lng], target.zoom, { duration: 1.5 });
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    toast({
      title: 'Telemetry Sync Initiated',
      description: 'Synchronizing live GPS telemetry from all registered delivery riders.',
    });

    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: 'Telemetry Synced ⚡',
        description: '3 active sorties connected with sub-50ms latency.',
      });
    }, 1200);
  };

  return (
    <div className="relative w-full h-[380px] rounded-[2.5rem] overflow-hidden border-2 border-white shadow-2xl bg-[#1A1A1A]">
      <div ref={containerRef} className="w-full h-full" />

      {/* Top Left City & Node Selector Bar */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-xl border border-gray-100">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
          <span className="text-[0.65rem] font-black text-gray-900 uppercase tracking-widest italic">
            {cityCoords[activeCity].label}
          </span>
        </div>

        <div className="flex bg-black/75 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-xl">
          {(['Pune', 'Mumbai', 'Bengaluru'] as const).map((city) => (
            <button
              key={city}
              onClick={() => handleCitySelect(city)}
              className={`px-3 py-1 rounded-xl text-[0.6rem] font-black uppercase tracking-wider transition-all ${
                activeCity === city
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Top Right Live Telemetry Quick Badge */}
      <div className="absolute top-4 right-4 z-[400] hidden sm:flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-2xl text-white shadow-xl">
        <Compass className="w-3.5 h-3.5 text-orange-500 animate-spin" />
        <span className="text-[0.6rem] font-black uppercase tracking-widest text-gray-200">
          3 Active Sorties • 2 Kitchens Live
        </span>
      </div>

      {/* Bottom Left Selected Node Floating Inspection Card */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-xl rounded-2xl p-3.5 shadow-2xl border border-gray-100 max-w-[280px] animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${selectedNode.type === 'rider' ? 'bg-indigo-600 animate-pulse' : selectedNode.type === 'vendor' ? 'bg-orange-500' : 'bg-green-500'}`} />
                <span className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">
                  {selectedNode.type.toUpperCase()}
                </span>
              </div>
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-tight mt-0.5">
                {selectedNode.name}
              </h4>
              <p className="text-[0.65rem] font-bold text-orange-600 tracking-wide mt-0.5">
                {selectedNode.status}
              </p>
            </div>
            {selectedNode.eta && (
              <Badge className="bg-indigo-600 text-white text-[0.55rem] font-black uppercase">
                ETA {selectedNode.eta}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Bottom Right Tactical Map Controls */}
      <div className="absolute bottom-4 right-4 z-[400] flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setViewMode(viewMode === 'street' ? 'dark' : 'street')}
          className="bg-white/90 backdrop-blur-md border-gray-200 text-gray-900 font-black uppercase tracking-wider text-[0.55rem] h-9 rounded-xl shadow-lg hover:bg-white"
        >
          <Layers className="w-3.5 h-3.5 mr-1 text-orange-600" />
          {viewMode === 'street' ? 'Dark Sat' : 'Street'}
        </Button>

        <Button
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-[0.55rem] h-9 rounded-xl px-4 shadow-xl active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync GPS'}
        </Button>
      </div>
    </div>
  );
}
