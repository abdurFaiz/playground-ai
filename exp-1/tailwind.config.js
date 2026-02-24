/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Newsreader', 'serif'],
      },
      colors: {
        lime: {
          350: '#d9f99d',
          450: '#a3e635',
        }
      },
      letterSpacing: {
        'tighter-plus': '-0.05em',
      }
    },
  },
  plugins: [],
}
