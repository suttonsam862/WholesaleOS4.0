import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        ok: "var(--ok)",
        warn: "var(--warn)",
        bad: "var(--bad)",
        // Neon Colors (aligned with Hydrogen aesthetic)
        "neon-blue": "#3b82f6",
        "neon-cyan": "#06b6d4",
        "neon-purple": "#8b5cf6",
        "neon-violet": "#8b5cf6",
        "neon-pink": "#ec4899",
        "neon-magenta": "#ec4899",
        "neon-green": "#22c55e",
        "neon-gold": "#eab308",
        "neon-yellow": "#eab308",
        // Foundation Colors (from Hydrogen - matte black aesthetic)
        "void": "#000000",
        "obsidian": "#0a0a0a",
        "carbon": "#121212",
        "graphite": "#1a1a1a",
        "slate-dark": "#242424",
        "steel": "#2d2d2d",
        // Content Whites
        "pure": "#ffffff",
        "snow": "#f5f5f5",
        "mist": "#e0e0e0",
        "fog": "#a0a0a0",
        "smoke": "#666666",
        glass: "rgba(255, 255, 255, 0.05)",
        "glass-heavy": "rgba(255, 255, 255, 0.1)",
        "glass-border": "rgba(255, 255, 255, 0.1)",
      },
      boxShadow: {
        // Glow shadows (aligned with Hydrogen)
        "glow-blue": "0 0 20px rgba(59, 130, 246, 0.4)",
        "glow-cyan": "0 0 20px rgba(6, 182, 212, 0.4)",
        "glow-purple": "0 0 20px rgba(139, 92, 246, 0.4)",
        "glow-violet": "0 0 20px rgba(139, 92, 246, 0.4)",
        "glow-green": "0 0 20px rgba(34, 197, 94, 0.4)",
        "glow-gold": "0 0 20px rgba(234, 179, 8, 0.4)",
        "glow-magenta": "0 0 20px rgba(236, 72, 153, 0.4)",
        // Legacy neon shadows (for backward compatibility)
        "neon-blue": "0 0 10px #3b82f6, 0 0 20px #3b82f6",
        "neon-purple": "0 0 10px #8b5cf6, 0 0 20px #8b5cf6",
        "neon-pink": "0 0 10px #ec4899, 0 0 20px #ec4899",
        "glass": "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        "glass-inset": "inset 0 0 20px 0 rgba(255, 255, 255, 0.05)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.8", filter: "brightness(1.2)" },
        },
        "blob": {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.3s ease-in-out",
        float: "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        blob: "blob 7s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
