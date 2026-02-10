'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

import {
  countryAliases,
  mapVariants,
  trips,
  visitedCountries,
  type MapVariant,
} from '@/data/trips';

const GEOGRAPHY_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

type FFMapProps = {
  location?: string;
  radius?: string;
  variant?: MapVariant;
  zoom?: number;
};

type MapPosition = {
  coordinates: [number, number];
  zoom: number;
};

type VariantStyle = {
  mapFilter: string;
  overlay: string;
  overlayBlendMode: CSSProperties['mixBlendMode'];
  overlayOpacity: number;
};

const variantStyles: Record<MapVariant, VariantStyle> = {
  'Dark Mode': {
    mapFilter: 'grayscale(0.15) brightness(0.95) contrast(1.1)',
    overlay: 'linear-gradient(180deg, rgba(7, 17, 33, 0.15), rgba(7, 17, 33, 0.4))',
    overlayBlendMode: 'multiply',
    overlayOpacity: 1,
  },
  Grayscale: {
    mapFilter: 'grayscale(1) contrast(1.05)',
    overlay: 'linear-gradient(140deg, rgba(255, 255, 255, 0.2), rgba(120, 120, 120, 0.4))',
    overlayBlendMode: 'soft-light',
    overlayOpacity: 1,
  },
  'Night Mode': {
    mapFilter: 'brightness(0.72) saturate(0.75) contrast(1.12)',
    overlay: 'radial-gradient(circle at 50% 15%, rgba(66, 124, 255, 0.3), rgba(8, 12, 31, 0.66))',
    overlayBlendMode: 'multiply',
    overlayOpacity: 1,
  },
  Duplex: {
    mapFilter: 'grayscale(0.4) sepia(0.8) contrast(1.1)',
    overlay: 'linear-gradient(130deg, rgba(255, 206, 92, 0.3), rgba(31, 47, 79, 0.55))',
    overlayBlendMode: 'overlay',
    overlayOpacity: 1,
  },
  Monochrome: {
    mapFilter: 'grayscale(1) brightness(1.02)',
    overlay: 'linear-gradient(160deg, rgba(35, 35, 35, 0.2), rgba(14, 14, 14, 0.55))',
    overlayBlendMode: 'multiply',
    overlayOpacity: 1,
  },
  Gradient: {
    mapFilter: 'saturate(1.05) contrast(1.07)',
    overlay:
      'radial-gradient(circle at 35% 15%, rgba(255, 94, 58, 0.4), rgba(25, 209, 221, 0.15) 45%, rgba(8, 17, 38, 0.6) 100%)',
    overlayBlendMode: 'screen',
    overlayOpacity: 1,
  },
  Inverted: {
    mapFilter: 'invert(1) hue-rotate(180deg) contrast(1.08)',
    overlay: 'linear-gradient(180deg, rgba(255, 255, 255, 0.15), rgba(130, 130, 130, 0.25))',
    overlayBlendMode: 'difference',
    overlayOpacity: 1,
  },
  'Dot Matrix': {
    mapFilter: 'saturate(0.8) contrast(1.12)',
    overlay:
      'radial-gradient(circle, rgba(255, 255, 255, 0.38) 1px, rgba(0, 0, 0, 0) 1px), linear-gradient(170deg, rgba(24, 57, 107, 0.2), rgba(5, 12, 24, 0.55))',
    overlayBlendMode: 'soft-light',
    overlayOpacity: 1,
  },
  'The Sweetheart': {
    mapFilter: 'saturate(1.1) contrast(1.06)',
    overlay:
      'radial-gradient(circle at 50% 10%, rgba(255, 124, 187, 0.5), rgba(255, 66, 146, 0.15) 35%, rgba(27, 12, 42, 0.62) 90%)',
    overlayBlendMode: 'color-dodge',
    overlayOpacity: 1,
  },
};

const parseLocation = (location: string): [number, number] => {
  const parts = location
    .split(',')
    .map((part) => Number.parseFloat(part.trim()))
    .filter((value) => Number.isFinite(value));

  if (parts.length !== 2) {
    return [0, 20];
  }

  const [latitude, longitude] = parts;
  return [longitude, latitude];
};

const getCountryName = (name: string) => countryAliases[name] ?? name;

export default function FFMap({
  location = '20,0',
  radius = '28px',
  variant = 'Dark Mode',
  zoom = 1.15,
}: FFMapProps) {
  const [selectedVariant, setSelectedVariant] = useState<MapVariant>(variant);
  const [position, setPosition] = useState<MapPosition>({
    coordinates: parseLocation(location),
    zoom,
  });

  const visitedCountrySet = useMemo(
    () => new Set(visitedCountries.map((country) => country.toLowerCase())),
    []
  );

  const activeVariant = variantStyles[selectedVariant];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Our World Map</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">
            Countries visited together are scratched in textured gold. Drag to pan and use wheel or pinch to zoom.
          </p>
        </div>

        <label className="flex items-center gap-3 rounded-full border border-amber-300/30 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 backdrop-blur">
          <span className="whitespace-nowrap">Map Variant</span>
          <select
            className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-sm outline-none"
            onChange={(event) => setSelectedVariant(event.target.value as MapVariant)}
            value={selectedVariant}
          >
            {mapVariants.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className="relative overflow-hidden border border-amber-200/20 bg-[#0b162c] shadow-[0_40px_90px_rgba(7,10,20,0.65)]"
        style={{ borderRadius: radius }}
      >
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.1),rgba(8,16,32,0.8)_56%)]" />

        <div className="relative z-10" style={{ filter: activeVariant.mapFilter }}>
          <ComposableMap
            height={520}
            projection="geoMercator"
            style={{ height: '100%', width: '100%' }}
            width={1060}
          >
            <defs>
              <linearGradient id="ml-gold-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF6B2" />
                <stop offset="35%" stopColor="#FFD700" />
                <stop offset="65%" stopColor="#E9B200" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>

              <pattern
                height="14"
                id="ml-gold-texture"
                patternTransform="rotate(24)"
                patternUnits="userSpaceOnUse"
                width="14"
              >
                <rect fill="url(#ml-gold-gradient)" height="14" width="14" x="0" y="0" />
                <path d="M 0 3 L 14 3" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="0.6" />
                <path d="M 0 10 L 14 10" stroke="rgba(102, 63, 0, 0.3)" strokeWidth="0.7" />
                <circle cx="4" cy="5" fill="rgba(255, 255, 255, 0.26)" r="1" />
                <circle cx="11" cy="9" fill="rgba(128, 84, 0, 0.35)" r="1" />
              </pattern>

              <filter id="ml-gold-noise">
                <feTurbulence baseFrequency="0.9" numOctaves="2" result="noise" seed="7" type="fractalNoise" />
                <feColorMatrix
                  in="noise"
                  result="grain"
                  type="matrix"
                  values="0 0 0 0 0.15 0 0 0 0 0.12 0 0 0 0 0.02 0 0 0 0.7 0"
                />
                <feBlend in="SourceGraphic" in2="grain" mode="multiply" />
              </filter>
            </defs>

            <ZoomableGroup
              center={position.coordinates}
              maxZoom={6}
              minZoom={1}
              onMoveEnd={(nextPosition: MapPosition) => setPosition(nextPosition)}
              zoom={position.zoom}
            >
              <Geographies geography={GEOGRAPHY_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryName = getCountryName((geo.properties?.name ?? '') as string);
                    const visited = visitedCountrySet.has(countryName.toLowerCase());

                    return (
                      <Geography
                        geography={geo}
                        key={geo.rsmKey}
                        style={{
                          default: {
                            fill: visited ? 'url(#ml-gold-texture)' : '#14294a',
                            filter: visited ? 'url(#ml-gold-noise)' : 'none',
                            outline: 'none',
                            stroke: visited ? '#b8860b' : '#273f66',
                            strokeWidth: 0.45,
                          },
                          hover: {
                            fill: visited ? '#ffdf48' : '#1f406f',
                            filter: visited ? 'url(#ml-gold-noise)' : 'none',
                            outline: 'none',
                            stroke: visited ? '#ffd700' : '#4f79b9',
                            strokeWidth: 0.7,
                          },
                          pressed: {
                            fill: visited ? '#f6be00' : '#1c3760',
                            filter: visited ? 'url(#ml-gold-noise)' : 'none',
                            outline: 'none',
                            stroke: visited ? '#b8860b' : '#4f79b9',
                            strokeWidth: 0.7,
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>

              {trips.map((trip) => (
                <Marker coordinates={trip.coordinates} key={trip.slug}>
                  <g transform="translate(0 -10)">
                    <circle fill="rgba(255,215,0,0.25)" r="12" />
                    <circle fill="#FFD700" r="4.5" stroke="#5b3b00" strokeWidth="1" />
                  </g>
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            background: activeVariant.overlay,
            backgroundSize: selectedVariant === 'Dot Matrix' ? '22px 22px, cover' : 'cover',
            mixBlendMode: activeVariant.overlayBlendMode,
            opacity: activeVariant.overlayOpacity,
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => (
          <Link
            className="group overflow-hidden rounded-3xl border border-amber-100/20 bg-slate-900/80 shadow-[0_20px_40px_rgba(10,14,26,0.45)] transition hover:-translate-y-0.5 hover:border-amber-300/40"
            href={`/trips/${trip.slug}`}
            key={trip.slug}
          >
            <div className="relative h-48 overflow-hidden">
              <Image
                alt={`${trip.city} preview`}
                className="object-cover transition duration-500 group-hover:scale-105"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                src={trip.previewImage}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-xs uppercase tracking-[0.22em] text-amber-200/90">{trip.country}</p>
                <h3 className="text-lg font-semibold text-white">{trip.city}</h3>
              </div>
            </div>
            <p className="px-4 py-3 text-sm text-slate-300">Open this city gallery</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
