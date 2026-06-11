/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        xl: '1440px',
      },
    },
    extend: {
      colors: {
        bg: {
          900: '#060E1C',
          800: '#0A1628',
          700: '#0F1F38',
          600: '#172B4D',
        },
        neon: {
          cyan: '#00F0FF',
          'cyan-dim': '#00B8CC',
        },
        whql: '#10B981',
        warn: '#F59E0B',
        danger: '#EF4444',
        info: '#8B5CF6',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['"Noto Sans SC"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.3), 0 0 40px rgba(0, 240, 255, 0.1)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.4)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)",
        'hero-gradient': 'radial-gradient(ellipse at top, rgba(0,240,255,0.12) 0%, transparent 60%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0,240,255,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0,240,255,0.6)' },
        },
      },
    },
  },
  plugins: [],
};
