'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LocateFixed, Map as MapIcon, Satellite, Search, Sun, Loader2 } from 'lucide-react';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
  addressHint?: string;
}

type Layer = 'satellite' | 'street';

const DEFAULT_POSITION: [number, number] = [-30.0346, -51.2177];
const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

function validPosition(latitude: number, longitude: number): [number, number] {
  if (Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0)) {
    return [latitude, longitude];
  }
  return DEFAULT_POSITION;
}

let googleLoaderPromise: Promise<typeof google> | null = null;

function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if (window.google?.maps) return Promise.resolve(window.google);
  if (googleLoaderPromise) return googleLoaderPromise;

  googleLoaderPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_KEY) {
      reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_KEY ausente.'));
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar Google Maps.')));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places,geocoding&v=weekly&language=pt-BR&region=BR`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = 'true';
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Falha ao carregar Google Maps.'));
    document.head.appendChild(script);
  });

  return googleLoaderPromise;
}

type SolarInsights = {
  imageryQuality?: string;
  imageryDate?: { year?: number; month?: number; day?: number };
  solarPotential?: {
    maxArrayPanelsCount?: number;
    maxArrayAreaMeters2?: number;
    maxSunshineHoursPerYear?: number;
    carbonOffsetFactorKgPerMwh?: number;
    panelCapacityWatts?: number;
    panelHeightMeters?: number;
    panelWidthMeters?: number;
    wholeRoofStats?: { areaMeters2?: number; sunshineQuantiles?: number[] };
  };
  error?: { message?: string };
};

async function fetchSolarInsights(lat: number, lng: number): Promise<SolarInsights> {
  const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${GOOGLE_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || `Solar API HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export default function MapComponent({
  latitude,
  longitude,
  onLocationSelect,
  addressHint = '',
}: MapComponentProps) {
  const position = useMemo(() => validPosition(latitude, longitude), [latitude, longitude]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [layer, setLayer] = useState<Layer>('satellite');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [solarLoading, setSolarLoading] = useState(false);
  const [solar, setSolar] = useState<SolarInsights | null>(null);
  const [solarError, setSolarError] = useState('');

  // Init map
  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !containerRef.current) return;
        const map = new g.maps.Map(containerRef.current, {
          center: { lat: position[0], lng: position[1] },
          zoom: 19,
          mapTypeId: g.maps.MapTypeId.SATELLITE,
          tilt: 0,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });
        const marker = new g.maps.Marker({
          map,
          position: { lat: position[0], lng: position[1] },
          draggable: true,
        });
        marker.addListener('dragend', () => {
          const p = marker.getPosition();
          if (p) onLocationSelect(p.lat(), p.lng());
        });
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          marker.setPosition({ lat, lng });
          onLocationSelect(lat, lng);
        });

        mapRef.current = map;
        markerRef.current = marker;
        geocoderRef.current = new g.maps.Geocoder();
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external position changes
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const next = { lat: position[0], lng: position[1] };
    marker.setPosition(next);
    const c = map.getCenter();
    if (!c || Math.abs(c.lat() - next.lat) > 0.0001 || Math.abs(c.lng() - next.lng) > 0.0001) {
      map.panTo(next);
    }
  }, [position]);

  // Layer toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;
    map.setMapTypeId(
      layer === 'satellite' ? window.google.maps.MapTypeId.SATELLITE : window.google.maps.MapTypeId.ROADMAP
    );
  }, [layer]);

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim() || addressHint.trim();
    if (!q) return;
    if (!geocoderRef.current) {
      setSearchError('Mapa ainda carregando. Tente em 1s.');
      return;
    }
    setSearchLoading(true);
    setSearchError('');
    try {
      const fullQuery = /brasil/i.test(q) ? q : `${q}, Brasil`;
      const { results } = await geocoderRef.current.geocode({ address: fullQuery, region: 'BR' });
      if (!results.length) {
        setSearchError('Endereço não encontrado. Tente rua, número, cidade e UF.');
        return;
      }
      const top = results[0];
      const loc = top.geometry.location;
      onLocationSelect(loc.lat(), loc.lng());
      setSearchQuery(top.formatted_address);
    } catch (err) {
      console.error('Geocode error:', err);
      setSearchError('Falha na busca. Tente novamente ou clique no mapa.');
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, addressHint, onLocationSelect]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setSearchError('Navegador sem geolocalização.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationSelect(pos.coords.latitude, pos.coords.longitude);
        setSearchError('');
      },
      () => setSearchError('Permissão de localização negada.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSolar = async () => {
    setSolar(null);
    setSolarError('');
    setSolarLoading(true);
    try {
      const data = await fetchSolarInsights(position[0], position[1]);
      setSolar(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro Solar API';
      setSolarError(msg);
    } finally {
      setSolarLoading(false);
    }
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

      {(loadError || searchError) && (
        <div className="map-results">
          {loadError && <div className="map-result map-result-error">{loadError}</div>}
          {searchError && <div className="map-result map-result-error">{searchError}</div>}
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
        <button
          type="button"
          className="solar-test-btn"
          onClick={handleSolar}
          disabled={solarLoading}
          title="Consultar Solar API neste ponto"
        >
          {solarLoading ? <Loader2 size={14} className="animate-spin" /> : <Sun size={14} />}
          Solar API
        </button>
      </div>

      <div ref={containerRef} className="map-leaflet" style={{ width: '100%', height: '100%' }} />

      {(solar || solarError) && (
        <div className="map-solar-panel">
          {solarError && <div className="map-result map-result-error">{solarError}</div>}
          {solar?.solarPotential && (
            <div className="solar-stats">
              <div><strong>Qualidade imagem:</strong> {solar.imageryQuality}</div>
              <div><strong>Painéis máx:</strong> {solar.solarPotential.maxArrayPanelsCount}</div>
              <div><strong>Área máx:</strong> {solar.solarPotential.maxArrayAreaMeters2?.toFixed(1)} m²</div>
              <div><strong>Horas sol/ano:</strong> {solar.solarPotential.maxSunshineHoursPerYear?.toFixed(0)}</div>
              <div><strong>Pot. painel:</strong> {solar.solarPotential.panelCapacityWatts} W</div>
            </div>
          )}
        </div>
      )}

      <div className="map-coordinates">
        <span>PINO</span>
        {position[0].toFixed(6)}, {position[1].toFixed(6)}
      </div>
      <div className="map-hint">Clique ou arraste o pino até o telhado</div>
    </div>
  );
}
