/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        brand: {
          orange: '#E8470A',
          dark: '#1a1a1a',
        },
        sidebar: '#ffffff',
        surface: '#f3f4f6',
        card: '#ffffff',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
        sidebar: '2px 0 8px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
