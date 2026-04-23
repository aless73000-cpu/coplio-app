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
        // Palette Coplio officielle
        coplio: {
          green: '#0F6E56',        // Vert principal
          'green-light': '#E1F5EE', // Vert clair fond
          'green-medium': '#9FE1CB', // Vert medium
          text: '#444441',          // Texte sombre
          bg: '#F1EFE8',            // Gris clair fond
          amber: '#854F0B',
          'amber-bg': '#FAEEDA',
          red: '#A32D2D',
          'red-bg': '#FCEBEB',
          blue: '#185FA5',
          'blue-bg': '#E6F1FB',
        },
        // Mapping shadcn/ui
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#0F6E56',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#E1F5EE',
          foreground: '#0F6E56',
        },
        destructive: {
          DEFAULT: '#A32D2D',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F1EFE8',
          foreground: '#444441',
        },
        accent: {
          DEFAULT: '#9FE1CB',
          foreground: '#0F6E56',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
}

export default config
