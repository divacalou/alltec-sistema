/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0b0f17',
        cardBg: '#131e2b',
        cardBorder: '#1f2d3d',
        brandOrange: '#ff5500',
        brandOrangeHover: '#e04a00',
      }
    },
  },
  plugins: [],
}