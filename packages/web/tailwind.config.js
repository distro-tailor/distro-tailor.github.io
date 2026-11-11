/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        tux: {
          50: '#f0fdf4',
          500: '#22c55e',
          900: '#14532d'
        }
      }
    },
  },
  plugins: [],
}
