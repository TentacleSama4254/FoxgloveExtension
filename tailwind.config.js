/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'foxglove': {
          50: '#f5f7fa',
          100: '#eaedf2',
          200: '#d5dce6',
          300: '#bbc4d4',
          400: '#9ba8bf',
          500: '#7d8ca9',
          600: '#637194',
          700: '#4e5a7b',
          800: '#3e4862',
          900: '#2f364a',
        },
      },
    },
  },
  plugins: [],
}
