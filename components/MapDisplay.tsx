'use client';

import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet - use CDN for now
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapDisplayProps {
  latitude: number | null;
  longitude: number | null;
  address?: string;
  zoom?: number;
  height?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
}

function LocationMarker({ latitude, longitude, address, onLocationSelect }: any) {
  const markerRef = useRef<any>(null);

  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    }
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null && onLocationSelect) {
          const position = marker.getLatLng();
          onLocationSelect(position.lat, position.lng);
        }
      },
    }),
    [onLocationSelect]
  );

  if (!latitude || !longitude) return null;

  return (
    <Marker 
      position={[latitude, longitude]}
      draggable={!!onLocationSelect}
      eventHandlers={eventHandlers}
      ref={markerRef}
    >
      {address && (
        <Popup>
          <div className="text-sm">
            <strong>Location</strong>
            <p>{address}</p>
          </div>
        </Popup>
      )}
    </Marker>
  );
}

function MapUpdater({ lat, lng }: { lat: number | null, lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom() < 13 ? 13 : map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

export default function MapDisplay({ 
  latitude, 
  longitude, 
  address, 
  zoom = 13,
  height = '300px',
  onLocationSelect
}: MapDisplayProps) {
  const isBrowser = typeof window !== 'undefined';
  
  if (!isBrowser) {
    return (
      <div className="h-full w-full bg-[var(--background)] rounded flex items-center justify-center text-sm text-[var(--muted)] border border-[var(--border)]">
        Loading map...
      </div>
    );
  }

  // Default to Riyadh, Saudi Arabia if no coordinates provided
  const centerLat = latitude || 24.7136;
  const centerLng = longitude || 46.6753;
  const actualZoom = latitude && longitude ? zoom : 5;

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-[var(--border)] relative z-0">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={actualZoom}
        style={{ height, width: '100%' }}
        className="rounded-lg"
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street Map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='Tiles &copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Topographic">
            <TileLayer
              attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        <MapUpdater lat={latitude} lng={longitude} />
        <LocationMarker 
          latitude={latitude} 
          longitude={longitude} 
          address={address} 
          onLocationSelect={onLocationSelect} 
        />
      </MapContainer>
    </div>
  );
}