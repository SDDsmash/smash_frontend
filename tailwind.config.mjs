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
      },
      keyframes: {
        'loading-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        'loading-bounce': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.35' },
          '50%': { transform: 'translateY(-6px)', opacity: '1' }
        }
      },
      animation: {
        'loading-rotate': 'loading-rotate 1.2s linear infinite',
        'loading-bounce': 'loading-bounce 0.9s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
