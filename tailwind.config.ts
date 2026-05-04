import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        ink: "#111111",
        paper: "#ffffff",
        muted: "#6b6b6b",
        line: "#e5e5e5",
        accent: "#ff0000",
      },
      letterSpacing: { tightish: "-0.01em" },
    },
  },
  plugins: [],
} satisfies Config;
