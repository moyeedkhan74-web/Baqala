/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          light: '#f8fafc',
          dark: '#0a0514', // Rich midnight violet
        },
        surface: {
          light: 'rgba(255, 255, 255, 0.7)',
          dark: 'rgba(19, 13, 38, 0.7)', // Deep space surface
        },
        accent: {
          violet: '#8b5cf6',
          emerald: '#10b981',
          neon: '#22d3ee',
          magenta: '#ec4899', // New vibrant pink/magenta
          sun: '#f59e0b', // Vibrant orange
        },
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // Violet
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#030712', // Deep space
        }
      },
      fontFamily: {
        sans: ['"Outfit"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, rgba(139, 92, 246, 0.3) 0deg, rgba(16, 185, 129, 0.3) 180deg, rgba(139, 92, 246, 0.3) 360deg)',
      },
      boxShadow: {
        'glow-violet': '0 0 20px -5px rgba(139, 92, 246, 0.6)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.6)',
        'glow-neon': '0 0 20px -5px rgba(34, 211, 238, 0.6)',
        'glow-magenta': '0 0 20px -5px rgba(236, 72, 153, 0.6)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'glass-colorful': '0 8px 32px 0 rgba(236, 72, 153, 0.15)',
      },
    },
  },
  plugins: [],
};
