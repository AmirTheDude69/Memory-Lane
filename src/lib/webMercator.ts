import type { OverlayCalibration } from '@/data/mapOverlayConfig';

const TILE_SIZE = 256;
const MAX_LATITUDE = 85.05112878;

export type PixelPoint = {
  x: number;
  y: number;
};

export type ParsedLocation = {
  latitude: number;
  longitude: number;
};

export type ProjectorOptions = {
  calibration: OverlayCalibration;
  location: string;
  viewportHeight: number;
  viewportWidth: number;
  zoom: number;
};

const clampLatitude = (latitude: number) =>
  Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude));

const parseFloatSafe = (value: string, fallback: number) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const parseFramerLocation = (location: string): ParsedLocation => {
  const [latitudeRaw = '20', longitudeRaw = '0'] = location
    .split(',')
    .map((segment) => segment.trim());

  return {
    latitude: parseFloatSafe(latitudeRaw, 20),
    longitude: parseFloatSafe(longitudeRaw, 0),
  };
};

const lngToWorldX = (longitude: number, worldSize: number) =>
  ((longitude + 180) / 360) * worldSize;

const latToWorldY = (latitude: number, worldSize: number) => {
  const clamped = clampLatitude(latitude);
  const sin = Math.sin((clamped * Math.PI) / 180);
  return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize;
};

const wrapWorldDelta = (delta: number, worldSize: number) => {
  if (delta > worldSize / 2) return delta - worldSize;
  if (delta < -worldSize / 2) return delta + worldSize;
  return delta;
};

export const createWebMercatorProjector = ({
  calibration,
  location,
  viewportHeight,
  viewportWidth,
  zoom,
}: ProjectorOptions) => {
  const worldSize = TILE_SIZE * 2 ** zoom;
  const { latitude: centerLatitude, longitude: centerLongitude } =
    parseFramerLocation(location);

  const centerWorldX = lngToWorldX(centerLongitude, worldSize);
  const centerWorldY = latToWorldY(centerLatitude, worldSize);

  return (longitude: number, latitude: number): PixelPoint => {
    const worldX = lngToWorldX(longitude, worldSize);
    const worldY = latToWorldY(latitude, worldSize);

    const deltaX = wrapWorldDelta(worldX - centerWorldX, worldSize);
    const deltaY = worldY - centerWorldY;

    return {
      x:
        deltaX * calibration.scaleMultiplier +
        viewportWidth / 2 +
        calibration.offsetX,
      y:
        deltaY * calibration.scaleMultiplier +
        viewportHeight / 2 +
        calibration.offsetY,
    };
  };
};
