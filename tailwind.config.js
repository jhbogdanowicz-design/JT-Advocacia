/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          primary: '#c5a85c',
          noble: '#d4af37',
        },
        imperial: {
          blue: '#0f1e36',
          dark: '#0c1424',
        }
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
      }
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
