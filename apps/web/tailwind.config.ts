import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Loyola University Chicago Official Colors
        'loyola-maroon': '#8B0015',
        'loyola-maroon-dark': '#6B0011',
        'loyola-maroon-light': '#A8001A',
        'loyola-gold': '#F1BE48',
        'loyola-gold-dark': '#D4A537',
        'loyola-gold-light': '#F5D06C',
        'loyola-gray': {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
    },
  },
  plugins: [],
}

export default config
