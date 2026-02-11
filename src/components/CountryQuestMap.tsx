'use client';

import { toPng } from 'html-to-image';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  POSTER_THEME_BY_ID,
  POSTER_THEME_IDS,
  type PosterThemeId,
} from '@/data/maptoposter';
import { POSTER_COUNTRIES } from '@/data/posterCountries';
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

type PosterCityOptionsResponse = {
  cities?: string[];
  total?: number;
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
  together: '#EF4444',
  amir: '#FFD700',
  vlada: '#3B82F6',
  separate: '#22C55E',
  wish: '#EC4899',
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

const withUniqueSortedValues = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((left, right) =>
    left.localeCompare(right)
  );

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

    merged[category] = withUniqueSortedValues(
      values.map((value) => (typeof value === 'string' ? value : ''))
    );
  }

  return merged;
};

const hexToColorValue = (hex: string) => Number.parseInt(hex.replace('#', ''), 16);

const labelForTheme = (themeId: PosterThemeId) => POSTER_THEME_BY_ID[themeId].label;

export default function CountryQuestMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const posterPreviewRef = useRef<HTMLDivElement>(null);

  const [activeTripSlug, setActiveTripSlug] = useState<string | null>(null);
  const [countryGroups, setCountryGroups] = useState<CountryGroups>(FALLBACK_COUNTRY_GROUPS);

  const [isPosterPanelOpen, setIsPosterPanelOpen] = useState(false);
  const posterCountries = POSTER_COUNTRIES as unknown as string[];
  const [selectedPosterCountry, setSelectedPosterCountry] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [posterCities, setPosterCities] = useState<string[]>([]);
  const [posterCityTotal, setPosterCityTotal] = useState(0);
  const [selectedPosterCity, setSelectedPosterCity] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState<PosterThemeId>('terracotta');

  const [isCitiesLoading, setIsCitiesLoading] = useState(false);
  const [isCreatingPoster, setIsCreatingPoster] = useState(false);
  const [posterError, setPosterError] = useState<string | null>(null);
  const [createdPosterUrl, setCreatedPosterUrl] = useState<string | null>(null);
  const [createdPosterLabel, setCreatedPosterLabel] = useState('');

  const activeTrip: Trip | null = useMemo(
    () => (activeTripSlug ? tripsBySlug.get(activeTripSlug) ?? null : null),
    [activeTripSlug]
  );

  const selectedPosterTheme = POSTER_THEME_BY_ID[selectedThemeId];
  const cityOptions = useMemo(() => {
    const options = [...posterCities];
    const seen = new Set(options.map((city) => city.toLowerCase()));

    const maybeAdd = (value: string) => {
      const normalized = value.trim();
      if (!normalized) {
        return;
      }

      const key = normalized.toLowerCase();
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      options.unshift(normalized);
    };

    maybeAdd(cityQuery);
    maybeAdd(selectedPosterCity);

    return options;
  }, [cityQuery, posterCities, selectedPosterCity]);

  const posterMapUrl = useMemo(() => {
    if (!selectedPosterCountry || !selectedPosterCity) {
      return null;
    }

    const params = new URLSearchParams({
      city: selectedPosterCity,
      country: selectedPosterCountry,
      size: '1100',
      zoom: '12',
    });

    return `/api/poster-map?${params.toString()}`;
  }, [selectedPosterCity, selectedPosterCountry]);

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
    if (!selectedPosterCountry && posterCountries.length > 0) {
      setSelectedPosterCountry(posterCountries[0]);
    }
  }, [posterCountries, selectedPosterCountry]);

  useEffect(() => {
    if (!isPosterPanelOpen || !selectedPosterCountry) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      const loadPosterCities = async () => {
        setIsCitiesLoading(true);
        setPosterError(null);

        try {
          const params = new URLSearchParams({
            country: selectedPosterCountry,
            limit: '300',
          });

          if (cityQuery.trim().length > 0) {
            params.set('query', cityQuery.trim());
          }

          const response = await fetch(`/api/poster-options?${params.toString()}`, {
            cache: 'no-store',
          });

          if (!response.ok) {
            throw new Error('Could not load city options.');
          }

          const payload = (await response.json()) as PosterCityOptionsResponse;
          const cities = withUniqueSortedValues(payload.cities ?? []);

          if (!cancelled) {
            setPosterCities(cities);
            setPosterCityTotal(payload.total ?? cities.length);
          }
        } catch {
          if (!cancelled) {
            setPosterCities([]);
            setPosterCityTotal(0);
            setPosterError('Could not load cities for that country right now.');
          }
        } finally {
          if (!cancelled) {
            setIsCitiesLoading(false);
          }
        }
      };

      void loadPosterCities();
    }, 260);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cityQuery, isPosterPanelOpen, selectedPosterCountry]);

  useEffect(() => {
    setCreatedPosterUrl(null);
    setCreatedPosterLabel('');
  }, [selectedPosterCity, selectedPosterCountry, selectedThemeId]);

  const handleCreatePoster = async () => {
    if (!posterPreviewRef.current || !selectedPosterCountry || !selectedPosterCity) {
      return;
    }

    setPosterError(null);
    setIsCreatingPoster(true);

    try {
      const dataUrl = await toPng(posterPreviewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const label = `${selectedPosterCity}, ${selectedPosterCountry} · ${labelForTheme(selectedThemeId)}`;
      setCreatedPosterUrl(dataUrl);
      setCreatedPosterLabel(label);

      const anchor = document.createElement('a');
      const safeCity = selectedPosterCity.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const safeCountry = selectedPosterCountry.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      anchor.href = dataUrl;
      anchor.download = `${safeCity}_${safeCountry}_${selectedThemeId}_poster.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      setPosterError('Poster generation failed. Try a different city or try again.');
    } finally {
      setIsCreatingPoster(false);
    }
  };

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
          centerY: am5.p50,
          cursorOverStyle: 'pointer',
          interactive: true,
          tooltipText: '{city}, {country}',
        });

        markerContainer.children.push(
          am5.Circle.new(bulletRoot, {
            centerX: am5.p50,
            centerY: am5.p50,
            fill: am5.color(0x0b1220),
            opacity: 0.45,
            radius: 7,
            stroke: am5.color(0xef4444),
            strokeOpacity: 0.2,
            strokeWidth: 1,
          })
        );

        markerContainer.children.push(
          am5.Label.new(bulletRoot, {
            centerX: am5.p50,
            centerY: am5.p50,
            fill: am5.color(0xef4444),
            fontSize: 10,
            fontWeight: '700',
            text: '❤',
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

      <div className="absolute right-4 top-4 z-40 sm:right-6 sm:top-6">
        <button
          className="rounded-full border border-white/30 bg-black/55 px-4 py-2 text-xs font-medium tracking-[0.16em] text-white backdrop-blur transition hover:bg-black/70"
          onClick={() => {
            setPosterError(null);
            setIsPosterPanelOpen((current) => !current);
          }}
          type="button"
        >
          Create Poster
        </button>
      </div>

      {isPosterPanelOpen && (
        <aside className="absolute right-4 top-16 z-40 max-h-[calc(100vh-6.25rem)] w-[min(92vw,390px)] space-y-3 overflow-y-auto rounded-2xl border border-white/20 bg-[#0a1019e6] p-4 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur sm:right-6 sm:top-20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-300">MapToPoster</p>
              <p className="mt-1 text-sm text-white">Any country, any city, all themes</p>
            </div>
            <button
              aria-label="Close poster creator"
              className="rounded-full border border-white/20 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
              onClick={() => setIsPosterPanelOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-[0.14em] text-slate-300" htmlFor="poster-country">
              Country
            </label>
            <select
              className="w-full rounded-lg border border-white/15 bg-black/45 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
              id="poster-country"
              onChange={(event) => {
                setSelectedPosterCountry(event.target.value);
                setSelectedPosterCity('');
                setCityQuery('');
              }}
              value={selectedPosterCountry}
            >
              {posterCountries.length === 0 && <option value="">No countries available</option>}
              {posterCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-[0.14em] text-slate-300" htmlFor="poster-city-query">
              City Search
            </label>
            <input
              className="w-full rounded-lg border border-white/15 bg-black/45 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400 focus:border-white/40"
              id="poster-city-query"
              onChange={(event) => setCityQuery(event.target.value)}
              placeholder="Type to search cities"
              value={cityQuery}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-[0.14em] text-slate-300" htmlFor="poster-city">
              City
            </label>
            <select
              className="w-full rounded-lg border border-white/15 bg-black/45 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
              disabled={!selectedPosterCountry || isCitiesLoading}
              id="poster-city"
              onChange={(event) => setSelectedPosterCity(event.target.value)}
              value={selectedPosterCity}
            >
              <option value="">
                {isCitiesLoading ? 'Loading cities...' : 'Select city'}
              </option>
              {!isCitiesLoading && cityOptions.length === 0 && <option value="">No matches</option>}
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              {posterCityTotal > posterCities.length
                ? `Showing ${posterCities.length} of ${posterCityTotal} matches. Refine search for more.`
                : `${posterCityTotal} cities available`}
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-[0.14em] text-slate-300" htmlFor="poster-theme">
              Theme
            </label>
            <select
              className="w-full rounded-lg border border-white/15 bg-black/45 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
              id="poster-theme"
              onChange={(event) => setSelectedThemeId(event.target.value as PosterThemeId)}
              value={selectedThemeId}
            >
              {POSTER_THEME_IDS.map((themeId) => (
                <option key={themeId} value={themeId}>
                  {labelForTheme(themeId)}
                </option>
              ))}
            </select>
          </div>

          <button
            className="w-full rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm text-amber-100 transition hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!posterMapUrl || isCreatingPoster}
            onClick={handleCreatePoster}
            type="button"
          >
            {isCreatingPoster ? 'Creating...' : 'Create'}
          </button>

          {!selectedPosterCity && (
            <p className="text-xs text-slate-400">Preview appears after you select a city.</p>
          )}

          {selectedPosterCity && (
            <div
              className="relative h-[170px] overflow-hidden rounded-xl border border-white/15"
              ref={posterPreviewRef}
              style={{
                backgroundColor: selectedPosterTheme.bg,
              }}
            >
              {posterMapUrl && (
                <Image
                  alt="Poster preview map"
                  className="object-cover"
                  fill
                  src={posterMapUrl}
                  style={{
                    filter: 'grayscale(1) contrast(1.24) brightness(1.08)',
                    mixBlendMode: 'multiply',
                    opacity: 0.9,
                  }}
                  unoptimized
                />
              )}

              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, ${selectedPosterTheme.gradientColor}14 0%, ${selectedPosterTheme.bg}D0 78%, ${selectedPosterTheme.bg} 100%)`,
                }}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundColor: selectedPosterTheme.roadSecondary,
                  mixBlendMode: 'soft-light',
                  opacity: 0.35,
                }}
              />

              <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-10">
                <p
                  className="text-[9px] tracking-[0.25em]"
                  style={{
                    color: selectedPosterTheme.text,
                  }}
                >
                  MEMORY LANE
                </p>
                <h3
                  className="mt-1 text-sm font-semibold leading-tight"
                  style={{
                    color: selectedPosterTheme.text,
                  }}
                >
                  {selectedPosterCity}
                </h3>
                <p
                  className="mt-0.5 text-[10px] uppercase tracking-[0.13em]"
                  style={{
                    color: selectedPosterTheme.text,
                  }}
                >
                  {selectedPosterCountry}
                </p>
              </div>
            </div>
          )}

          {posterError && <p className="text-xs text-rose-300">{posterError}</p>}

          {createdPosterUrl && (
            <div className="space-y-2 rounded-xl border border-white/15 bg-black/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Created & downloaded</p>
              <p className="text-xs text-slate-200">{createdPosterLabel}</p>
              <Image
                alt={createdPosterLabel}
                className="h-[220px] w-full rounded-lg object-cover"
                height={1600}
                src={createdPosterUrl}
                unoptimized
                width={1200}
              />
            </div>
          )}
        </aside>
      )}

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
