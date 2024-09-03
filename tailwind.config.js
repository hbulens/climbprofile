/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f6ff00',
        secondary: '#14171A',
      },
      spacing: {
        '8xl': '100rem', // Example for a large size (adjust as needed)
      },
      width: {
        '8xl': '100rem', // Adding specifically for width
      },
      maxWidth: {
        '8xl': '115rem', // Adding specifically for max-width
      },
    },
  },
  plugins: [],
}

