import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0057B8",
          50: "#E6F0FB",
          100: "#CCE0F7",
          500: "#0057B8",
          600: "#004796",
          700: "#003773",
        },
        secondary: {
          DEFAULT: "#0E9F6E",
          50: "#E6F9F1",
          500: "#0E9F6E",
          600: "#0B7F58",
        },
        accent: {
          DEFAULT: "#F59E0B",
          50: "#FEF3E0",
          500: "#F59E0B",
          600: "#C67D08",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
