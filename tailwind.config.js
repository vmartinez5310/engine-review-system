/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // ¡Esta línea es la que le dice a Tailwind que lea tus archivos Vue!
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand-color)',
          dark: 'var(--brand-color-dark)',
          light: 'var(--brand-color-light)'
        },
        slate: { 850: '#151e2e' }
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] }
    },
  },
  plugins: [],
}