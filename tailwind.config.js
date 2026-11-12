/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        cream: '#F5F3F1',
        eleven: {
          cream: '#F5F3F1',
          hover: '#44403B',
          subtle: '#FDFCFC',
          secondary: '#59544F',
          muted: '#777169',
          border: '#EBE8E4',
          focus: '#2B7FFF',
        },
        apple: {
          black: '#1d1d1f',
          gray: '#86868b',
          light: '#f5f5f7',
          border: '#d2d2d7',
          blue: '#2563eb',
          'blue-hover': '#1d4ed8',
          emerald: '#10b981',
          indigo: '#4f46e5',
          dark: '#0f172a',
        }
      },
      boxShadow: {
        'eleven-pill': '0 0 0 0.5px rgba(0, 0, 0, 0.125), 0 1px 1px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'eleven-card': '0 0 0 0.5px rgba(0, 0, 0, 0.075)',
        'apple-sm': '0 2px 8px rgba(37, 99, 235, 0.06)',
        'apple-card': '0 10px 35px rgba(15, 23, 42, 0.05)',
        'apple-hover': '0 20px 45px rgba(37, 99, 235, 0.12)',
        'figma-float': '0 20px 50px rgba(37, 99, 235, 0.14)',
        'notion': 'none',
      },
      borderRadius: {
        'card': '1rem',
        'card-sm': '0.75rem',
        'xl': '20px',
        '2xl': '28px',
        '3xl': '36px',
      },
      animation: {
        'sound-wave': 'soundWave 1.2s infinite ease-in-out alternate',
        'pulse-subtle': 'pulseSubtle 2.5s infinite ease-in-out',
      },
      keyframes: {
        soundWave: {
          '0%': { height: '20%' },
          '100%': { height: '100%' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      }
    },
  },
  plugins: [],
}
