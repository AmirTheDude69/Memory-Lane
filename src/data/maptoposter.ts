export type PosterEntry = {
  city: string;
  country: string;
  file: string;
  theme: string;
};

export const MAP_TO_POSTER_THEMES = [
  'autumn',
  'blueprint',
  'contrast_zones',
  'copper_patina',
  'emerald',
  'forest',
  'gradient_roads',
  'japanese_ink',
  'midnight_blue',
  'monochrome_blue',
  'neon_cyberpunk',
  'noir',
  'ocean',
  'pastel_dream',
  'sunset',
  'terracotta',
  'warm_beige',
] as const;

export const MAP_TO_POSTER_ENTRIES: PosterEntry[] = [
  {
    city: 'Amsterdam',
    country: 'Netherlands',
    file: 'amsterdam_ocean_20260121_120007.png',
    theme: 'ocean',
  },
  {
    city: 'Barcelona',
    country: 'Spain',
    file: 'barcelona_warm_beige_20260118_140048.png',
    theme: 'warm_beige',
  },
  {
    city: 'Budapest',
    country: 'Hungary',
    file: 'budapest_copper_patina_20260118_151213.png',
    theme: 'copper_patina',
  },
  {
    city: 'Dubai',
    country: 'UAE',
    file: 'dubai_midnight_blue_20260118_140807.png',
    theme: 'midnight_blue',
  },
  {
    city: 'London',
    country: 'UK',
    file: 'london_noir_20260118_150259.png',
    theme: 'noir',
  },
  {
    city: 'Marrakech',
    country: 'Morocco',
    file: 'marrakech_terracotta_20260118_143253.png',
    theme: 'terracotta',
  },
  {
    city: 'Melbourne',
    country: 'Australia',
    file: 'melbourne_forest_20260118_153446.png',
    theme: 'forest',
  },
  {
    city: 'Moscow',
    country: 'Russia',
    file: 'moscow_noir_20260118_141923.png',
    theme: 'noir',
  },
  {
    city: 'Mumbai',
    country: 'India',
    file: 'mumbai_contrast_zones_20260118_145843.png',
    theme: 'contrast_zones',
  },
  {
    city: 'New York',
    country: 'USA',
    file: 'new_york_noir_20260118_135113.png',
    theme: 'noir',
  },
  {
    city: 'Paris',
    country: 'France',
    file: 'paris_pastel_dream_20260118_141126.png',
    theme: 'pastel_dream',
  },
  {
    city: 'Rome',
    country: 'Italy',
    file: 'rome_warm_beige_20260118_143425.png',
    theme: 'warm_beige',
  },
  {
    city: 'San Francisco',
    country: 'USA',
    file: 'san_francisco_sunset_20260118_144726.png',
    theme: 'sunset',
  },
  {
    city: 'Seattle',
    country: 'USA',
    file: 'seattle_emerald_20260124_162244.png',
    theme: 'emerald',
  },
  {
    city: 'Singapore',
    country: 'Singapore',
    file: 'singapore_neon_cyberpunk_20260118_153328.png',
    theme: 'neon_cyberpunk',
  },
  {
    city: 'Sydney',
    country: 'Australia',
    file: 'sydney_ocean_20260118_145507.png',
    theme: 'ocean',
  },
  {
    city: 'Tokyo',
    country: 'Japan',
    file: 'tokyo_japanese_ink_20260118_142446.png',
    theme: 'japanese_ink',
  },
  {
    city: 'Venice',
    country: 'Italy',
    file: 'venice_blueprint_20260120_224440.png',
    theme: 'blueprint',
  },
];

export const formatPosterThemeLabel = (theme: string) =>
  theme
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
