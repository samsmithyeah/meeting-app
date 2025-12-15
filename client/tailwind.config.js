/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface2) / <alpha-value>)",
        stroke: "rgb(var(--stroke) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accent2: "rgb(var(--accent2) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Inter",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "Apple Color Emoji",
          "Segoe UI Emoji",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(15, 23, 42, 0.06), 0 14px 40px rgba(15, 23, 42, 0.10)",
        float: "0 1px 0 rgba(15, 23, 42, 0.08), 0 22px 70px rgba(15, 23, 42, 0.16)",
        inset: "inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 0 0 1px rgba(15, 23, 42, 0.06)",
        glow: "0 0 0 1px rgba(124, 58, 237, 0.20), 0 12px 50px rgba(124, 58, 237, 0.22)",
      },
      borderRadius: {
        xl: "1.05rem",
        "2xl": "1.35rem",
        "3xl": "1.85rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "0.70" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { transform: "translateX(-40%)" },
          "100%": { transform: "translateX(140%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 420ms cubic-bezier(0.2, 0.9, 0.2, 1) both",
        "soft-pulse": "soft-pulse 1.6s ease-in-out infinite",
        shimmer: "shimmer 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
