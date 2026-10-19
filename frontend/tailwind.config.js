/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FAF8F5',
          100: '#F5F2EB',
          200: '#EAE6DE',
          300: '#DFD9CE',
          400: '#C7BFB1',
        },
        editorial: {
          50: '#EAF3FA',
          100: '#C9E0F2',
          500: '#226192',
          600: '#1B4E76',
          700: '#163E5E',
          800: '#112E46',
          900: '#0B1E2E',
        },
        coral: {
          50: '#FDF1EE',
          100: '#FCE0D9',
          500: '#EF5537',
          600: '#D94528',
          700: '#BA371E',
        },
        brand: {
          50: '#FAF8F5',
          500: '#226192',
          600: '#1B4E76',
          700: '#112E46',
        },
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        sans: [
          '"SF Pro Display"',
          '"SF Pro Text"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Plus Jakarta Sans"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          '"JetBrains Mono"',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
