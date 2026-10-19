/** Pareena Eye Care design tokens. Values match the Pareena Eye Care design system. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        card: 'var(--surface-card)',
        soft: 'var(--surface-soft)',
        ink: 'var(--ink)',
        muted: 'var(--ink-muted)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        navy: { DEFAULT: 'var(--navy)', hover: 'var(--navy-hover)' },
        sky: { DEFAULT: 'var(--sky)', soft: 'var(--sky-soft)' },
        link: 'var(--accent-text)',
        success: { DEFAULT: 'var(--success)', soft: 'var(--success-soft)' },
        warning: { DEFAULT: 'var(--warning)', soft: 'var(--warning-soft)' },
        danger: { DEFAULT: 'var(--danger)', soft: 'var(--danger-soft)' },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', '"Arial Narrow"', 'system-ui', 'sans-serif'],
        sans: ['Barlow', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
      },
      maxWidth: {
        page: '1200px',
      },
    },
  },
  plugins: [],
}
