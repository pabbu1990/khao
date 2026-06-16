import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        spice: "#E0922F",
        chili: "#C0392B",
        curry: "#3E7A4E",
        ink: "#2A1810",
        cream: "#FBF6EE",
        panel: "#F4EBDD",
        line: "#EADFCD",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(34,22,16,0.04), 0 14px 34px -18px rgba(34,22,16,0.20)",
        pop: "0 12px 40px -12px rgba(34,22,16,0.30)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
