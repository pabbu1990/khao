import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spice:  "#E0922F",
        chili:  "#C0392B",
        curry:  "#3E7A4E",
        ink:    "#2A1810",
        cream:  "#FBF6EE",
        panel:  "#F6EFE4",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
