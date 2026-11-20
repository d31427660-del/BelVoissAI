/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        editorial: {
          canvas: '#FFFFFF',
          surface: '#F5F5F5',
          ink: '#000000',
          obsidian: '#0A0A0A',
          muted: '#666666',
          hairline: '#E6E6E6',
          coral: '#FE432A',
          vermilion: '#FF591D',
          pink: '#FFAAC7',
          cobalt: '#0225AC',
          forest: '#1C3B36',
          mint: '#6BFF91',
          sand: '#DFD5CB',
          lime: '#D8E738',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
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
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'card': '1rem',
        'card-sm': '0.75rem',
        'xl': '20px',
        '2xl': '28px',
        '3xl': '36px',
      },
      animation: {
        'sound-wave': 'soundWave 1.2s infinite ease-in-out alternate',
        'pulse-subtle': 'pulseSubtle 2.5s infinite ease-in-out',
        fadeIn: 'fadeIn 0.2s ease-out',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        soundWave: {
          '0%': { height: '20%' },
          '100%': { height: '100%' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
