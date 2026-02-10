'use client';

import dynamic from 'next/dynamic';
import type { CSSProperties, ComponentType } from 'react';

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
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <FramerFFMap
        className="memory-lane-framer-map"
        location="20,0"
        radius="0px"
        style={{ height: '100vh', width: '100vw' }}
        variant="Dark Mode"
        zoom={2}
      />
    </main>
  );
}
