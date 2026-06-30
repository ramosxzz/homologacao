'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { LocateFixed, Map as MapIcon, Satellite, Search } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapComponentProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
  addressHint?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
}

type Layer = 'satellite' | 'street';

const DEFAULT_POSITION: [number, number] = [-30.0346, -51.2177];

async function geocode(query: string): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '6',
    countrycodes: 'br',
    addressdetails: '1',
    q: query,
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
  });

  if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
  return res.json();
}

function validPosition(latitude: number, longitude: number): [number, number] {
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) return [latitude, longitude];
  return DEFAULT_POSITION;
}

function MapCenterController({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    const current = map.getCenter();
    if (
      Math.abs(current.lat - position[0]) > 0.0001 ||
      Math.abs(current.lng - position[1]) > 0.0001
    ) {
      map.setView(position, Math.max(map.getZoom(), 18), { animate: true });
    }
  }, [map, position]);

  return null;
}

function MapSizeController() {
  const map = useMap();

  useEffect(() => {
    const refresh = () => map.invalidateSize();
    const timer = window.setTimeout(refresh, 120);
    window.addEventListener('resize', refresh);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', refresh);
    };
  }, [map]);

  return null;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onClick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

export default function MapComponent({
  latitude,
  longitude,
  onLocationSelect,
  addressHint = '',
}: MapComponentProps) {
  const position = useMemo(() => validPosition(latitude, longitude), [latitude, longitude]);
  const [layer, setLayer] = useState<Layer>('street');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const query = searchQuery.trim() || addressHint.trim();

  const handleSearch = async () => {
    if (!query) return;

    setSearchLoading(true);
    setSearchError('');

    try {
      const results = await geocode(query.includes('Brasil') ? query : `${query}, Brasil`);
      setSearchResults(results);

      if (results.length === 0) {
        setSearchError('Endereço não encontrado. Tente buscar por rua, número, cidade e UF.');
        return;
      }

      if (results.length === 1) {
        selectResult(results[0]);
      }
    } catch (error) {
      console.error('Geocode error:', error);
      setSearchError('Não consegui buscar esse endereço agora. Você ainda pode clicar no telhado no mapa.');
    } finally {
      setSearchLoading(false);
    }
  };

  const selectResult = (result: NominatimResult) => {
    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    onLocationSelect(lat, lng);
    setSearchQuery(result.display_name.split(',').slice(0, 4).join(', '));
    setSearchResults([]);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setSearchError('Este navegador não liberou geolocalização.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationSelect(pos.coords.latitude, pos.coords.longitude);
        setSearchError('');
        setSearchResults([]);
      },
      () => setSearchError('Não consegui acessar sua localização. Confira a permissão do navegador.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const tiles: Record<Layer, { url: string; attribution: string; maxZoom: number }> = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Imagery © Esri',
      maxZoom: 20,
    },
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    },
  };

  return (
    <div className="map-shell">
      <div className="map-search">
        <div className="map-search-input">
          <Search size={16} />
          <input
            type="text"
            placeholder={addressHint || 'Buscar rua, número, cidade e UF'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
        </div>
        <button type="button" className="map-btn map-btn-primary" onClick={handleSearch} disabled={searchLoading}>
          {searchLoading ? 'Buscando...' : 'Buscar'}
        </button>
        <button type="button" className="map-btn map-btn-icon" onClick={handleLocate} title="Usar minha localização">
          <LocateFixed size={16} />
        </button>
      </div>

      {(searchResults.length > 0 || searchError) && (
        <div className="map-results">
          {searchError && <div className="map-result map-result-error">{searchError}</div>}
          {searchResults.map((result) => (
            <button
              key={`${result.lat}-${result.lon}-${result.display_name}`}
              type="button"
              className="map-result"
              onClick={() => selectResult(result)}
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}

      <div className="map-layer-toggle" aria-label="Tipo de mapa">
        <button
          type="button"
          className={layer === 'satellite' ? 'active' : ''}
          onClick={() => setLayer('satellite')}
          title="Imagem de satélite"
        >
          <Satellite size={14} />
          Satélite
        </button>
        <button
          type="button"
          className={layer === 'street' ? 'active' : ''}
          onClick={() => setLayer('street')}
          title="Mapa de ruas"
        >
          <MapIcon size={14} />
          Ruas
        </button>
      </div>

      <MapContainer center={position} zoom={18} scrollWheelZoom className="map-leaflet">
        <TileLayer
          key={layer}
          url={tiles[layer].url}
          attribution={tiles[layer].attribution}
          maxZoom={tiles[layer].maxZoom}
        />
        <MapSizeController />
        <MapCenterController position={position} />
        <MapClickHandler onClick={onLocationSelect} />
        <Marker
          position={position}
          draggable
          eventHandlers={{
            dragend: (event) => {
              const marker = event.target as L.Marker;
              const next = marker.getLatLng();
              onLocationSelect(next.lat, next.lng);
            },
          }}
        />
      </MapContainer>

      <div className="map-coordinates">
        <span>PINO</span>
        {position[0].toFixed(6)}, {position[1].toFixed(6)}
      </div>
      <div className="map-hint">Clique ou arraste o pino até o telhado</div>
    </div>
  );
}
