import Link from 'next/link';
import { notFound } from 'next/navigation';

import TripDomeGallery from '@/components/TripDomeGallery';
import { trips, tripsBySlug } from '@/data/trips';

type TripPageParams = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return trips.map((trip) => ({ slug: trip.slug }));
}

export default async function TripPage({ params }: TripPageParams) {
  const { slug } = await params;
  const trip = tripsBySlug.get(slug);

  if (!trip) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#050a16] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-amber-200">Memory Lane</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {trip.city}, {trip.country}
            </h1>
            <p className="mt-2 text-slate-300">All memories from this trip, displayed in Dome Gallery mode.</p>
          </div>

          <Link
            className="rounded-full border border-amber-300/40 bg-amber-300/10 px-5 py-2 text-sm text-amber-100 transition hover:bg-amber-300/20"
            href="/"
          >
            Back to world map
          </Link>
        </div>

        <TripDomeGallery trip={trip} />

        <div className="mt-7 rounded-2xl border border-slate-700/70 bg-slate-950/80 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Trip cloud links</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              className="rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm text-sky-200 transition hover:bg-sky-500/20"
              href={trip.driveLink}
              rel="noreferrer"
              target="_blank"
            >
              Google Drive album
            </a>
            <a
              className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200 transition hover:bg-indigo-500/20"
              href={trip.icloudLink}
              rel="noreferrer"
              target="_blank"
            >
              iCloud album
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Replace the placeholder links in <code>src/data/trips.ts</code> with your real shared album URLs.
          </p>
        </div>
      </div>
    </div>
  );
}
