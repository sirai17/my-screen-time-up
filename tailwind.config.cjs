/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Example: Add a custom font family if you've imported one
      // fontFamily: {
      //   sans: ['Inter', 'sans-serif'],
      // },
    },
  },
  plugins: [],
}
