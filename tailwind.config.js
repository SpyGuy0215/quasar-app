/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.js", "./components/**/*.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        space: {
          background: "#0b1d2c", // Dark space blue
          accent: "#1e3a5f", // Deep blue for accents
          text: "#d1e8ff", // Light blue for text
          highlight: "#ffcc00", // Yellow for highlights
        },
      },
    },
  },
  darkMode: "class", // Enables dark mode support
  plugins: [],
};