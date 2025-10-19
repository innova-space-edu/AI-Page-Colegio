/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f0f1b',
        secondary: '#1c1c2e',
        accent: '#00ffc3',
        highlight: '#6322fd'
      }
    }
  },
  plugins: []
};