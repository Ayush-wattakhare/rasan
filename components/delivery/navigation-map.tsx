'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface NavigationMapProps {
  pickupLocation: { lat: number; lng: number };
  deliveryLocation: { lat: number; lng: number };
  currentLocation?: { lat: number; lng: number };
}

export default function NavigationMap({
  pickupLocation,
  deliveryLocation,
  currentLocation,
}: NavigationMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current).setView(
      [pickupLocation.lat, pickupLocation.lng],
      13
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Add pickup marker
    const pickupIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    L.marker([pickupLocation.lat, pickupLocation.lng], { icon: pickupIcon })
      .addTo(map)
      .bindPopup('Pickup Location');

    // Add delivery marker
    const deliveryIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    L.marker([deliveryLocation.lat, deliveryLocation.lng], { icon: deliveryIcon })
      .addTo(map)
      .bindPopup('Delivery Location');

    // Fit bounds to show both markers
    const bounds = L.latLngBounds([
      [pickupLocation.lat, pickupLocation.lng],
      [deliveryLocation.lat, deliveryLocation.lng],
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [pickupLocation, deliveryLocation]);

  // Update current location marker
  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;

    const currentIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const marker = L.marker([currentLocation.lat, currentLocation.lng], {
      icon: currentIcon,
    })
      .addTo(mapRef.current)
      .bindPopup('Your Location');

    return () => {
      marker.remove();
    };
  }, [currentLocation]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[400px] rounded-lg border"
    />
  );
}
