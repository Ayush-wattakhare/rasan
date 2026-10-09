'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Navigation, 
  Wifi, 
  WifiOff, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  Play,
  Square,
  FastForward,
  RotateCcw,
  Compass,
  ArrowRight
} from 'lucide-react';

interface LatLng {
  lat: number;
  lng: number;
}

interface LocationTrackerProps {
  deliveryPartnerId: string;
  isActive: boolean;
  activeOrder?: any;
}

type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'prompt';

interface GpsFix {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  timestamp: number;
}

// -- Kalman-like smoothing: weighted average of last N fixes ------------------
const MAX_FIXES = 5;
const ACCURACY_CUTOFF = 80;
const STALE_THRESHOLD = 8000;

function smoothFix(history: GpsFix[], newFix: GpsFix): GpsFix {
  if (history.length === 0) return newFix;
  const all = [...history, newFix];
  const totalWeight = all.reduce((s, f) => s + 1 / f.accuracy, 0);
  const lat = all.reduce((s, f) => s + f.lat * (1 / f.accuracy), 0) / totalWeight;
  const lng = all.reduce((s, f) => s + f.lng * (1 / f.accuracy), 0) / totalWeight;
  return { ...newFix, lat, lng };
}

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

export default function LocationTracker({ deliveryPartnerId, isActive, activeOrder }: LocationTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionStatus>('unknown');
  const [currentFix, setCurrentFix] = useState<GpsFix | null>(null);
  const fixHistory = useRef<GpsFix[]>([]);
  const watchIdRef = useRef<number | null>(null);

  // -- Simulation State --------------------------------------------------------
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0); // 0 to 100%
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Determine origin (vendor) and destination (customer)
  const originCoords: LatLng = { lat: 18.6279, lng: 73.8009 };
  const destCoords: LatLng = (() => {
    const addr = activeOrder?.delivery_address;
    if (addr?.coordinates?.lat && addr?.coordinates?.lng) {
      return { lat: addr.coordinates.lat, lng: addr.coordinates.lng };
    }
    if (addr?.lat && addr?.lng) return { lat: addr.lat, lng: addr.lng };
    return { lat: 18.6429, lng: 73.8129 }; // ~2km away in Pune
  })();

  const pushLocationToServer = useCallback(async (lat: number, lng: number, accuracy: number = 10) => {
    try {
      await Promise.allSettled([
        fetch(`/api/delivery/update-location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deliveryPartnerId, latitude: lat, longitude: lng }),
        }),
        fetch(`/api/delivery-partners/${deliveryPartnerId}/location`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng }),
        }),
      ]);
      setLastUpdate(new Date());
    } catch (err) {
      console.warn('Location broadcast warning:', err);
    }
  }, [deliveryPartnerId]);

  // -- Check permission status on mount ----------------------------------------
  useEffect(() => {
    if (!('permissions' in navigator)) return;
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        setPermission(status.state as PermissionStatus);
        status.onchange = () => setPermission(status.state as PermissionStatus);
      })
      .catch(() => setPermission('unknown'));
  }, []);

  // -- Core Hardware GPS tracking logic ----------------------------------------
  useEffect(() => {
    if (!isActive || !isTracking || isSimulating) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported on this device.');
      return;
    }

    const onSuccess = async (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed } = pos.coords;
      const age = Date.now() - pos.timestamp;

      if (age > STALE_THRESHOLD) return;

      const newFix: GpsFix = { lat: latitude, lng: longitude, accuracy, speed, timestamp: pos.timestamp };

      const bestAccuracy = fixHistory.current.length > 0
        ? Math.min(...fixHistory.current.map(f => f.accuracy))
        : Infinity;
      if (accuracy > ACCURACY_CUTOFF && bestAccuracy < ACCURACY_CUTOFF) return;

      const smoothed = smoothFix(fixHistory.current, newFix);
      fixHistory.current = [...fixHistory.current, newFix].slice(-MAX_FIXES);
      setCurrentFix(smoothed);
      setPermission('granted');
      setError(null);

      await pushLocationToServer(smoothed.lat, smoothed.lng, smoothed.accuracy);
    };

    const onError = (err: GeolocationPositionError) => {
      if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
        setPermission('denied');
        setError('Location permission denied. Use GPS Simulation mode below.');
      } else if (err.code === GeolocationPositionError.TIMEOUT) {
        setError('GPS signal timeout. Moving to an open area may help.');
      } else {
        setError('Could not determine location. Retrying…');
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 2000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [deliveryPartnerId, isActive, isTracking, isSimulating, pushLocationToServer]);

  // -- GPS Route Simulation Loop ------------------------------------------------
  useEffect(() => {
    if (!isSimulating) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      return;
    }

    simTimerRef.current = setInterval(() => {
      setSimProgress((prev) => {
        const next = prev >= 100 ? 0 : Math.min(100, prev + 5);
        const ratio = next / 100;
        const currentLat = originCoords.lat + (destCoords.lat - originCoords.lat) * ratio;
        const currentLng = originCoords.lng + (destCoords.lng - originCoords.lng) * ratio;

        setCurrentFix({
          lat: currentLat,
          lng: currentLng,
          accuracy: 5,
          speed: 24 / 3.6, // ~24 km/h
          timestamp: Date.now(),
        });

        pushLocationToServer(currentLat, currentLng, 5);
        return next;
      });
    }, 3000);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulating, originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng, pushLocationToServer]);

  const toggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
    } else {
      setIsTracking(false);
      setIsSimulating(true);
      // Immediately broadcast initial origin
      const ratio = simProgress / 100;
      const currentLat = originCoords.lat + (destCoords.lat - originCoords.lat) * ratio;
      const currentLng = originCoords.lng + (destCoords.lng - originCoords.lng) * ratio;
      pushLocationToServer(currentLat, currentLng, 5);
    }
  };

  const jumpSimStep = (targetPercent: number) => {
    const ratio = targetPercent / 100;
    const currentLat = originCoords.lat + (destCoords.lat - originCoords.lat) * ratio;
    const currentLng = originCoords.lng + (destCoords.lng - originCoords.lng) * ratio;
    setSimProgress(targetPercent);
    setCurrentFix({
      lat: currentLat,
      lng: currentLng,
      accuracy: 5,
      speed: 28 / 3.6,
      timestamp: Date.now(),
    });
    pushLocationToServer(currentLat, currentLng, 5);
  };

  const currentDistanceKm = currentFix
    ? haversineDistance(currentFix, destCoords).toFixed(1)
    : haversineDistance(originCoords, destCoords).toFixed(1);

  return (
    <div className="bg-[#141414] border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            isSimulating ? 'bg-orange-500/20 text-orange-400' : isTracking ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'
          }`}>
            <Navigation className={`w-5 h-5 ${isSimulating || isTracking ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Live GPS & Route Engine</h3>
              {isSimulating && (
                <span className="bg-orange-500/20 text-orange-400 text-[0.55rem] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-orange-500/30">
                  Simulation Mode
                </span>
              )}
            </div>
            <p className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {isSimulating ? 'Simulating en-route movement to customer' : isTracking ? 'Broadcasting live device GPS' : 'Offline / Standby'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Real GPS Toggle */}
          <Button
            onClick={() => {
              setIsSimulating(false);
              setIsTracking(!isTracking);
            }}
            disabled={!isActive}
            size="sm"
            className={`h-8 px-3 rounded-xl font-black uppercase tracking-widest text-[0.6rem] cursor-pointer ${
              isTracking
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-white/10 hover:bg-white/15 text-gray-300'
            }`}
          >
            {isTracking ? <WifiOff className="w-3 h-3 mr-1" /> : <Wifi className="w-3 h-3 mr-1" />}
            {isTracking ? 'Stop GPS' : 'Device GPS'}
          </Button>

          {/* Simulation Toggle */}
          <Button
            onClick={toggleSimulation}
            disabled={!isActive}
            size="sm"
            className={`h-8 px-3 rounded-xl font-black uppercase tracking-widest text-[0.6rem] cursor-pointer ${
              isSimulating
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30'
            }`}
          >
            {isSimulating ? <Square className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
            {isSimulating ? 'Stop Sim' : 'Simulate Route'}
          </Button>
        </div>
      </div>

      {/* Simulation Controller Panel */}
      {isSimulating && (
        <div className="bg-orange-950/20 border border-orange-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-[0.65rem] font-black uppercase tracking-wider text-orange-200">
            <span>Route Completion</span>
            <span>{simProgress}% ({currentDistanceKm} km left)</span>
          </div>

          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-orange-500 to-amber-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${simProgress}%` }}
            />
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={() => jumpSimStep(0)}
              className="flex-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[0.6rem] font-black uppercase tracking-wider text-gray-300 transition cursor-pointer"
            >
              Kitchen (0%)
            </button>
            <button
              onClick={() => jumpSimStep(50)}
              className="flex-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[0.6rem] font-black uppercase tracking-wider text-gray-300 transition cursor-pointer"
            >
              Midway (50%)
            </button>
            <button
              onClick={() => jumpSimStep(90)}
              className="flex-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[0.6rem] font-black uppercase tracking-wider text-gray-300 transition cursor-pointer"
            >
              Near Door (90%)
            </button>
            <button
              onClick={() => jumpSimStep(100)}
              className="flex-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[0.6rem] font-black uppercase tracking-wider text-gray-300 transition cursor-pointer"
            >
              Arrived (100%)
            </button>
          </div>
        </div>
      )}

      {/* Telemetry info */}
      {(isTracking || isSimulating) && currentFix && (
        <div className="grid grid-cols-3 gap-2 bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
          <div>
            <p className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">Speed</p>
            <p className="text-sm font-black text-white mt-0.5">
              {Math.round((currentFix.speed || 5.5) * 3.6)} <span className="text-[0.6rem] text-gray-400">km/h</span>
            </p>
          </div>
          <div>
            <p className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">Est. ETA</p>
            <p className="text-sm font-black text-orange-400 mt-0.5">
              ~{Math.max(1, Math.round(parseFloat(currentDistanceKm) * 3))} <span className="text-[0.6rem] text-orange-300">mins</span>
            </p>
          </div>
          <div>
            <p className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">Sync</p>
            <p className="text-sm font-black text-green-400 mt-0.5">
              {lastUpdate ? lastUpdate.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }) : 'Live'}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-red-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p className="text-[0.65rem] font-medium leading-relaxed">{error}</p>
        </div>
      )}
    </div>
  );
}
