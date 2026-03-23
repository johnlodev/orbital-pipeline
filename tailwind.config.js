/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        fluent: {
          bg: '#faf9f8',
          hover: '#f3f2f1',
          border: '#e1dfdd',
          text: '#323130',
          muted: '#605e5c',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#0078d4',
          600: '#005a9e',
          700: '#004578',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}
