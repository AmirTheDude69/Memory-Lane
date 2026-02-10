'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import type { CSSProperties, ComponentType } from 'react';

import GoldCountryOverlay from '@/components/GoldCountryOverlay';
import {
  HOME_FIXED_CAMERA,
  HOME_OVERLAY_CALIBRATION,
} from '@/data/mapOverlayConfig';
import { visitedCountries } from '@/data/trips';

type FramerFFMapProps = {
  className?: string;
  location?: string;
  radius?: string;
  style?: CSSProperties;
  variant?: string;
  zoom?: number;
};

const FramerFFMap = dynamic(
  () => import('@/components/FramerFFMap') as Promise<{ default: ComponentType<FramerFFMapProps> }>,
  { ssr: false }
);

export default function FullScreenFramerMap() {
  const [isLocked, setIsLocked] = useState(true);
  const [mapInstanceKey, setMapInstanceKey] = useState(0);

  const toggleMapLock = useCallback(() => {
    setIsLocked((previous) => {
      const nextLocked = !previous;

      if (nextLocked) {
        setMapInstanceKey((previousKey) => previousKey + 1);
      }

      return nextLocked;
    });
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <FramerFFMap
        className="memory-lane-framer-map"
        key={mapInstanceKey}
        location={HOME_FIXED_CAMERA.location}
        radius="0px"
        style={{
          height: '100vh',
          pointerEvents: isLocked ? 'none' : 'auto',
          width: '100vw',
        }}
        variant="Dark Mode"
        zoom={HOME_FIXED_CAMERA.zoom}
      />

      <GoldCountryOverlay
        calibration={HOME_OVERLAY_CALIBRATION}
        location={HOME_FIXED_CAMERA.location}
        visible={isLocked}
        visitedCountries={visitedCountries}
        zoom={HOME_FIXED_CAMERA.zoom}
      />

      <section className="fixed left-4 top-4 z-[2147483647] rounded-2xl border border-white/20 bg-black/65 p-3 backdrop-blur sm:left-6 sm:top-6">
        <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200">Map Mode</p>
        <button
          className="mt-2 inline-flex items-center rounded-full border border-amber-200/35 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-300/20"
          onClick={toggleMapLock}
          type="button"
        >
          {isLocked ? 'Unlock Map' : 'Lock + Reset Map'}
        </button>
        <p className="mt-2 max-w-[220px] text-xs text-slate-200/90">
          {isLocked
            ? 'Locked: gold country overlay is aligned and visible.'
            : 'Unlocked: pan/zoom enabled, overlay hidden until you lock again.'}
        </p>
      </section>
    </main>
  );
}
