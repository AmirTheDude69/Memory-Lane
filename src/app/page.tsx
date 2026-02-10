import FFMap from '@/components/FFMap';
import { trips, visitedCountries } from '@/data/trips';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050a16] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        <header className="mb-8 rounded-3xl border border-amber-200/25 bg-[linear-gradient(135deg,rgba(255,215,0,0.08),rgba(8,17,37,0.95)_65%)] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.32em] text-amber-200">Memory Lane</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Our Shared Travel Map
          </h1>
          <p className="mt-4 max-w-3xl text-base text-slate-300">
            Every gold country is a place we explored together. Click any city preview to open a full Dome Gallery
            for that trip.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-amber-300/35 bg-amber-300/10 px-4 py-2 text-amber-100">
              Countries visited: {visitedCountries.length}
            </span>
            <span className="rounded-full border border-slate-400/30 bg-slate-900/70 px-4 py-2 text-slate-200">
              Trips captured: {trips.length}
            </span>
          </div>
        </header>

        <FFMap radius="26px" variant="Dark Mode" zoom={1.15} />
      </div>
    </div>
  );
}
