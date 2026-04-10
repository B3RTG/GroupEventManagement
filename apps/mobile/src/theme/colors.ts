// ── Design System — Athletic Editorial ───────────────────
// Tokens extracted from docs/design/screens/mobile/*.html tailwind config

export const colors = {
  // Primary
  primary:                '#00101e',
  primaryContainer:       '#122636',
  primaryFixed:           '#d0e5fa',
  primaryFixedDim:        '#b5c9de',
  onPrimary:              '#ffffff',
  onPrimaryContainer:     '#7a8ea1',
  onPrimaryFixed:         '#081d2d',
  onPrimaryFixedVariant:  '#36495a',
  inversePrimary:         '#b5c9de',

  // Secondary
  secondary:              '#0058be',
  secondaryContainer:     '#2170e4',
  secondaryFixed:         '#d8e2ff',
  secondaryFixedDim:      '#adc6ff',
  onSecondary:            '#ffffff',
  onSecondaryContainer:   '#fefcff',
  onSecondaryFixed:       '#001a42',
  onSecondaryFixedVariant:'#004395',

  // Tertiary (gold accent)
  tertiary:               '#160e00',
  tertiaryContainer:      '#302200',
  tertiaryFixed:          '#ffdf9a',
  tertiaryFixedDim:       '#f7be1d',
  onTertiary:             '#ffffff',
  onTertiaryContainer:    '#af8500',
  onTertiaryFixed:        '#251a00',
  onTertiaryFixedVariant: '#5a4300',

  // Surface hierarchy
  background:                 '#f6fafe',
  surface:                    '#f6fafe',
  surfaceBright:              '#f6fafe',
  surfaceVariant:             '#dfe3e7',
  surfaceDim:                 '#d6dade',
  surfaceContainer:           '#eaeef2',
  surfaceContainerLow:        '#f0f4f8',
  surfaceContainerHigh:       '#e4e9ed',
  surfaceContainerHighest:    '#dfe3e7',
  surfaceContainerLowest:     '#ffffff',
  surfaceTint:                '#4d6073',
  inverseSurface:             '#2c3134',
  inverseOnSurface:           '#edf1f5',

  // On-surface
  onBackground:     '#171c1f',
  onSurface:        '#171c1f',
  onSurfaceVariant: '#43474c',

  // Error
  error:            '#ba1a1a',
  errorContainer:   '#ffdad6',
  onError:          '#ffffff',
  onErrorContainer: '#93000a',

  // Outline
  outline:        '#74777d',
  outlineVariant: '#c3c7cc',

  // Gradients (as arrays for LinearGradient)
  editorialGradient: ['#00101e', '#122636'] as readonly [string, string],
} as const;

export type ColorKey = keyof typeof colors;
