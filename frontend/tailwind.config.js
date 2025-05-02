const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        ...colors,
        plum: '#4C2C69',
        'plum-dark': '#3B1F50',
        ochre: '#D4A017',
        cream: '#F8F1E9',
        purple: {
          400: '#C4B5FD',
          600: '#8B5CF6',
        },
        emerald: {
          600: '#059669',
          700: '#047857',
        },
        red: {
          600: '#DC2626',
          700: '#B91C1C',
        },
      },
      fontFamily: {
        crimson: ['Crimson Text', 'serif'],
        merriweather: ['Merriweather', 'serif'], // New font for navbar
      },
      ringWidth: {
        2: '2px',
      },
    },
  },
  plugins: [],
};