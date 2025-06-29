/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.js", "./components/**/*.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        space: {
          background: "#0b1d2c", 
          accent: "#1e3a5f", 
          text: "#d1e8ff", 
          highlight: "#ffcc00", 
        },
      },
    },
  },
  darkMode: "class", // Enables dark mode support
  plugins: [],
};