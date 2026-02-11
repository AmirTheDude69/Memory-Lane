'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { countryAliases, trips, tripsBySlug, visitedCountries, type Trip } from '@/data/trips';

type TripPointDatum = {
  city: string;
  country: string;
  geometry: {
    coordinates: [number, number];
    type: 'Point';
  };
  slug: string;
};

const COUNTRY_ID_BY_NAME: Record<string, string> = {
  Argentina: 'AR',
  Germany: 'DE',
  Indonesia: 'ID',
  Malaysia: 'MY',
  Thailand: 'TH',
  Vietnam: 'VN',
  'Viet Nam': 'VN',
};

const normalizeCountryName = (countryName: string) =>
  countryAliases[countryName] ?? countryName;

export default function CountryQuestMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTripSlug, setActiveTripSlug] = useState<string | null>(null);

  const activeTrip: Trip | null = useMemo(
    () => (activeTripSlug ? tripsBySlug.get(activeTripSlug) ?? null : null),
    [activeTripSlug]
  );

  const visitedCountryIds = useMemo(
    () =>
      Array.from(
        new Set(
          visitedCountries
            .map((countryName) => COUNTRY_ID_BY_NAME[normalizeCountryName(countryName)])
            .filter((countryId): countryId is string => Boolean(countryId))
        )
      ),
    []
  );

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

      const worldLow = worldLowModule.default;
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

      const visitedIdSet = new Set(visitedCountryIds);
      const darkFill = am5.color(0x0e1625);
      const darkStroke = am5.color(0x3d4656);
      const goldFill = am5.color(0xffd700);
      const goldStroke = am5.color(0xb8860b);

      const goldTexturePattern = am5.LinePattern.new(root, {
        color: goldStroke,
        gap: 4,
        height: 8,
        rotation: 35,
        strokeWidth: 2,
        width: 8,
      });

      const polygonSeries = chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          exclude: ['AQ'],
          geoJSON: worldLow,
        })
      );

      const polygonTemplate = polygonSeries.mapPolygons.template;
      polygonTemplate.setAll({
        cursorOverStyle: 'pointer',
        fill: darkFill,
        interactive: true,
        stroke: darkStroke,
        strokeWidth: 0.8,
        tooltipText: '{name}',
      });
      polygonTemplate.states.create('hover', { fill: am5.color(0x1a2638) });

      polygonTemplate.adapters.add('fill', (_fill, target) => {
        const id = String(
          (
            target.dataItem?.dataContext as
              | { id?: string }
              | undefined
          )?.id ?? ''
        ).toUpperCase();
        return visitedIdSet.has(id) ? goldFill : darkFill;
      });

      polygonTemplate.adapters.add('fillPattern', (_pattern, target) => {
        const id = String(
          (
            target.dataItem?.dataContext as
              | { id?: string }
              | undefined
          )?.id ?? ''
        ).toUpperCase();
        return visitedIdSet.has(id) ? goldTexturePattern : undefined;
      });

      polygonTemplate.adapters.add('stroke', (_stroke, target) => {
        const id = String(
          (
            target.dataItem?.dataContext as
              | { id?: string }
              | undefined
          )?.id ?? ''
        ).toUpperCase();
        return visitedIdSet.has(id) ? goldStroke : darkStroke;
      });

      const citySeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
      citySeries.bullets.push((bulletRoot, dataItem) => {
        const markerDataItem = dataItem as unknown as {
          dataContext?: TripPointDatum;
        };
        const markerContainer = am5.Container.new(bulletRoot, {});

        markerContainer.children.push(
          am5.Circle.new(bulletRoot, {
            fill: am5.color(0xffd700),
            opacity: 0.25,
            radius: 12,
          })
        );

        const markerDot = markerContainer.children.push(
          am5.Circle.new(bulletRoot, {
            cursorOverStyle: 'pointer',
            fill: am5.color(0xffd700),
            radius: 5,
            stroke: am5.color(0x5b3b00),
            strokeWidth: 1.5,
            tooltipText: '{city}, {country}',
          })
        );

        markerDot.events.on('click', () => {
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
  }, [visitedCountryIds]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#080f1d] text-white">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.1),rgba(8,15,29,0.95)_50%)]" />
      <div className="relative z-10 h-full w-full" ref={containerRef} />

      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-2xl border border-white/20 bg-black/60 px-4 py-3 backdrop-blur sm:left-6 sm:top-6">
        <p className="text-[10px] uppercase tracking-[0.32em] text-amber-200">Memory Lane</p>
        <p className="mt-1 text-sm text-slate-100">CountryQuest map mode</p>
        <p className="mt-1 text-xs text-slate-300">Gold countries: Germany, Vietnam, Thailand, Malaysia, Argentina, Indonesia</p>
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
            <p className="text-sm text-slate-300">Open this trip’s full gallery and cloud links.</p>
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
