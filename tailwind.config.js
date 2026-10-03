module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B1033',
        page: '#F3F4FA',
        brand: { DEFAULT: '#5B2A91', dark: '#2A1251', mid: '#7A45B8', light: '#EDE4F8' },
        lime: { DEFAULT: '#88D13F', dark: '#4F9A16', light: '#EAF7DA' },
        visor: '#3B8FE0',
        signal: '#EF4444'
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(42,18,81,0.25)',
        card: '0 2px 10px -2px rgba(42,18,81,0.12)'
      }
    }
  }
};
