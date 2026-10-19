'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  CheckCircle2,
  X,
  Sparkles,
  Loader2,
  Building,
  Compass,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  reverseGeocode,
  searchLocations,
  hasResolvedAddress,
  getAccurateLocation,
  setStoredDeliveryLocation,
  getStoredDeliveryLocation,
  AccurateLocationResult,
  LocationDetails,
  LocationSearchResult,
} from '@/lib/hooks/use-location';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation?: (location: AccurateLocationResult) => void;
}

/** Whole-India view used only while we wait for the real position. Nothing is selected here. */
const DEFAULT_VIEW = { lat: 22.5, lng: 79, zoom: 5 };

/** Above this, the fix is likely Wi-Fi/IP based: ask the user to fine-tune the pin. */
const LOW_ACCURACY_METERS = 100;

type Point = { lat: number; lng: number };
type PointSource = 'stored' | 'gps' | 'map' | 'search';

// The pin tip sits exactly at the bottom-centre of the icon box, so `iconAnchor`
// (and nothing else) decides where the coordinate is. No CSS transforms here:
// combining a transform with iconAnchor shifts the pin off the real spot.
const PIN_WIDTH = 120;
const PIN_HEIGHT = 68;
const PIN_HTML = `
  <div style="width:${PIN_WIDTH}px;height:${PIN_HEIGHT}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;cursor:grab;">
    <div style="background:#ea580c;color:white;font-size:10px;font-weight:900;padding:3px 10px;border-radius:12px;white-space:nowrap;box-shadow:0 6px 20px rgba(234,88,12,0.4);margin-bottom:2px;text-transform:uppercase;letter-spacing:0.08em;border:2px solid white;">
      📍 Deliver Here
    </div>
    <svg width="38" height="40" viewBox="0 0 24 26" style="display:block;filter:drop-shadow(0 4px 6px rgba(234,88,12,0.5));">
      <path d="M12 26s-9-8.2-9-15a9 9 0 0 1 18 0c0 6.8-9 15-9 15Z" fill="#ea580c" stroke="white" stroke-width="1.6"/>
      <circle cx="12" cy="11" r="3.4" fill="white"/>
    </svg>
  </div>`;

export function LocationSelectorModal({
  isOpen,
  onClose,
  onSelectLocation,
}: LocationSelectorModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const gpsRunRef = useRef(0);

  const [point, setPoint] = useState<Point | null>(null);
  const [pointSource, setPointSource] = useState<PointSource | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationDetails, setLocationDetails] = useState<LocationDetails>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchedOnce, setSearchedOnce] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [geocodeFailed, setGeocodeFailed] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Latest pin, read by the search debouncer to bias results without re-running it.
  const pointRef = useRef<Point | null>(null);
  useEffect(() => {
    pointRef.current = point;
  }, [point]);

  // ── Map helpers (all imperative, work from any callback without stale state) ──

  const drawAccuracy = useCallback((p: Point, meters: number | null) => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }
    if (meters && meters > 0) {
      accuracyCircleRef.current = L.circle([p.lat, p.lng], {
        radius: meters,
        color: '#2563eb',
        weight: 1,
        fillColor: '#3b82f6',
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(map);
    }
  }, []);

  const lookupAddress = useCallback(async (p: Point, fallback?: LocationDetails) => {
    geocodeAbortRef.current?.abort();
    const controller = new AbortController();
    geocodeAbortRef.current = controller;
    setIsReverseGeocoding(true);
    setGeocodeFailed(false);
    try {
      const details = await reverseGeocode(p.lat, p.lng, controller.signal);
      if (!controller.signal.aborted) {
        const resolved = hasResolvedAddress(details);
        // Keep a search result's name if the lookup came back empty.
        setLocationDetails(resolved ? { ...fallback, ...stripEmpty(details) } : { ...stripEmpty(details), ...fallback });
        setGeocodeFailed(!resolved && !hasResolvedAddress(fallback));
      }
    } catch {
      // Aborted by a newer lookup.
    } finally {
      if (geocodeAbortRef.current === controller) setIsReverseGeocoding(false);
    }
  }, []);

  /** Single entry point for moving the selection: updates marker, map and address. */
  const selectPoint = useCallback(
    (
      p: Point,
      source: PointSource,
      opts?: { accuracy?: number | null; zoom?: number; details?: LocationDetails; skipGeocode?: boolean; fly?: boolean }
    ) => {
      const L = leafletRef.current;
      const map = mapInstanceRef.current;

      setPoint(p);
      setPointSource(source);
      setAccuracy(opts?.accuracy ?? null);

      if (L && map) {
        if (!markerRef.current) {
          const icon = L.divIcon({
            className: 'rasan-delivery-pin',
            html: PIN_HTML,
            iconSize: [PIN_WIDTH, PIN_HEIGHT],
            iconAnchor: [PIN_WIDTH / 2, PIN_HEIGHT],
          });
          const marker = L.marker([p.lat, p.lng], {
            icon,
            draggable: true,
            keyboard: true,
            title: 'Delivery location. Drag to adjust.',
            autoPan: true,
          }).addTo(map);
          marker.on('dragend', () => {
            const ll = marker.getLatLng();
            selectPointRef.current({ lat: ll.lat, lng: ll.lng }, 'map');
          });
          markerRef.current = marker;
        } else {
          markerRef.current.setLatLng([p.lat, p.lng]);
        }
        drawAccuracy(p, opts?.accuracy ?? null);

        const zoom = opts?.zoom ?? Math.max(map.getZoom(), 17);
        if (opts?.fly === false) map.setView([p.lat, p.lng], zoom);
        else map.flyTo([p.lat, p.lng], zoom, { duration: 0.8 });
      }

      if (opts?.details) setLocationDetails(opts.details);
      if (opts?.skipGeocode) setGeocodeFailed(false);
      else lookupAddress(p, opts?.details);
    },
    [drawAccuracy, lookupAddress]
  );

  // Event handlers registered once on the map need the latest selectPoint.
  const selectPointRef = useRef(selectPoint);
  useEffect(() => {
    selectPointRef.current = selectPoint;
  }, [selectPoint]);

  // ── Live GPS ──
  const handleUseCurrentGPS = useCallback(async () => {
    const run = ++gpsRunRef.current;
    setIsLocating(true);
    setGpsError(null);
    try {
      const result = await getAccurateLocation({
        persist: false,
        // Move the pin as the fix improves so the user sees it converge.
        onProgress: (pos) => {
          if (run !== gpsRunRef.current) return;
          selectPointRef.current(
            { lat: pos.coords.latitude, lng: pos.coords.longitude },
            'gps',
            { accuracy: pos.coords.accuracy, skipGeocode: true, zoom: 17 }
          );
        },
      });
      if (run !== gpsRunRef.current) return;
      selectPointRef.current({ lat: result.lat, lng: result.lng }, 'gps', {
        accuracy: result.accuracy,
        details: result.details,
        // If the address lookup inside getAccurateLocation failed, try once more.
        skipGeocode: hasResolvedAddress(result.details),
        zoom: 17,
      });
    } catch (err: any) {
      if (run === gpsRunRef.current) setGpsError(err?.message || 'Could not detect your current location.');
    } finally {
      if (run === gpsRunRef.current) setIsLocating(false);
    }
  }, []);

  // ── Map lifecycle ──
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;
    let isCancelled = false;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css' as any);
      if (isCancelled || !mapContainerRef.current) return;

      leafletRef.current = L;
      const map = L.map(mapContainerRef.current, {
        center: [DEFAULT_VIEW.lat, DEFAULT_VIEW.lng],
        zoom: DEFAULT_VIEW.zoom,
        zoomControl: false,
      });
      mapInstanceRef.current = map;

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        subdomains: 'abc',
      }).addTo(map);

      map.on('click', (e: any) => {
        selectPointRef.current({ lat: e.latlng.lat, lng: e.latlng.lng }, 'map');
      });

      // The modal animates in; recompute size so tiles and the pin line up.
      setTimeout(() => map.invalidateSize(), 250);

      // Initial position: previously confirmed location, otherwise live GPS.
      const stored = getStoredDeliveryLocation();
      if (stored && Number.isFinite(stored.lat) && Number.isFinite(stored.lng)) {
        selectPointRef.current({ lat: stored.lat, lng: stored.lng }, 'stored', {
          details: stored.details || {},
          // Older saves may hold only coordinates (lookup had failed): resolve them now.
          skipGeocode: hasResolvedAddress(stored.details),
          zoom: 17,
          fly: false,
        });
      } else {
        let denied = false;
        try {
          const status = await navigator.permissions?.query({ name: 'geolocation' as PermissionName });
          denied = status?.state === 'denied';
        } catch {
          // Permissions API not available (e.g. older Safari) — just try.
        }
        if (isCancelled) return;
        if (denied) {
          setGpsError(
            'Location permission is blocked. Allow location access in your browser, or search / tap the map to set your address.'
          );
        } else {
          handleUseCurrentGPS();
        }
      }
    };

    // Reset per-open state.
    setPoint(null);
    setPointSource(null);
    setAccuracy(null);
    setLocationDetails({});
    setGeocodeFailed(false);
    setGpsError(null);
    setSearchQuery('');
    initMap();

    return () => {
      isCancelled = true;
      gpsRunRef.current++; // invalidate any in-flight GPS run
      geocodeAbortRef.current?.abort();
      setIsLocating(false);
      markerRef.current = null;
      accuracyCircleRef.current = null;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, handleUseCurrentGPS]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Search input debouncer
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchedOnce(false);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Rank places near the current pin first (e.g. Nagpur areas when pinned in Nagpur).
        const results = await searchLocations(searchQuery, pointRef.current, controller.signal);
        if (controller.signal.aborted) return;
        setSearchResults(results);
        setShowSearchResults(true);
        setSearchedOnce(true);
      } catch {
        // Aborted by a newer keystroke.
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const handleSelectPlace = (place: LocationSearchResult) => {
    gpsRunRef.current++; // a manual choice wins over a GPS fix still arriving
    setIsLocating(false);
    setShowSearchResults(false);
    setSearchQuery('');
    // Reverse-geocode so street / city / pincode are real, not guessed.
    selectPoint({ lat: place.lat, lng: place.lng }, 'search', {
      zoom: 16,
      details: stripEmpty({
        locality: place.locality,
        city: place.city,
        full_address: place.display_name || place.locality,
      }),
    });
  };

  const handleRetryLookup = () => {
    if (point) lookupAddress(point);
  };

  const handleConfirmLocation = () => {
    if (!point) return;
    const finalResult: AccurateLocationResult = {
      lat: point.lat,
      lng: point.lng,
      // Once the user drags/taps the pin, the point is exactly what they chose.
      accuracy: pointSource === 'gps' && accuracy ? accuracy : 0,
      details: locationDetails,
    };

    setStoredDeliveryLocation(finalResult);
    onSelectLocation?.(finalResult);
    onClose();
  };

  if (!isOpen) return null;

  const lowAccuracy = pointSource === 'gps' && accuracy !== null && accuracy > LOW_ACCURACY_METERS;
  const placeName = locationDetails.locality || locationDetails.street || locationDetails.city;
  const title =
    placeName && locationDetails.city && locationDetails.city !== placeName
      ? `${placeName}, ${locationDetails.city}`
      : placeName ||
        (!point
          ? 'Finding your location…'
          : isReverseGeocoding
            ? 'Looking up address…'
            : 'Selected location');
  const subtitle =
    locationDetails.full_address || (point ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : 'Allow location access, search, or tap the map');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300">
        {/* Header Bar */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[0.55rem] sm:text-[0.6rem] font-black text-orange-600 uppercase tracking-[0.2em] sm:tracking-[0.25em] flex items-center gap-1 sm:gap-1.5">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Select Delivery Location
              </span>
              <h2 id="location-modal-title" className="text-sm sm:text-xl font-black text-gray-900 tracking-tight">
                Pin Your Exact Address on Map
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close location selector"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Search & Quick Selection */}
          <div className="w-full md:w-80 p-3 sm:p-5 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col gap-2.5 sm:gap-4 bg-gray-50/50 overflow-y-auto shrink-0 max-h-[35vh] md:max-h-none">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area, society, landmark..."
                aria-label="Search for an area or address"
                className="w-full h-12 bg-white rounded-xl pl-10 pr-10 text-sm font-medium border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-colors"
              />
              {isSearching && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-600 animate-spin" />
              )}

              {showSearchResults && searchedOnce && searchResults.length === 0 && !isSearching && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50 text-xs text-gray-600">
                  No places found. Try a nearby landmark or area name, or tap the map.
                </div>
              )}

              {showSearchResults && searchResults.length > 0 && (
                <div
                  role="listbox"
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 max-h-60 overflow-y-auto"
                >
                  {searchResults.map((result, idx) => (
                    <button
                      key={`${result.lat},${result.lng},${idx}`}
                      role="option"
                      aria-selected={false}
                      onClick={() => handleSelectPlace(result)}
                      className="w-full text-left p-2.5 hover:bg-orange-50/70 focus:bg-orange-50/70 rounded-xl transition-colors flex items-start gap-2.5 group"
                    >
                      <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-orange-600 truncate">{result.locality}</p>
                        <p className="text-[0.65rem] text-gray-500 line-clamp-1">{result.display_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleUseCurrentGPS}
              disabled={isLocating}
              variant="outline"
              className="w-full h-12 rounded-xl bg-white border-orange-200 hover:bg-orange-50 text-orange-700 font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
              ) : (
                <Compass className="w-4 h-4 text-orange-600" />
              )}
              {isLocating
                ? accuracy
                  ? `Improving accuracy… ±${Math.round(accuracy)} m`
                  : 'Detecting live location…'
                : 'Use My Current Location'}
            </Button>

            {gpsError && (
              <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-100 text-[0.7rem] text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{gpsError}</span>
              </div>
            )}

            <div className="mt-auto hidden md:flex p-3.5 rounded-2xl bg-orange-50/70 border border-orange-100/80 text-[0.7rem] text-orange-950 items-start gap-2.5">
              <span className="text-base" aria-hidden="true">💡</span>
              <p className="leading-tight">
                <strong>Tip:</strong> Drag the orange pin or tap anywhere on the map to pinpoint your building entrance.
              </p>
            </div>
          </div>

          {/* Right Column: Map & Selection Summary */}
          <div className="flex-1 flex flex-col relative min-h-[220px] sm:min-h-[320px] md:min-h-[420px]">
            <div className="flex-1 w-full h-full relative" style={{ minHeight: '300px' }}>
              <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" aria-label="Map. Tap to place the delivery pin." />

              <button
                onClick={handleUseCurrentGPS}
                aria-label="Centre map on my current location"
                title="Centre on my location"
                className="absolute top-4 right-4 z-[500] w-11 h-11 bg-white hover:bg-gray-50 text-gray-800 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center transition-all hover:scale-105"
              >
                {isLocating ? (
                  <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
                ) : (
                  <Navigation className="w-5 h-5 text-orange-600" />
                )}
              </button>

              {lowAccuracy && (
                <div className="absolute top-4 left-4 right-20 z-[500] p-2.5 rounded-xl bg-amber-50/95 border border-amber-200 text-[0.7rem] text-amber-900 shadow flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Location is approximate (±{Math.round(accuracy!)} m). Drag the pin to your exact building.
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 sm:p-5 bg-white border-t border-gray-100 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 z-10 pb-safe">
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0" aria-live="polite">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.65rem] sm:text-xs font-black text-orange-600 uppercase tracking-widest">Selected Delivery Area</span>
                    {(isReverseGeocoding || isLocating) && <Loader2 className="w-3 h-3 text-orange-500 animate-spin" />}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight truncate">{title}</h3>
                  <p className="text-[0.65rem] sm:text-xs text-gray-500 line-clamp-1">{subtitle}</p>
                  {geocodeFailed && point && !isReverseGeocoding && (
                    <p className="text-[0.65rem] sm:text-xs text-amber-700 mt-0.5">
                      Couldn&apos;t fetch the address name. The pin is still exact.{' '}
                      <button
                        type="button"
                        onClick={handleRetryLookup}
                        className="font-bold underline underline-offset-2 hover:text-amber-900"
                      >
                        Retry
                      </button>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 sm:flex-initial rounded-xl h-10 sm:h-12 px-4 sm:px-5 font-bold text-xs uppercase tracking-wider"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmLocation}
                  disabled={!point || isReverseGeocoding}
                  className="flex-2 sm:flex-initial bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-xl h-10 sm:h-12 px-5 sm:px-6 shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm Location
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function stripEmpty(details: LocationDetails): LocationDetails {
  return Object.fromEntries(
    Object.entries(details).filter(([, v]) => typeof v === 'string' && v.trim() !== '')
  ) as LocationDetails;
}
