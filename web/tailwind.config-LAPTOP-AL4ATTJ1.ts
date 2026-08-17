import type { Config } from 'tailwindcss';
import { tailwindPreset } from '../shared/design-tokens/src/tailwind-preset';

const config: Config = {
  darkMode: ['class'],
  presets: [tailwindPreset as any],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Consolas', 'monospace'],
      },
      colors: {
        // Arogya Prahari Brand Tokens
        'prahari-rose': '#C2255C',
        'sentinel-teal': '#146356',
        'alert-amber': '#E8901A',
        'sos-red': '#C6362C',
        'command-paper': '#F6F5F2',
        'ink': '#1D2321',
        'slate-gov': '#5B6663',
        
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#C2255C',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#146356',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#C6362C',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#EAE8E3',
          foreground: '#5B6663',
        },
        accent: {
          DEFAULT: '#E8901A',
          foreground: '#1D2321',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#1D2321',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1D2321',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.95)', opacity: '1' },
          '50%': { transform: 'scale(1.3)', opacity: '0.4' },
          '100%': { transform: 'scale(0.95)', opacity: '1' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

