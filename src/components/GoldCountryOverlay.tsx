'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  Feature,
  GeometryObject,
  MultiPolygon,
  Polygon,
  Position,
} from 'geojson';
import { feature as topojsonFeature } from 'topojson-client';
import type {
  GeometryObject as TopologyGeometryObject,
  Topology,
} from 'topojson-specification';

import type { OverlayCalibration } from '@/data/mapOverlayConfig';
import { countryAliases } from '@/data/trips';
import { createWebMercatorProjector } from '@/lib/webMercator';

type CountryGeometry = Polygon | MultiPolygon;

type CountryFeature = {
  geometry: CountryGeometry;
  id: string;
  normalizedName: string;
};

export type GoldCountryOverlayProps = {
  calibration: OverlayCalibration;
  location: string;
  visible: boolean;
  visitedCountries: string[];
  zoom: number;
};

let countriesPromise: Promise<CountryFeature[]> | null = null;

const projectRingToPath = (
  ring: Position[],
  project: ReturnType<typeof createWebMercatorProjector>
) => {
  const points = ring
    .filter((position) => position.length >= 2)
    .map(([longitude, latitude]) => project(longitude, latitude));

  if (points.length < 3) return '';

  const [firstPoint, ...restPoints] = points;
  const first = `${firstPoint.x.toFixed(2)} ${firstPoint.y.toFixed(2)}`;
  const rest = restPoints
    .map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  return `M ${first} ${rest} Z`;
};

const polygonToPath = (
  coordinates: Position[][],
  project: ReturnType<typeof createWebMercatorProjector>
) =>
  coordinates
    .map((ring) => projectRingToPath(ring, project))
    .filter(Boolean)
    .join(' ');

const geometryToPath = (
  geometry: CountryGeometry,
  project: ReturnType<typeof createWebMercatorProjector>
) => {
  if (geometry.type === 'Polygon') {
    return polygonToPath(geometry.coordinates, project);
  }

  return geometry.coordinates
    .map((polygonCoordinates) => polygonToPath(polygonCoordinates, project))
    .filter(Boolean)
    .join(' ');
};

const loadCountryFeatures = async (): Promise<CountryFeature[]> => {
  if (!countriesPromise) {
    countriesPromise = (async () => {
      const response = await fetch('/data/countries-110m.json');
      if (!response.ok) {
        throw new Error(`Failed to load country geometry: ${response.status}`);
      }

      const topology = (await response.json()) as Topology;
      const objectEntries = Object.entries(topology.objects ?? {});
      if (objectEntries.length === 0) return [];

      const objectKey = 'countries' in topology.objects ? 'countries' : objectEntries[0][0];
      const topologyObject = topology.objects[objectKey] as TopologyGeometryObject;

      const converted = topojsonFeature(topology, topologyObject);
      const features = (
        converted.type === 'FeatureCollection'
          ? converted.features
          : [converted]
      ) as Array<Feature<GeometryObject>>;

      return features
        .filter(
          (feature): feature is Feature<CountryGeometry> =>
            feature.geometry?.type === 'Polygon' ||
            feature.geometry?.type === 'MultiPolygon'
        )
        .map((feature, index) => {
          const rawName = String(feature.properties?.name ?? feature.id ?? `country-${index}`);
          const normalizedName = countryAliases[rawName] ?? rawName;

          return {
            geometry: feature.geometry,
            id: String(feature.id ?? rawName ?? index),
            normalizedName,
          };
        });
    })();
  }

  return countriesPromise;
};

export default function GoldCountryOverlay({
  calibration,
  location,
  visible,
  visitedCountries,
  zoom,
}: GoldCountryOverlayProps) {
  const [countryFeatures, setCountryFeatures] = useState<CountryFeature[]>([]);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [viewport, setViewport] = useState({ height: 0, width: 0 });

  useEffect(() => {
    let active = true;

    loadCountryFeatures()
      .then((features) => {
        if (active) {
          setCountryFeatures(features);
        }
      })
      .catch(() => {
        if (active) {
          setHasLoadError(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  const normalizedVisitedCountries = useMemo(
    () => new Set(visitedCountries.map((country) => country.toLowerCase())),
    [visitedCountries]
  );

  const countryPaths = useMemo(() => {
    if (!visible || viewport.width === 0 || viewport.height === 0) return [];

    const project = createWebMercatorProjector({
      calibration,
      location,
      viewportHeight: viewport.height,
      viewportWidth: viewport.width,
      zoom,
    });

    return countryFeatures
      .filter((country) =>
        normalizedVisitedCountries.has(country.normalizedName.toLowerCase())
      )
      .map((country) => ({
        id: country.id,
        path: geometryToPath(country.geometry, project),
      }))
      .filter((countryPath) => countryPath.path.length > 0);
  }, [
    calibration,
    countryFeatures,
    location,
    normalizedVisitedCountries,
    viewport.height,
    viewport.width,
    visible,
    zoom,
  ]);

  if (!visible || hasLoadError || countryPaths.length === 0) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 h-full w-full"
      preserveAspectRatio="none"
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
    >
      <defs>
        <linearGradient id="ml-overlay-gold-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF7B0" />
          <stop offset="40%" stopColor="#FFD700" />
          <stop offset="70%" stopColor="#D8AA1B" />
          <stop offset="100%" stopColor="#8F6815" />
        </linearGradient>

        <pattern
          height="14"
          id="ml-overlay-gold-texture"
          patternTransform="rotate(22)"
          patternUnits="userSpaceOnUse"
          width="14"
        >
          <rect fill="url(#ml-overlay-gold-gradient)" height="14" width="14" x="0" y="0" />
          <path d="M 0 4 L 14 4" stroke="rgba(255,255,255,0.34)" strokeWidth="0.7" />
          <path d="M 0 10 L 14 10" stroke="rgba(82,53,8,0.34)" strokeWidth="0.8" />
          <circle cx="3" cy="5" fill="rgba(255,255,255,0.24)" r="1" />
          <circle cx="10" cy="9" fill="rgba(88,62,10,0.36)" r="1" />
        </pattern>

        <filter id="ml-overlay-gold-noise">
          <feTurbulence baseFrequency="0.9" numOctaves="2" result="noise" seed="7" type="fractalNoise" />
          <feColorMatrix
            in="noise"
            result="grain"
            type="matrix"
            values="0 0 0 0 0.16 0 0 0 0 0.12 0 0 0 0 0.02 0 0 0 0.66 0"
          />
          <feBlend in="SourceGraphic" in2="grain" mode="multiply" />
        </filter>
      </defs>

      {countryPaths.map((countryPath) => (
        <path
          d={countryPath.path}
          fill="url(#ml-overlay-gold-texture)"
          fillRule="evenodd"
          filter="url(#ml-overlay-gold-noise)"
          key={countryPath.id}
          stroke="#B8860B"
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}
