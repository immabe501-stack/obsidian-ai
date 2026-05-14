import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "PingFang TC",
          "Microsoft JhengHei",
          "sans-serif",
        ],
        display: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        // Apple-inspired palette
        ios: {
          blue: "#0A84FF",
          indigo: "#5E5CE6",
          purple: "#BF5AF2",
          pink: "#FF375F",
          red: "#FF453A",
          orange: "#FF9F0A",
          yellow: "#FFD60A",
          green: "#30D158",
          teal: "#64D2FF",
          gray: "#8E8E93",
        },
      },
      backdropBlur: {
        xs: "4px",
        "3xl": "40px",
      },
      boxShadow: {
        glass: "0 4px 24px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
        "glass-lg": "0 10px 40px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
        "glass-hover": "0 16px 48px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.06)",
        glow: "0 0 24px rgba(10, 132, 255, 0.35)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "soft-pulse": "soft-pulse 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
