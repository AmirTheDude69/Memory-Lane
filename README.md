# Memory Lane

Memory Lane is a Next.js app with:

- An interactive world map
- Textured gold-highlighted countries that we visited together
- City preview cards for each trip
- A dedicated city gallery page powered by React Bits DomeGallery
- Google Drive + iCloud album links per trip

## Tech Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- Shadcn CLI
- React Bits `DomeGallery`
- `react-simple-maps`

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Where To Put Real Photos

Current gallery and preview images are placeholders under:

- `public/media/<trip-slug>/preview.svg`
- `public/media/<trip-slug>/1.svg` ... `8.svg`

To replace with real photos:

1. Keep the same file names and replace SVGs with `.jpg` or `.png`.
2. Update the paths in `src/data/trips.ts` if file extensions change.
3. Update `driveLink` and `icloudLink` in `src/data/trips.ts` with your real shared links.

## Deploy

This project is configured for Vercel.
