import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Proxiam ENR Design System
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1", // Indigo — primary action
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        // Phase colors
        phase: {
          p0: "#3b82f6", // blue — Prospection
          p1: "#8b5cf6", // violet — Ingénierie
          p2: "#10b981", // emerald — Autorisations
          p3: "#14b8a6", // teal — Finance
          p4: "#f59e0b", // amber — Construction
          p5: "#ec4899", // pink — Commissioning
          p6: "#6366f1", // indigo — Exploitation
          p7: "#64748b", // slate — Démantèlement
        },
        // Node types (Knowledge Graph)
        node: {
          input: "#3b82f6",    // blue
          output: "#10b981",   // green
          deliverable: "#f59e0b", // amber
          tool: "#f97316",     // orange
          person: "#ec4899",   // pink
          repository: "#64748b", // slate
        },
        // Risk severity
        risk: {
          low: "#22c55e",
          medium: "#f59e0b",
          high: "#ef4444",
          critical: "#dc2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
