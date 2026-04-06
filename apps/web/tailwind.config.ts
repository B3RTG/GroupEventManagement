import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Design tokens extracted from Stitch (Athletic Editorial) ──────────
      colors: {
        background:                   '#f6fafe',
        surface:                      '#f6fafe',
        'surface-bright':             '#f6fafe',
        'surface-dim':                '#d6dade',
        'surface-variant':            '#dfe3e7',
        'surface-container-lowest':   '#ffffff',
        'surface-container-low':      '#f0f4f8',
        'surface-container':          '#eaeef2',
        'surface-container-high':     '#e4e9ed',
        'surface-container-highest':  '#dfe3e7',
        'surface-tint':               '#4d6073',
        'inverse-surface':            '#2c3134',
        'inverse-on-surface':         '#edf1f5',

        primary:                      '#00101e',
        'primary-container':          '#122636',
        'primary-fixed':              '#d0e5fa',
        'primary-fixed-dim':          '#b5c9de',
        'on-primary':                 '#ffffff',
        'on-primary-container':       '#7a8ea1',
        'on-primary-fixed':           '#081d2d',
        'on-primary-fixed-variant':   '#36495a',
        'inverse-primary':            '#b5c9de',

        secondary:                    '#0058be',
        'secondary-container':        '#2170e4',
        'secondary-fixed':            '#d8e2ff',
        'secondary-fixed-dim':        '#adc6ff',
        'on-secondary':               '#ffffff',
        'on-secondary-container':     '#fefcff',
        'on-secondary-fixed':         '#001a42',
        'on-secondary-fixed-variant': '#004395',

        tertiary:                     '#160e00',
        'tertiary-container':         '#302200',
        'tertiary-fixed':             '#ffdf9a',
        'tertiary-fixed-dim':         '#f7be1d',
        'on-tertiary':                '#ffffff',
        'on-tertiary-container':      '#af8500',
        'on-tertiary-fixed':          '#251a00',
        'on-tertiary-fixed-variant':  '#5a4300',

        error:                        '#ba1a1a',
        'error-container':            '#ffdad6',
        'on-error':                   '#ffffff',
        'on-error-container':         '#93000a',

        outline:                      '#74777d',
        'outline-variant':            '#c3c7cc',
        'on-background':              '#171c1f',
        'on-surface':                 '#171c1f',
        'on-surface-variant':         '#43474c',
      },

      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body:     ['Inter', 'sans-serif'],
        label:    ['Inter', 'sans-serif'],
      },

      borderRadius: {
        DEFAULT: '0.25rem',
        lg:      '0.5rem',
        xl:      '0.75rem',
        '2xl':   '1rem',
        full:    '9999px',
      },

      boxShadow: {
        soft: '0 12px 40px rgba(23, 28, 31, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
