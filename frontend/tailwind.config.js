/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        surface2: token('surface-2'),
        line: token('line'),
        fg: token('fg'),
        muted: token('muted'),
        primary: token('primary'),
        pink: token('pink'),
        magenta: token('magenta'),
        ok: token('ok'),
        bad: token('bad'),
        warn: token('warn'),
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        aurora: 'linear-gradient(120deg, #FF6FB5 0%, #C94BE0 45%, #8A6BFF 100%)',
      },
      boxShadow: {
        glow: '0 10px 40px -10px rgba(155, 140, 255, 0.55)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 50px -30px rgba(0,0,0,0.8)',
      },
      borderRadius: { '4xl': '2rem' },
      keyframes: {
        'fade-up': { from: { opacity: '0.001', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        flash: { '0%': { backgroundColor: 'rgb(var(--primary) / 0.18)' }, '100%': { backgroundColor: 'transparent' } },
      },
      animation: {
        'fade-up': 'fade-up .35s ease-out both',
        flash: 'flash 1s ease-out',
      },
    },
  },
  plugins: [],
}
