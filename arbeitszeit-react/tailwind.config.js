/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        purple: {
          50:  '#f0eeff',
          100: '#e4e0ff',
          200: '#cec6ff',
          300: '#b19eff',
          400: '#9170ff',
          500: '#7c6fd4',
          600: '#5b4fcf',
          700: '#4a3fb8',
          800: '#3d3499',
          900: '#1e1854',
        },
        pink: {
          500: '#e8407a',
          600: '#c2185b',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'app-gradient': 'linear-gradient(135deg, #e8e0f5 0%, #d4c8f0 30%, #c9b8e8 60%, #e0c8e8 100%)',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
}
