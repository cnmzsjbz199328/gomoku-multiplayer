/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gomoku-board': '#e3c16f',
        'gomoku-black': '#1a1a1a',
        'gomoku-white': '#f8f9fa'
      }
    },
  },
  plugins: [],
}
