'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// 100% Free and Open-Source Tiling Layers (OpenStreetMap & OpenTopoMap FOSS)
// Styled to brand palette (monochrome black and white with yellow accents) via pure CSS
const TILE_LAYERS = {
  dark: {
    name: 'Brand Dark',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    tileClassName: 'brand-tiles-dark',
    subdomains: 'abc',
    maxZoom: 19,
  },
  light: {
    name: 'Brand Light',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    tileClassName: 'brand-tiles-light',
    subdomains: 'abc',
    maxZoom: 19,
  },
  street: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    tileClassName: 'brand-tiles-standard',
    subdomains: 'abc',
    maxZoom: 19,
  },
  topo: {
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">OpenTopoMap</a>',
    tileClassName: 'brand-tiles-standard',
    subdomains: 'abc',
    maxZoom: 17,
  },
} as const;

type MapLayerType = keyof typeof TILE_LAYERS;

interface MapDisplayProps {
  latitude: number | null;
  longitude: number | null;
  address?: string;
  zoom?: number;
  height?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
  markers?: { id: string; latitude: number; longitude: number; label: string; detail?: string }[];
}

// Brand Pin: Black and Yellow Accent Teardrop Pin
const createBrandLocationIcon = () => {
  return L.divIcon({
    className: 'brand-location-marker-container',
    html: `
      <div class="brand-location-marker-wrapper">
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 6px rgba(250, 204, 21, 0.65));">
          <path d="M16 41C16 41 30 25.5 30 15C30 7.26801 23.732 1 16 1C8.26801 1 2 7.26801 2 15C2 25.5 16 41 16 41Z" fill="#09090b" stroke="#facc15" stroke-width="2.5"/>
          <circle cx="16" cy="15" r="5.5" fill="#facc15"/>
          <circle cx="16" cy="15" r="2.5" fill="#09090b"/>
        </svg>
        <div class="brand-location-shadow-dot"></div>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 41],
    popupAnchor: [0, -42],
  });
};

// Brand Driver Marker: Black and Yellow circular unit with active radar ping & brand font label pill
const createBrandDriverIcon = (label?: string) => {
  const displayLabel = label ? (label.length > 22 ? label.slice(0, 20) + '…' : label) : '';
  return L.divIcon({
    className: 'brand-driver-marker-container',
    html: `
      <div class="brand-driver-marker-wrapper">
        <div class="brand-driver-radar-pulse"></div>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 8px rgba(250, 204, 21, 0.7));">
          <circle cx="18" cy="18" r="14.5" fill="#09090b" stroke="#facc15" stroke-width="2.5"/>
          <g transform="translate(9.5, 9.5)" stroke="#facc15" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <path d="M10 14V4a1.5 1.5 0 0 0-1.5-1.5h-6A1.5 1.5 0 0 0 1 4v9a1 1 0 0 0 1 1h1.5"/>
            <path d="M11 14h-1"/>
            <path d="M14 14h2a1 1 0 0 0 1-1v-3a1 1 0 0 0-.2-.6l-2.6-3.2A1 1 0 0 0 13.4 6H10"/>
            <circle cx="12.5" cy="14" r="1.5" fill="#facc15"/>
            <circle cx="4.5" cy="14" r="1.5" fill="#facc15"/>
          </g>
        </svg>
        ${displayLabel ? `<span class="brand-driver-label-pill">${displayLabel}</span>` : ''}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

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

  const locationIcon = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return createBrandLocationIcon();
  }, []);

  if (!latitude || !longitude) return null;

  return (
    <Marker
      position={[latitude, longitude]}
      draggable={!!onLocationSelect}
      eventHandlers={eventHandlers}
      ref={markerRef}
      icon={locationIcon}
    >
      <Popup className="brand-popup" closeButton={true}>
        <div className="p-1 min-w-[190px] font-sans">
          <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-zinc-800">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-400 font-mono">Selected Point</span>
          </div>
          {address ? (
            <p className="text-xs text-zinc-100 font-medium leading-snug">{address}</p>
          ) : (
            <p className="text-xs text-zinc-300">Pinned Location</p>
          )}
          <p className="text-[10px] font-mono text-zinc-500 mt-1.5">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </p>
          {onLocationSelect && (
            <div className="mt-2 pt-1.5 border-t border-zinc-800 text-[10px] text-zinc-400 flex items-center gap-1">
              <span className="text-yellow-400">✦</span> Drag marker or click map to move
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

function DriverMarkers({ markers }: { markers: NonNullable<MapDisplayProps['markers']> }) {
  return (
    <>
      {markers.map(marker => {
        const icon = typeof window !== 'undefined' ? createBrandDriverIcon(marker.label) : undefined;
        return (
          <Marker
            key={marker.id}
            position={[marker.latitude, marker.longitude]}
            icon={icon}
          >
            <Popup className="brand-popup" closeButton={true}>
              <div className="p-1 min-w-[210px] font-sans">
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
                    </span>
                    <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider font-mono">FLEET UNIT</span>
                  </div>
                  <span className="text-[9px] font-mono bg-yellow-400/15 text-yellow-400 border border-yellow-400/40 px-1.5 py-0.5 rounded font-bold">
                    LIVE GPS
                  </span>
                </div>
                <div className="text-sm font-semibold text-zinc-100 mb-0.5 font-sans">
                  {marker.label}
                </div>
                {marker.detail && (
                  <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5 font-sans">
                    <span className="text-yellow-400 font-mono">↳</span> {marker.detail}
                  </div>
                )}
                <div className="mt-2.5 pt-1.5 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>LAT: {marker.latitude.toFixed(4)}</span>
                  <span>LNG: {marker.longitude.toFixed(4)}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
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
  onLocationSelect,
  markers = [],
}: MapDisplayProps) {
  // Default to Brand Dark (monochrome black and white)
  const [layerType, setLayerType] = useState<MapLayerType>('dark');
  const isBrowser = typeof window !== 'undefined';

  if (!isBrowser) {
    return (
      <div className="h-full w-full bg-[#09090b] rounded-lg flex items-center justify-center text-sm text-zinc-500 border border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
          <span>Loading fleet map...</span>
        </div>
      </div>
    );
  }

  // Default to Riyadh, Saudi Arabia if no coordinates provided
  const centerLat = latitude || (markers.length > 0 ? markers[0].latitude : 24.7136);
  const centerLng = longitude || (markers.length > 0 ? markers[0].longitude : 46.6753);
  const actualZoom = (latitude && longitude) || markers.length > 0 ? zoom : 5;

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-[var(--border)] relative z-0 bg-[#09090b] brand-map-container group">
      {/* Sleek brand layer switch pill */}
      <div className="absolute top-2.5 right-2.5 z-[400] flex items-center bg-black/90 backdrop-blur-md border border-zinc-800 rounded-lg shadow-xl p-1 text-[11px] font-sans">
        {(Object.keys(TILE_LAYERS) as MapLayerType[]).map((key) => {
          const isActive = layerType === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setLayerType(key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${isActive
                  ? 'bg-yellow-400 text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
            >
              {TILE_LAYERS[key].name}
            </button>
          );
        })}
      </div>

      {/* Brand HUD live radar indicator on bottom-left */}
      <div className="absolute bottom-3 left-3 z-[400] pointer-events-none hidden sm:flex items-center gap-2 bg-black/85 backdrop-blur-md border border-zinc-800/90 rounded-lg px-2.5 py-1.5 shadow-lg text-[11px]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
        </span>
        <span className="font-mono text-[10px] tracking-wider font-semibold text-zinc-300">
          MMT FLEET RADAR
        </span>
        {markers.length > 0 && (
          <span className="bg-yellow-400/15 border border-yellow-400/40 text-yellow-400 px-1.5 py-0.2 rounded font-mono text-[9px] font-bold">
            {markers.length} {markers.length === 1 ? 'UNIT' : 'UNITS'}
          </span>
        )}
      </div>

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={actualZoom}
        style={{ height, width: '100%' }}
        className={`rounded-lg brand-leaflet-map layer-${layerType}`}
      >
        <TileLayer
          key={layerType}
          attribution={TILE_LAYERS[layerType].attribution}
          url={TILE_LAYERS[layerType].url}
          className={TILE_LAYERS[layerType].tileClassName}
          subdomains={TILE_LAYERS[layerType].subdomains || 'abc'}
          maxZoom={TILE_LAYERS[layerType].maxZoom || 19}
        />

        <MapUpdater lat={latitude} lng={longitude} />
        <LocationMarker
          latitude={latitude}
          longitude={longitude}
          address={address}
          onLocationSelect={onLocationSelect}
        />
        <DriverMarkers markers={markers} />
      </MapContainer>
    </div>
  );
}