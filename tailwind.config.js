/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.js", "./components/**/*.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        galaxy: {
            darkbg: "#1a1a1a",
            darkborder: "#333",
            lightbg: "#fff",
            lightborder: "#e5e7eb",
        }
      },
    },
  },
  darkMode: "class", // Enables dark mode support
  plugins: [],
};