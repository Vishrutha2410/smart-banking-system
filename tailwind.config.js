/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#b3ccff",
          300: "#80a9ff",
          400: "#4d7fff",
          500: "#2a5bff",
          600: "#1a3fe0",
          700: "#152fb3",
          800: "#132a8f",
          900: "#0f1f66",
        },
        ink: {
          900: "#0b1220",
          800: "#111a2e",
          700: "#1b2440",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
