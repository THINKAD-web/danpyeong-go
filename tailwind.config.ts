import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#1a1a2e",
        paper: "#fdfcf7",
        brand: "#3d5af1",
        brandink: "#22227a",
        coral: "#ff6b6b",
        mint: "#22c55e",
        sun: "#fbbf24",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
