'use client';

import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  reverseGeocode,
  searchLocations,
  getAccurateLocation,
  setStoredDeliveryLocation,
  getStoredDeliveryLocation,
  AccurateLocationResult,
  LocationDetails,
} from '@/lib/hooks/use-location';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation?: (location: AccurateLocationResult) => void;
}

// Popular localities in and around Pimpri-Chinchwad / Pune for instant one-tap selection
const POPULAR_LOCALITIES = [
  { name: 'Pimpri', locality: 'Pimpri', lat: 18.6279, lng: 73.8009, label: 'Pimpri (PCMC)' },
  { name: 'Chinchwad', locality: 'Chinchwad', lat: 18.6298, lng: 73.7840, label: 'Chinchwad' },
  { name: 'Rahatani', locality: 'Rahatani', lat: 18.6010, lng: 73.7860, label: 'Rahatani' },
  { name: 'Wakad', locality: 'Wakad', lat: 18.5987, lng: 73.7667, label: 'Wakad' },
  { name: 'Hinjawadi', locality: 'Hinjawadi', lat: 18.5913, lng: 73.7389, label: 'Hinjawadi (Phase 1-3)' },
  { name: 'Baner', locality: 'Baner', lat: 18.5590, lng: 73.7868, label: 'Baner' },
  { name: 'Aundh', locality: 'Aundh', lat: 18.5602, lng: 73.8031, label: 'Aundh' },
  { name: 'Nigdi', locality: 'Nigdi', lat: 18.6558, lng: 73.7749, label: 'Nigdi' },
  { name: 'Ravet', locality: 'Ravet', lat: 18.6477, lng: 73.7483, label: 'Ravet' },
];

export function LocationSelectorModal({
  isOpen,
  onClose,
  onSelectLocation,
}: LocationSelectorModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: 18.6279, // Default to Pimpri
    lng: 73.8009,
  });
  const [locationDetails, setLocationDetails] = useState<LocationDetails>({
    locality: 'Pimpri',
    city: 'Pimpri-Chinchwad',
    state: 'Maharashtra',
    full_address: 'Pimpri, Pimpri-Chinchwad, Pune, Maharashtra',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: number; lng: number; locality: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Initialize from stored location on open
  useEffect(() => {
    if (!isOpen) return;
    const stored = getStoredDeliveryLocation();
    if (stored) {
      setCurrentCoords({ lat: stored.lat, lng: stored.lng });
      setLocationDetails(stored.details);
    } else {
      // Default to Pimpri
      setCurrentCoords({ lat: 18.6279, lng: 73.8009 });
    }
  }, [isOpen]);

  // Leaflet map initialization
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let isCancelled = false;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css' as any);

      if (isCancelled || !mapContainerRef.current) return;

      // Clean up previous map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [currentCoords.lat, currentCoords.lng],
        zoom: 15,
        zoomControl: false,
      });

      mapInstanceRef.current = map;

      // Zoom control
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Standard OpenStreetMap tiles (free, crisp, no API key watermark)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        subdomains: 'abc',
      }).addTo(map);

      // Custom pulsing delivery pin
      const deliveryPinIcon = L.divIcon({
        className: 'custom-delivery-pin',
        html: `
          <div style="position:relative; transform: translate(-50%, -100%); cursor: grab; text-align: center;">
            <div style="background:#ea580c; color:white; font-size:10px; font-weight:900; padding:4px 10px; border-radius:12px; white-space:nowrap; box-shadow:0 6px 20px rgba(234,88,12,0.4); margin-bottom:4px; text-transform:uppercase; letter-spacing:0.08em; border: 2px solid white; display:inline-block;">
              📍 Deliver Here
            </div>
            <div style="width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg, #ff6b00, #dc2626); border:3px solid white; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(234,88,12,0.6); margin:0 auto;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div style="width:12px; height:12px; border-radius:50%; background:rgba(234,88,12,0.4); margin:2px auto 0; filter:blur(2px); animation:pulse 1.5s infinite;"></div>
          </div>
        `,
        iconSize: [40, 60],
        iconAnchor: [20, 60],
      });

      const marker = L.marker([currentCoords.lat, currentCoords.lng], {
        icon: deliveryPinIcon,
        draggable: true,
      }).addTo(map);

      markerRef.current = marker;

      // Handle marker drag
      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        handleCoordinatesChange(position.lat, position.lng);
      });

      // Handle map click to place pin
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        handleCoordinatesChange(e.latlng.lat, e.latlng.lng);
      });

      // Force recalculate dimensions after modal renders
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    };

    initMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle coordinates update & reverse geocoding
  const handleCoordinatesChange = async (lat: number, lng: number) => {
    setCurrentCoords({ lat, lng });
    setIsReverseGeocoding(true);
    try {
      const details = await reverseGeocode(lat, lng);
      setLocationDetails(details);
    } catch {
      // Fallback
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Search input debouncer
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
        setShowSearchResults(results.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select place from search or popular list
  const handleSelectPlace = (place: { lat: number; lng: number; locality: string; display_name?: string }) => {
    const lat = place.lat;
    const lng = place.lng;
    setCurrentCoords({ lat, lng });
    setLocationDetails({
      locality: place.locality,
      full_address: place.display_name || `${place.locality}, Pune, Maharashtra`,
    });
    setShowSearchResults(false);
    setSearchQuery('');

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  };

  // Use live GPS location
  const handleUseCurrentGPS = async () => {
    setIsLocating(true);
    try {
      const accurate = await getAccurateLocation();
      setCurrentCoords({ lat: accurate.lat, lng: accurate.lng });
      setLocationDetails(accurate.details);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([accurate.lat, accurate.lng], 16, { duration: 1 });
        if (markerRef.current) {
          markerRef.current.setLatLng([accurate.lat, accurate.lng]);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Could not fetch live GPS coordinates.');
    } finally {
      setIsLocating(false);
    }
  };

  // Confirm and persist location
  const handleConfirmLocation = () => {
    const finalResult: AccurateLocationResult = {
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      accuracy: 10,
      details: locationDetails,
    };

    setStoredDeliveryLocation(finalResult);

    if (onSelectLocation) {
      onSelectLocation(finalResult);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-300">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[0.6rem] font-black text-orange-600 uppercase tracking-[0.25em] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Select Delivery Location
              </span>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Pin Your Exact Address on Map</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Search, Quick Chips, Map, and Address Card */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Column: Search & Quick Selection */}
          <div className="w-full md:w-80 p-5 border-r border-gray-100 flex flex-col gap-4 bg-gray-50/50 overflow-y-auto shrink-0">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area, e.g. Pimpri, Wakad..."
                className="w-full h-12 bg-white rounded-xl pl-10 pr-4 text-sm font-medium border border-gray-200 shadow-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
              {isSearching && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-600 animate-spin" />
              )}

              {/* Autocomplete Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 max-h-60 overflow-y-auto">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPlace(result)}
                      className="w-full text-left p-2.5 hover:bg-orange-50/70 rounded-xl transition-colors flex items-start gap-2.5 group"
                    >
                      <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-orange-600 truncate">{result.locality}</p>
                        <p className="text-[0.65rem] text-gray-400 line-clamp-1">{result.display_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* GPS Trigger Button */}
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
              {isLocating ? 'Detecting Live GPS...' : 'Use Current GPS Location'}
            </Button>

            {/* Popular Localities (Pune / PCMC) */}
            <div className="space-y-2 pt-2">
              <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">Popular PCMC / Pune Zones</p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_LOCALITIES.map((loc) => {
                  const isSelected = locationDetails.locality?.toLowerCase().includes(loc.name.toLowerCase());
                  return (
                    <button
                      key={loc.name}
                      onClick={() => handleSelectPlace(loc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                          : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                      }`}
                    >
                      {loc.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hint Box */}
            <div className="mt-auto p-3.5 rounded-2xl bg-orange-50/70 border border-orange-100/80 text-[0.7rem] text-orange-950 flex items-start gap-2.5">
              <span className="text-base">💡</span>
              <p className="leading-tight">
                <strong>Tip:</strong> Drag the orange pin or tap anywhere on the map to pinpoint your building entrance.
              </p>
            </div>
          </div>

          {/* Right Column: Map & Selection Summary */}
          <div className="flex-1 flex flex-col relative min-h-[320px] sm:min-h-[420px]">
            
            {/* Leaflet Map Canvas */}
            <div className="flex-1 w-full h-full relative" style={{ minHeight: '300px' }}>
              <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />
              
              {/* Overlay GPS Center Button */}
              <button
                onClick={handleUseCurrentGPS}
                title="Center on GPS"
                className="absolute top-4 right-4 z-10 w-11 h-11 bg-white hover:bg-gray-50 text-gray-800 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center transition-all hover:scale-105"
              >
                <Navigation className="w-5 h-5 text-orange-600" />
              </button>
            </div>

            {/* Selected Location Details Card (Pinned to bottom of modal) */}
            <div className="p-4 sm:p-5 bg-white border-t border-gray-100 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Building className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-orange-600 uppercase tracking-widest">Selected Delivery Area</span>
                    {isReverseGeocoding && <Loader2 className="w-3 h-3 text-orange-500 animate-spin" />}
                  </div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight truncate">
                    {locationDetails.locality || 'Pimpri'}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {locationDetails.full_address || `${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}`}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="rounded-xl h-12 px-5 font-bold text-xs uppercase tracking-wider"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmLocation}
                  className="flex-1 sm:flex-initial bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-xl h-12 px-6 shadow-lg shadow-orange-600/25 flex items-center gap-2"
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
