// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ["'Inter'", 'system-ui', 'sans-serif'],
        heading: ["'Outfit'", 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'blue-sm': '0 1px 3px 0 rgb(2 132 199 / 0.1), 0 1px 2px -1px rgb(2 132 199 / 0.1)',
        'blue-md': '0 4px 6px -1px rgb(2 132 199 / 0.15), 0 2px 4px -2px rgb(2 132 199 / 0.15)',
        'blue-lg': '0 10px 15px -3px rgb(2 132 199 / 0.15), 0 4px 6px -4px rgb(2 132 199 / 0.15)',
      },
    },
  },
  plugins: [],
};
