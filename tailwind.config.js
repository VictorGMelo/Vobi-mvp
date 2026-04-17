/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        vobi: {
          primary: '#2D5BFF',
          'primary-hover': '#1A47E8',
          'primary-light': '#EEF2FF',
          'primary-border': '#C7D2FE',
          dark: '#111827',
          gray: '#6B7280',
          'gray-light': '#9CA3AF',
          cream: '#F8FAFC',
          border: '#E2E8F0',
          surface: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
        auth: '0 4px 24px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
