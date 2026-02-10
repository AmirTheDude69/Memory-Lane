export type MapVariant =
  | "Dark Mode"
  | "Grayscale"
  | "Night Mode"
  | "Duplex"
  | "Monochrome"
  | "Gradient"
  | "Inverted"
  | "Dot Matrix"
  | "The Sweetheart";

export type TripImage = {
  alt: string;
  src: string;
};

export type Trip = {
  city: string;
  coordinates: [number, number];
  country: string;
  driveLink: string;
  galleryImages: TripImage[];
  icloudLink: string;
  previewImage: string;
  slug: string;
};

const tripsSeed = [
  {
    city: "Berlin",
    coordinates: [13.405, 52.52] as [number, number],
    country: "Germany",
    slug: "berlin",
  },
  {
    city: "Cologne",
    coordinates: [6.9603, 50.9375] as [number, number],
    country: "Germany",
    slug: "cologne",
  },
  {
    city: "Phu Quoc",
    coordinates: [103.984, 10.2899] as [number, number],
    country: "Vietnam",
    slug: "phu-quoc",
  },
  {
    city: "Bangkok",
    coordinates: [100.5018, 13.7563] as [number, number],
    country: "Thailand",
    slug: "bangkok",
  },
  {
    city: "Pattaya",
    coordinates: [100.8825, 12.9236] as [number, number],
    country: "Thailand",
    slug: "pattaya",
  },
  {
    city: "Kuala Lumpur",
    coordinates: [101.6869, 3.139] as [number, number],
    country: "Malaysia",
    slug: "kuala-lumpur",
  },
  {
    city: "Buenos Aires",
    coordinates: [-58.3816, -34.6037] as [number, number],
    country: "Argentina",
    slug: "buenos-aires",
  },
  {
    city: "Patagonia",
    coordinates: [-72.2648, -50.3379] as [number, number],
    country: "Argentina",
    slug: "patagonia",
  },
  {
    city: "Bali",
    coordinates: [115.1889, -8.4095] as [number, number],
    country: "Indonesia",
    slug: "bali",
  },
] as const;

const buildGalleryImages = (slug: string, city: string): TripImage[] =>
  Array.from({ length: 8 }, (_, index) => ({
    alt: `${city} trip memory ${index + 1}`,
    src: `/media/${slug}/${index + 1}.svg`,
  }));

export const trips: Trip[] = tripsSeed.map((trip) => ({
  ...trip,
  driveLink: `https://drive.google.com/drive/folders/ADD-${trip.slug.toUpperCase()}-FOLDER-ID`,
  galleryImages: buildGalleryImages(trip.slug, trip.city),
  icloudLink: `https://www.icloud.com/sharedalbum/#ADD-${trip.slug.toUpperCase()}-ALBUM-ID`,
  previewImage: `/media/${trip.slug}/preview.svg`,
}));

export const visitedCountries = Array.from(new Set(trips.map((trip) => trip.country)));

export const tripsBySlug = new Map(trips.map((trip) => [trip.slug, trip]));

export const countryAliases: Record<string, string> = {
  "Viet Nam": "Vietnam",
};

export const mapVariants: MapVariant[] = [
  "Dark Mode",
  "Grayscale",
  "Night Mode",
  "Duplex",
  "Monochrome",
  "Gradient",
  "Inverted",
  "Dot Matrix",
  "The Sweetheart",
];
