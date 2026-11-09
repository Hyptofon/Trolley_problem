/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Monopo Saigon Editorial Palette (Theme-aware via CSS RGB variables)
        obsidian: 'rgb(var(--color-obsidian-rgb) / <alpha-value>)',
        paper: 'rgb(var(--color-paper-rgb) / <alpha-value>)',
        inkstone: 'rgb(var(--color-inkstone-rgb) / <alpha-value>)',
        'felt-gray': 'rgb(var(--color-felt-gray-rgb) / <alpha-value>)',
        'slate-pill': 'rgb(var(--color-slate-pill-rgb) / <alpha-value>)',
        'ash-mist': 'rgb(var(--color-ash-mist-rgb) / <alpha-value>)',
        pewter: 'rgb(var(--color-pewter-rgb) / <alpha-value>)',

        // Iridescent Fluid Media Colors (Molten River)
        iridescent: {
          green: 'rgb(160, 224, 171)',
          amber: 'rgb(255, 172, 46)',
          oxblood: 'rgb(165, 45, 37)',
        },

        // Legacy graphite shades (for backward compatibility)
        graphite: {
          950: '#000000',
          900: '#0d0d0d',
          850: '#141414',
          800: '#181818',
          750: '#242424',
          700: '#333333',
          600: '#4d4d4d',
          400: '#6d6d6d',
          300: '#9a9a9a',
          100: '#f5f5f5',
        },
        trolley: {
          amber: '#ffac2e',
          amberGlow: '#ffc107',
          crimson: '#a52d25',
          emerald: '#a0e0ab',
          accent: '#ffffff',
        },
      },
      fontFamily: {
        roobert: [
          'Roobert',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      borderRadius: {
        pill: '75px',
        sharp: '0px',
      },
      transitionTimingFunction: {
        monopo: 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      transitionDuration: {
        patient: '1200ms',
        gliding: '800ms',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        spinSlow: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
        spinSlow: 'spinSlow 20s linear infinite',
      },
    },
  },
  plugins: [],
};
