'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

import { countryAliases, trips, visitedCountries, type Trip } from '@/data/trips';

const GEOGRAPHY_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const getCountryName = (name: string) => countryAliases[name] ?? name;

export default function FixedGoldMap() {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(trips[0] ?? null);

  const visitedCountrySet = useMemo(
    () => new Set(visitedCountries.map((country) => country.toLowerCase())),
    []
  );

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#030711] text-white">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.12),rgba(3,7,17,0.95)_55%)]" />

      <ComposableMap
        height={900}
        projection="geoEqualEarth"
        projectionConfig={{ scale: 300 }}
        style={{ height: '100%', width: '100%' }}
        width={1800}
      >
        <defs>
          <linearGradient id="ml-gold-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF5B1" />
            <stop offset="33%" stopColor="#FFD700" />
            <stop offset="66%" stopColor="#D4A81E" />
            <stop offset="100%" stopColor="#8A6412" />
          </linearGradient>

          <pattern height="14" id="ml-gold-texture" patternUnits="userSpaceOnUse" width="14">
            <rect fill="url(#ml-gold-gradient)" height="14" width="14" x="0" y="0" />
            <path d="M 0 4 L 14 4" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7" />
            <path d="M 0 10 L 14 10" stroke="rgba(90,63,10,0.33)" strokeWidth="0.8" />
            <circle cx="4" cy="5" fill="rgba(255,255,255,0.2)" r="1" />
            <circle cx="10" cy="9" fill="rgba(86,58,7,0.35)" r="1" />
          </pattern>

          <filter id="ml-gold-noise">
            <feTurbulence baseFrequency="0.9" numOctaves="2" result="noise" seed="7" type="fractalNoise" />
            <feColorMatrix
              in="noise"
              result="grain"
              type="matrix"
              values="0 0 0 0 0.14 0 0 0 0 0.11 0 0 0 0 0.02 0 0 0 0.62 0"
            />
            <feBlend in="SourceGraphic" in2="grain" mode="multiply" />
          </filter>
        </defs>

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
                      fill: visited ? 'url(#ml-gold-texture)' : '#152743',
                      filter: visited ? 'url(#ml-gold-noise)' : 'none',
                      outline: 'none',
                      stroke: visited ? '#B8860B' : '#2D4E79',
                      strokeWidth: 0.42,
                    },
                    hover: {
                      fill: visited ? '#FFDF4D' : '#1D3B62',
                      filter: visited ? 'url(#ml-gold-noise)' : 'none',
                      outline: 'none',
                      stroke: visited ? '#FFD700' : '#4F7CB0',
                      strokeWidth: 0.65,
                    },
                    pressed: {
                      fill: visited ? '#F2C200' : '#1A3658',
                      filter: visited ? 'url(#ml-gold-noise)' : 'none',
                      outline: 'none',
                      stroke: visited ? '#D9A81C' : '#4F7CB0',
                      strokeWidth: 0.65,
                    },
                  }}
                />
              );
            })
          }
        </Geographies>

        {trips.map((trip) => (
          <Marker coordinates={trip.coordinates} key={trip.slug}>
            <g
              aria-label={`Open ${trip.city} preview`}
              onClick={() => setActiveTrip(trip)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setActiveTrip(trip);
                }
              }}
              role="button"
              style={{ cursor: 'pointer' }}
              tabIndex={0}
              transform="translate(0 -12)"
            >
              <circle fill="rgba(255,215,0,0.18)" r="14" />
              <circle fill="#FFD700" r="5" stroke="#6A4A09" strokeWidth="1.3" />
            </g>
          </Marker>
        ))}
      </ComposableMap>

      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-2xl bg-black/45 px-4 py-3 backdrop-blur sm:left-6 sm:top-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200">Memory Lane</p>
        <h1 className="mt-1 text-lg font-semibold sm:text-xl">Fixed World Map</h1>
        <p className="text-xs text-slate-300 sm:text-sm">
          Gold countries are places you visited together. Tap city dots for previews.
        </p>
      </div>

      {activeTrip && (
        <aside className="absolute bottom-4 left-4 right-4 z-30 overflow-hidden rounded-2xl border border-amber-200/25 bg-slate-950/90 shadow-[0_24px_48px_rgba(0,0,0,0.45)] backdrop-blur sm:bottom-6 sm:left-auto sm:right-6 sm:top-6 sm:w-[340px]">
          <div className="relative h-44">
            <Image alt={`${activeTrip.city} preview`} className="object-cover" fill sizes="340px" src={activeTrip.previewImage} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
            <button
              aria-label="Close city preview"
              className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs text-white"
              onClick={() => setActiveTrip(null)}
              type="button"
            >
              Close
            </button>
            <div className="absolute bottom-3 left-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200">{activeTrip.country}</p>
              <h2 className="text-xl font-semibold text-white">{activeTrip.city}</h2>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <p className="text-sm text-slate-300">Open this trip’s full gallery and cloud albums.</p>
            <Link
              className="inline-flex rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-300/20"
              href={`/trips/${activeTrip.slug}`}
            >
              Open {activeTrip.city} Gallery
            </Link>
          </div>
        </aside>
      )}
    </main>
  );
}
