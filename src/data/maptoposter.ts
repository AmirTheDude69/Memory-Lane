export const POSTER_THEME_IDS = [
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

export type PosterThemeId = (typeof POSTER_THEME_IDS)[number];

export type PosterTheme = {
  bg: string;
  gradientColor: string;
  id: PosterThemeId;
  label: string;
  parks: string;
  roadPrimary: string;
  roadSecondary: string;
  text: string;
  water: string;
};

export const POSTER_THEMES: PosterTheme[] = [
  {
    bg: '#FBF7F0',
    gradientColor: '#FBF7F0',
    id: 'autumn',
    label: 'Autumn',
    parks: '#E8E0D0',
    roadPrimary: '#B8450A',
    roadSecondary: '#CC7A30',
    text: '#8B4513',
    water: '#D8CFC0',
  },
  {
    bg: '#1A3A5C',
    gradientColor: '#1A3A5C',
    id: 'blueprint',
    label: 'Blueprint',
    parks: '#1E4570',
    roadPrimary: '#C5DCF0',
    roadSecondary: '#9FC5E8',
    text: '#E8F4FF',
    water: '#0F2840',
  },
  {
    bg: '#FFFFFF',
    gradientColor: '#FFFFFF',
    id: 'contrast_zones',
    label: 'Contrast Zones',
    parks: '#ECECEC',
    roadPrimary: '#0F0F0F',
    roadSecondary: '#252525',
    text: '#000000',
    water: '#B0B0B0',
  },
  {
    bg: '#E8F0F0',
    gradientColor: '#E8F0F0',
    id: 'copper_patina',
    label: 'Copper Patina',
    parks: '#D8E8E0',
    roadPrimary: '#5A8A8A',
    roadSecondary: '#6B9E9E',
    text: '#2A5A5A',
    water: '#C0D8D8',
  },
  {
    bg: '#062C22',
    gradientColor: '#062C22',
    id: 'emerald',
    label: 'Emerald City',
    parks: '#0F523E',
    roadPrimary: '#2DB88F',
    roadSecondary: '#249673',
    text: '#E3F9F1',
    water: '#0D4536',
  },
  {
    bg: '#F0F4F0',
    gradientColor: '#F0F4F0',
    id: 'forest',
    label: 'Forest',
    parks: '#D4E8D4',
    roadPrimary: '#3D6B55',
    roadSecondary: '#5A8A70',
    text: '#2D4A3E',
    water: '#B8D4D4',
  },
  {
    bg: '#FFFFFF',
    gradientColor: '#FFFFFF',
    id: 'gradient_roads',
    label: 'Gradient Roads',
    parks: '#EFEFEF',
    roadPrimary: '#151515',
    roadSecondary: '#2A2A2A',
    text: '#000000',
    water: '#D5D5D5',
  },
  {
    bg: '#FAF8F5',
    gradientColor: '#FAF8F5',
    id: 'japanese_ink',
    label: 'Japanese Ink',
    parks: '#F0EDE8',
    roadPrimary: '#4A4A4A',
    roadSecondary: '#6A6A6A',
    text: '#2C2C2C',
    water: '#E8E4E0',
  },
  {
    bg: '#0A1628',
    gradientColor: '#0A1628',
    id: 'midnight_blue',
    label: 'Midnight Blue',
    parks: '#0F2235',
    roadPrimary: '#C9A227',
    roadSecondary: '#A8893A',
    text: '#D4AF37',
    water: '#061020',
  },
  {
    bg: '#F5F8FA',
    gradientColor: '#F5F8FA',
    id: 'monochrome_blue',
    label: 'Monochrome Blue',
    parks: '#E0EAF2',
    roadPrimary: '#2A5580',
    roadSecondary: '#4A7AA8',
    text: '#1A3A5C',
    water: '#D0E0F0',
  },
  {
    bg: '#0D0D1A',
    gradientColor: '#0D0D1A',
    id: 'neon_cyberpunk',
    label: 'Neon Cyberpunk',
    parks: '#151525',
    roadPrimary: '#00FFFF',
    roadSecondary: '#00C8C8',
    text: '#00FFFF',
    water: '#0A0A15',
  },
  {
    bg: '#000000',
    gradientColor: '#000000',
    id: 'noir',
    label: 'Noir',
    parks: '#111111',
    roadPrimary: '#E0E0E0',
    roadSecondary: '#B0B0B0',
    text: '#FFFFFF',
    water: '#0A0A0A',
  },
  {
    bg: '#F0F8FA',
    gradientColor: '#F0F8FA',
    id: 'ocean',
    label: 'Ocean',
    parks: '#D8EAE8',
    roadPrimary: '#2A7A9A',
    roadSecondary: '#4A9AB8',
    text: '#1A5F7A',
    water: '#B8D8E8',
  },
  {
    bg: '#FAF7F2',
    gradientColor: '#FAF7F2',
    id: 'pastel_dream',
    label: 'Pastel Dream',
    parks: '#E8EDE4',
    roadPrimary: '#9BA4B0',
    roadSecondary: '#B5AEBB',
    text: '#5D5A6D',
    water: '#D4E4ED',
  },
  {
    bg: '#FDF5F0',
    gradientColor: '#FDF5F0',
    id: 'sunset',
    label: 'Sunset',
    parks: '#F8E8E0',
    roadPrimary: '#D87A5A',
    roadSecondary: '#E8A088',
    text: '#C45C3E',
    water: '#F0D8D0',
  },
  {
    bg: '#F5EDE4',
    gradientColor: '#F5EDE4',
    id: 'terracotta',
    label: 'Terracotta',
    parks: '#E8E0D0',
    roadPrimary: '#B8653A',
    roadSecondary: '#C9846A',
    text: '#8B4513',
    water: '#A8C4C4',
  },
  {
    bg: '#F5F0E8',
    gradientColor: '#F5F0E8',
    id: 'warm_beige',
    label: 'Warm Beige',
    parks: '#E8E4D8',
    roadPrimary: '#A08B70',
    roadSecondary: '#B5A48E',
    text: '#6B5B4F',
    water: '#DDD5C8',
  },
];

export const POSTER_THEME_BY_ID: Record<PosterThemeId, PosterTheme> = POSTER_THEMES.reduce(
  (accumulator, theme) => ({
    ...accumulator,
    [theme.id]: theme,
  }),
  {} as Record<PosterThemeId, PosterTheme>
);

const COUNTRY_ALIASES: Record<string, string> = {
  UK: 'United Kingdom',
  UAE: 'United Arab Emirates',
  'United States of America': 'United States',
  Türkiye: 'Turkey',
};

export const normalizePosterCountry = (value: string) => {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return COUNTRY_ALIASES[normalized] ?? normalized;
};
