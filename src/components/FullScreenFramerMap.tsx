'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, ComponentType } from 'react';

import { trips } from '@/data/trips';

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

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/70 via-black/30 to-transparent pb-4 pt-20">
        <div className="pointer-events-auto flex gap-3 overflow-x-auto px-4 sm:px-6">
          {trips.map((trip) => (
            <Link href={`/trips/${trip.slug}`} key={trip.slug} className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={trip.previewImage}
                alt={`${trip.city} preview`}
                fill
                sizes="128px"
                className="object-cover opacity-90 transition hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
              <span className="absolute bottom-1 left-2 text-xs font-medium text-white">{trip.city}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
