'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

import {
  formatPosterThemeLabel,
  MAP_TO_POSTER_ENTRIES,
  MAP_TO_POSTER_THEMES,
  type PosterEntry,
} from '@/data/maptoposter';
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

const uniqueSortedValues = (values: string[]) =>
  Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));

export default function CountryQuestMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTripSlug, setActiveTripSlug] = useState<string | null>(null);
  const [countryGroups, setCountryGroups] = useState<CountryGroups>(FALLBACK_COUNTRY_GROUPS);
  const [isPosterPanelOpen, setIsPosterPanelOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [createdPosterUrl, setCreatedPosterUrl] = useState<string | null>(null);
  const [createdPosterLabel, setCreatedPosterLabel] = useState<string>('');
  const [isCreatingPoster, setIsCreatingPoster] = useState(false);
  const [posterError, setPosterError] = useState<string | null>(null);

  const activeTrip: Trip | null = useMemo(
    () => (activeTripSlug ? tripsBySlug.get(activeTripSlug) ?? null : null),
    [activeTripSlug]
  );

  const posterCountries = useMemo(
    () => uniqueSortedValues(MAP_TO_POSTER_ENTRIES.map((entry) => entry.country)),
    []
  );

  const posterCities = useMemo(() => {
    if (!selectedCountry) {
      return [] as string[];
    }
    return uniqueSortedValues(
      MAP_TO_POSTER_ENTRIES.filter((entry) => entry.country === selectedCountry).map(
        (entry) => entry.city
      )
    );
  }, [selectedCountry]);

  const posterThemes = useMemo(() => {
    if (!selectedCountry || !selectedCity) {
      return [] as string[];
    }

    const availableThemes = MAP_TO_POSTER_ENTRIES.filter(
      (entry) => entry.country === selectedCountry && entry.city === selectedCity
    ).map((entry) => entry.theme);

    return uniqueSortedValues(MAP_TO_POSTER_THEMES.filter((theme) => availableThemes.includes(theme)));
  }, [selectedCity, selectedCountry]);

  const selectedPosterEntry: PosterEntry | null = useMemo(
    () =>
      MAP_TO_POSTER_ENTRIES.find(
        (entry) =>
          entry.country === selectedCountry &&
          entry.city === selectedCity &&
          entry.theme === selectedTheme
      ) ?? null,
    [selectedCity, selectedCountry, selectedTheme]
  );

  const selectedPosterUrl = useMemo(
    () =>
      selectedPosterEntry
        ? `/api/poster-image?file=${encodeURIComponent(selectedPosterEntry.file)}`
        : null,
    [selectedPosterEntry]
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
    if (posterCountries.length === 0) {
      return;
    }
    if (!posterCountries.includes(selectedCountry)) {
      setSelectedCountry(posterCountries[0]);
    }
  }, [posterCountries, selectedCountry]);

  useEffect(() => {
    if (posterCities.length === 0) {
      setSelectedCity('');
      return;
    }
    if (!posterCities.includes(selectedCity)) {
      setSelectedCity(posterCities[0]);
    }
  }, [posterCities, selectedCity]);

  useEffect(() => {
    if (posterThemes.length === 0) {
      setSelectedTheme('');
      return;
    }
    if (!posterThemes.includes(selectedTheme)) {
      setSelectedTheme(posterThemes[0]);
    }
  }, [posterThemes, selectedTheme]);

  const handleCreatePoster = async () => {
    if (!selectedPosterEntry || !selectedPosterUrl || isCreatingPoster) {
      return;
    }

    setPosterError(null);
    setIsCreatingPoster(true);

    try {
      setCreatedPosterUrl(selectedPosterUrl);
      setCreatedPosterLabel(
        `${selectedPosterEntry.city}, ${selectedPosterEntry.country} · ${formatPosterThemeLabel(selectedPosterEntry.theme)}`
      );

      const response = await fetch(selectedPosterUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Poster could not be downloaded.');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${selectedPosterEntry.city.toLowerCase().replace(/\s+/g, '-')}_${selectedPosterEntry.theme}_poster.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);
    } catch {
      setPosterError('Could not create/download this poster right now. Please try again.');
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
        <aside className="absolute right-4 top-16 z-40 w-[min(92vw,360px)] space-y-3 rounded-2xl border border-white/20 bg-[#0a1019e6] p-4 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur sm:right-6 sm:top-20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-300">MapToPoster</p>
              <p className="mt-1 text-sm text-white">Country · City · Theme</p>
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
              onChange={(event) => setSelectedCountry(event.target.value)}
              value={selectedCountry}
            >
              {posterCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-[0.14em] text-slate-300" htmlFor="poster-city">
              City
            </label>
            <select
              className="w-full rounded-lg border border-white/15 bg-black/45 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
              id="poster-city"
              onChange={(event) => setSelectedCity(event.target.value)}
              value={selectedCity}
            >
              {posterCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-[0.14em] text-slate-300" htmlFor="poster-theme">
              Theme
            </label>
            <select
              className="w-full rounded-lg border border-white/15 bg-black/45 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
              id="poster-theme"
              onChange={(event) => setSelectedTheme(event.target.value)}
              value={selectedTheme}
            >
              {posterThemes.map((theme) => (
                <option key={theme} value={theme}>
                  {formatPosterThemeLabel(theme)}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/15 bg-black/30">
            {selectedPosterUrl ? (
              <Image
                alt="Poster live preview"
                className="h-[190px] w-full object-cover"
                height={1600}
                src={selectedPosterUrl}
                unoptimized
                width={1200}
              />
            ) : (
              <div className="flex h-[190px] items-center justify-center px-4 text-center text-sm text-slate-300">
                Choose a country, city, and theme to preview.
              </div>
            )}
          </div>

          <button
            className="w-full rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm text-amber-100 transition hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedPosterEntry || isCreatingPoster}
            onClick={handleCreatePoster}
            type="button"
          >
            {isCreatingPoster ? 'Creating...' : 'Create'}
          </button>

          {posterError && <p className="text-xs text-rose-300">{posterError}</p>}

          {createdPosterUrl && (
            <div className="space-y-2 rounded-xl border border-white/15 bg-black/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Created</p>
              <p className="text-xs text-slate-200">{createdPosterLabel}</p>
              <Image
                alt={createdPosterLabel || 'Created poster'}
                className="h-[190px] w-full rounded-lg object-cover"
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
