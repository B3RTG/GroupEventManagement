export { colors } from './colors';

// Font family names (loaded via @expo-google-fonts)
export const fonts = {
  headline: {
    bold:      'Manrope_700Bold',
    extraBold: 'Manrope_800ExtraBold',
  },
  body: {
    regular:   'Inter_400Regular',
    medium:    'Inter_500Medium',
    semiBold:  'Inter_600SemiBold',
  },
} as const;

// Border radius scale
export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 9999,
} as const;

// Shadow (ambient, 6% opacity)
export const shadow = {
  soft: {
    shadowColor: '#171c1f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  md: {
    shadowColor: '#171c1f',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 6,
  },
} as const;
