'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

import { trips, tripsBySlug, type Trip } from '@/data/trips';

type TripPointDatum = {
  city: string;
  country: string;
  geometry: {
    coordinates: [number, number];
    type: 'Point';
  };
  slug: string;
};

type CountryCategoryKey = 'together' | 'amir' | 'vlada' | 'separate' | 'wish';

type CountryGroups = Record<CountryCategoryKey, string[]>;

type CountryColorsResponse = {
  countryGroups?: Partial<CountryGroups>;
};

type WorldFeature = {
  id?: string;
  properties?: {
    name?: string;
  };
};

type WorldGeoJson = {
  features?: WorldFeature[];
};

const CATEGORY_ORDER: CountryCategoryKey[] = [
  'together',
  'amir',
  'vlada',
  'separate',
  'wish',
];

const CATEGORY_COLOR_HEX: Record<CountryCategoryKey, string> = {
  together: '#FFD700',
  amir: '#EF4444',
  vlada: '#3B82F6',
  separate: '#22C55E',
  wish: '#EC4899',
};

const CATEGORY_LABELS: Record<CountryCategoryKey, string> = {
  together: "Together",
  amir: 'Amir',
  vlada: 'Vlada',
  separate: 'Both (separate trips)',
  wish: 'Wish list',
};

const FALLBACK_COUNTRY_GROUPS: CountryGroups = {
  together: ['Germany', 'Vietnam', 'Thailand', 'Malaysia', 'Argentina', 'Indonesia'],
  amir: ['Iran', 'Georgia', 'Japan', 'UAE', 'Qatar', 'Monaco', 'Vatican City'],
  vlada: [
    'China',
    'Ukraine',
    'Russia',
    'Canada',
    'United States',
    'Guatemala',
    'Morocco',
    'Spain',
    'Potugal',
    'UK',
    'Ireland',
    'Sweden',
    'Nepal',
    'Cambodia',
    'Hong Kong',
    'Laos',
  ],
  separate: ['France', 'Poland', 'Italy', 'Turkey', 'Singapore', 'South Korea'],
  wish: ['Iceland'],
};

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  Potugal: 'Portugal',
  Turkey: 'Türkiye',
  UAE: 'United Arab Emirates',
  UK: 'United Kingdom',
  'Viet Nam': 'Vietnam',
  Laos: "Lao People's Democratic Republic",
};

const COUNTRY_ID_BY_NAME: Record<string, string> = {
  Argentina: 'AR',
  Cambodia: 'KH',
  Canada: 'CA',
  China: 'CN',
  France: 'FR',
  Georgia: 'GE',
  Germany: 'DE',
  Guatemala: 'GT',
  'Hong Kong': 'HK',
  Iceland: 'IS',
  Indonesia: 'ID',
  Iran: 'IR',
  Ireland: 'IE',
  Italy: 'IT',
  Japan: 'JP',
  "Lao People's Democratic Republic": 'LA',
  Malaysia: 'MY',
  Monaco: 'MC',
  Morocco: 'MA',
  Nepal: 'NP',
  Poland: 'PL',
  Portugal: 'PT',
  Qatar: 'QA',
  Russia: 'RU',
  Singapore: 'SG',
  'South Korea': 'KR',
  Spain: 'ES',
  Sweden: 'SE',
  Thailand: 'TH',
  Türkiye: 'TR',
  Ukraine: 'UA',
  'United Arab Emirates': 'AE',
  'United Kingdom': 'GB',
  'United States': 'US',
  'Vatican City': 'VA',
  Vietnam: 'VN',
};

const normalizeCountryName = (countryName: string) => {
  const normalized = countryName.trim().replace(/\s+/g, ' ');
  return COUNTRY_NAME_ALIASES[normalized] ?? normalized;
};

const toCountryGroups = (groups?: Partial<CountryGroups>): CountryGroups => {
  const merged: CountryGroups = {
    together: [...FALLBACK_COUNTRY_GROUPS.together],
    amir: [...FALLBACK_COUNTRY_GROUPS.amir],
    vlada: [...FALLBACK_COUNTRY_GROUPS.vlada],
    separate: [...FALLBACK_COUNTRY_GROUPS.separate],
    wish: [...FALLBACK_COUNTRY_GROUPS.wish],
  };

  if (!groups) {
    return merged;
  }

  for (const category of CATEGORY_ORDER) {
    const values = groups[category];
    if (!Array.isArray(values)) {
      continue;
    }

    merged[category] = Array.from(
      new Set(
        values
          .map((value) => (typeof value === 'string' ? value.trim() : ''))
          .filter((value) => value.length > 0)
      )
    );
  }

  return merged;
};

const hexToColorValue = (hex: string) => Number.parseInt(hex.replace('#', ''), 16);

export default function CountryQuestMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTripSlug, setActiveTripSlug] = useState<string | null>(null);
  const [countryGroups, setCountryGroups] = useState<CountryGroups>(FALLBACK_COUNTRY_GROUPS);

  const activeTrip: Trip | null = useMemo(
    () => (activeTripSlug ? tripsBySlug.get(activeTripSlug) ?? null : null),
    [activeTripSlug]
  );

  useEffect(() => {
    let cancelled = false;

    const loadCountryGroups = async () => {
      try {
        const response = await fetch('/api/country-colors', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as CountryColorsResponse;
        if (!cancelled) {
          setCountryGroups(toCountryGroups(payload.countryGroups));
        }
      } catch {
        if (!cancelled) {
          setCountryGroups(FALLBACK_COUNTRY_GROUPS);
        }
      }
    };

    void loadCountryGroups();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let disposed = false;
    let disposeRoot: (() => void) | undefined;

    (async () => {
      const [am5, am5map, AnimatedTheme, worldLowModule] = await Promise.all([
        import('@amcharts/amcharts5'),
        import('@amcharts/amcharts5/map'),
        import('@amcharts/amcharts5/themes/Animated'),
        import('@amcharts/amcharts5-geodata/json/worldLow'),
      ]);

      if (disposed || !containerRef.current) {
        return;
      }

      const worldLow = worldLowModule.default as WorldGeoJson;
      const worldLowGeoJSON = worldLowModule.default as unknown as FeatureCollection<
        Geometry,
        GeoJsonProperties
      >;
      const root = am5.Root.new(containerRef.current);
      root.setThemes([AnimatedTheme.default.new(root)]);
      root._logo?.dispose();

      const chart = root.container.children.push(
        am5map.MapChart.new(root, {
          homeGeoPoint: { latitude: 20, longitude: 0 },
          homeZoomLevel: 1,
          maxZoomLevel: 12,
          panX: 'translateX',
          panY: 'translateY',
          projection: am5map.geoNaturalEarth1(),
          wheelX: 'none',
          wheelY: 'zoom',
        })
      );

      const zoomControl = am5map.ZoomControl.new(root, {});
      chart.set('zoomControl', zoomControl);

      const darkFill = am5.color(0x0e1625);
      const darkStroke = am5.color(0x3d4656);

      const countryIdByName = new Map<string, string>();
      for (const feature of worldLow.features ?? []) {
        const name = feature.properties?.name;
        const id = feature.id;
        if (!name || !id) {
          continue;
        }

        countryIdByName.set(normalizeCountryName(name).toLowerCase(), String(id).toUpperCase());
      }

      const countryCategoryById = new Map<string, CountryCategoryKey>();
      for (const category of CATEGORY_ORDER) {
        for (const countryName of countryGroups[category]) {
          const normalizedName = normalizeCountryName(countryName);
          const normalizedKey = normalizedName.toLowerCase();
          const countryId =
            COUNTRY_ID_BY_NAME[normalizedName] ?? countryIdByName.get(normalizedKey);
          const upperCountryId = countryId?.toUpperCase();

          if (!upperCountryId || countryCategoryById.has(upperCountryId)) {
            continue;
          }

          countryCategoryById.set(upperCountryId, category);
        }
      }

      const polygonSeries = chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          exclude: ['AQ'],
          geoJSON: worldLowGeoJSON,
        })
      );

      const polygonTemplate = polygonSeries.mapPolygons.template;
      polygonTemplate.setAll({
        cursorOverStyle: 'pointer',
        fill: darkFill,
        interactive: true,
        stroke: darkStroke,
        strokeWidth: 0.8,
        templateField: 'polygonSettings',
        tooltipText: '{name}',
      });

      polygonTemplate.states.create('hover', { fill: am5.color(0x1f2937) });

      polygonSeries.data.setAll(
        Array.from(countryCategoryById.entries()).map(([id, category]) => {
          const fill = am5.color(hexToColorValue(CATEGORY_COLOR_HEX[category]));
          return {
            id,
            polygonSettings: {
              fill,
              stroke: fill,
              strokeWidth: 1.1,
            },
          };
        })
      );

      const citySeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
      citySeries.bullets.push((bulletRoot, dataItem) => {
        const markerDataItem = dataItem as unknown as {
          dataContext?: TripPointDatum;
        };

        const markerContainer = am5.Container.new(bulletRoot, {
          centerX: am5.p50,
          centerY: am5.p100,
          cursorOverStyle: 'pointer',
          interactive: true,
          tooltipText: '{city}, {country}',
        });

        markerContainer.children.push(
          am5.Circle.new(bulletRoot, {
            centerX: am5.p50,
            centerY: am5.p100,
            fill: am5.color(0xffd700),
            opacity: 0.15,
            radius: 5,
            y: -1,
          })
        );

        markerContainer.children.push(
          am5.Rectangle.new(bulletRoot, {
            centerX: am5.p50,
            centerY: am5.p100,
            fill: am5.color(0xe2e8f0),
            height: 8,
            opacity: 0.8,
            width: 1,
            y: -1,
          })
        );

        markerContainer.children.push(
          am5.RoundedRectangle.new(bulletRoot, {
            cornerRadiusBL: 1,
            cornerRadiusBR: 1,
            cornerRadiusTL: 1,
            cornerRadiusTR: 1,
            fill: am5.color(0xffd700),
            height: 5,
            opacity: 0.9,
            stroke: am5.color(0x5b3b00),
            strokeWidth: 0.7,
            width: 7,
            x: 0,
            y: -9,
          })
        );

        markerContainer.children.push(
          am5.Rectangle.new(bulletRoot, {
            fill: am5.color(0x8b5e00),
            height: 1,
            opacity: 0.55,
            width: 7,
            x: 0,
            y: -7,
          })
        );

        markerContainer.events.on('click', () => {
          const context = markerDataItem.dataContext;
          if (context?.slug) {
            setActiveTripSlug(context.slug);
          }
        });

        return am5.Bullet.new(bulletRoot, { sprite: markerContainer });
      });

      citySeries.data.setAll(
        trips.map((trip) => ({
          city: trip.city,
          country: trip.country,
          geometry: {
            coordinates: trip.coordinates,
            type: 'Point',
          },
          slug: trip.slug,
        }))
      );

      chart.appear(700, 100);
      disposeRoot = () => root.dispose();
    })();

    return () => {
      disposed = true;
      disposeRoot?.();
    };
  }, [countryGroups]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#080f1d] text-white">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.08),rgba(8,15,29,0.95)_50%)]" />
      <div className="relative z-10 h-full w-full" ref={containerRef} />

      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-2xl border border-white/20 bg-black/60 px-4 py-3 backdrop-blur sm:left-6 sm:top-6">
        <p className="text-[10px] uppercase tracking-[0.32em] text-amber-200">Memory Lane</p>
        <p className="mt-1 text-sm text-slate-100">Country colors from your sheet</p>
        <div className="mt-2 space-y-1">
          {CATEGORY_ORDER.map((category) => (
            <p className="flex items-center gap-2 text-xs text-slate-200" key={category}>
              <span
                className="inline-block h-2.5 w-2.5 rounded-full border border-white/30"
                style={{ backgroundColor: CATEGORY_COLOR_HEX[category] }}
              />
              <span>{CATEGORY_LABELS[category]}</span>
            </p>
          ))}
        </div>
      </div>

      {activeTrip && (
        <aside className="absolute bottom-4 left-4 right-4 z-30 overflow-hidden rounded-2xl border border-amber-200/30 bg-slate-950/90 shadow-[0_24px_48px_rgba(0,0,0,0.45)] backdrop-blur sm:bottom-6 sm:left-auto sm:right-6 sm:top-6 sm:w-[360px]">
          <div className="relative h-48">
            <Image
              alt={`${activeTrip.city} preview`}
              className="object-cover"
              fill
              sizes="360px"
              src={activeTrip.previewImage}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <button
              aria-label="Close city preview"
              className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs text-white"
              onClick={() => setActiveTripSlug(null)}
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
            <p className="text-sm text-slate-300">Open this trip&apos;s full gallery and cloud links.</p>
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
