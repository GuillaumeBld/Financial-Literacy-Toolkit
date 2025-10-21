import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7d0036",
        secondary: "#c8a500",
        neutral: "#111111"
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif"
        ]
      },
      boxShadow: {
        card: "0 6px 16px rgba(0,0,0,0.08)"
      },
      borderRadius: {
        xl: "16px"
      },
      spacing: {
        18: "4.5rem"
      }
    }
  },
  plugins: []
};

export default config;
