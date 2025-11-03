/** @type {import('tailwindcss').Config} */

export default {
  content: ['./src/**/*.{mjs,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EAF6FD',
          100: '#D5EEFB',
          200: '#ACDBF6',
          300: '#84C9F1',
          400: '#5CB6EC',
          500: '#3AA5E6',
          600: '#2793D3',
          700: '#1E76A6',
          800: '#155A7A',
          900: '#0D3D4F',
          950: '#082B38',
          DEFAULT: '#2793D3'
        }
      }
    }
  },
  plugins: []
}
