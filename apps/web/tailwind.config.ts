import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        ham: {
          900: '#00355A',
          700: '#00558C',
          500: '#008DFF',
          300: '#0DE3FF',
        },
        status: {
          done: '#00A972',
          progress: '#008DFF',
          waiting: '#FFB020',
          blocked: '#E14337',
          review: '#7A5AF8',
          backlog: '#C3CFDA',
        },
        surface: '#FFFFFF',
        bg: '#F5F8FA',
        border: '#E2E9F0',
        muted: '#7A8B9C',
        body: '#3C5165',
        ink: '#10202E',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,32,46,.05)',
        elevated: '0 12px 28px -10px rgba(16,32,46,.28)',
      },
      keyframes: {
        'ham-rise': { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        'ham-grow': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        'ham-pulse': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '.35' } },
        'ham-shimmer': { from: { backgroundPosition: '-220px 0' }, to: { backgroundPosition: '220px 0' } },
      },
      animation: {
        'ham-rise': 'ham-rise 260ms ease-out both',
        'ham-grow': 'ham-grow 700ms ease-out both',
        'ham-pulse': 'ham-pulse 1.4s ease-in-out infinite',
        'ham-shimmer': 'ham-shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
