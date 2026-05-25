import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Palette Coplio — Apple-refined ──────────────────────────
        coplio: {
          green:         '#374151',   // Gris foncé principal (gray-700)
          'green-light': '#F1F5F9',   // Slate-100 — fond neutre
          'green-medium':'#64748B',   // Slate-500 — secondaire
          text:          '#1D1D1F',   // Apple near-black
          bg:            '#F8FAFC',   // Slate-50 — fond page
          amber:         '#92400E',
          'amber-bg':    '#FFFBEB',
          red:           '#C0392B',
          'red-bg':      '#FFF0EF',
          blue:          '#0066CC',   // Apple blue
          'blue-bg':     '#EBF3FF',
        },
        // ── shadcn/ui token mapping ───────────────────────────────────
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    '#374151',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT:    '#F1F5F9',
          foreground: '#374151',
        },
        destructive: {
          DEFAULT:    '#C0392B',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    '#64748B',
          foreground: '#374151',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        // Apple utilise 12–16 px pour les cartes et composants principaux
        lg: 'var(--radius)',                        // 12 px
        md: 'calc(var(--radius) - 2px)',            // 10 px
        sm: 'calc(var(--radius) - 4px)',            // 8 px
        xl: 'calc(var(--radius) + 4px)',            // 16 px
        '2xl': 'calc(var(--radius) + 8px)',         // 20 px
      },
      fontFamily: {
        // -apple-system → SF Pro sur macOS/iOS (rendu natif Apple)
        // BlinkMacSystemFont → alias Blink pour SF Pro
        // Fallback : Inter chargé via next/font
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'var(--font-inter)',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        // Ombres Apple : très légères, à peine perceptibles
        'apple-sm': '0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.03)',
        'apple-md': '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'apple-lg': '0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'apple-xl': '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fade-in 0.25s ease-out',
      },
    },
  },
  safelist: [
    'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
    'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4',
    'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4',
  ],
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
}

export default config
