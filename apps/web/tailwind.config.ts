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
        // L. University Official Colors
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
        // Ink accent for navigation, selected states, links, primary actions
        'ink': '#111827',
        'ink-light': '#374151',
        // Semantic status colors (use only for status/outcome indication)
        'status': {
          'success': '#16A34A',
          'success-tint': '#DCFCE7',
          'warning': '#D97706',
          'warning-tint': '#FFEDD5',
          'danger': '#DC2626',
          'danger-tint': '#FEE2E2',
        },
      },
    },
  },
  plugins: [],
}

export default config