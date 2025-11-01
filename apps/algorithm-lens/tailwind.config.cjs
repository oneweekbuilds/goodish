/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Colors using CSS variables for easy theming
      colors: {
        // Existing colors
        bg: "var(--color-bg)",
        panel: "var(--color-panel)",
        ink: "var(--color-ink)",
        inkDim: "var(--color-ink-dim)",
        inkMuted: "var(--color-ink-muted)",
        brand: "var(--color-brand)",
        brandDark: "var(--color-brand-dark)",
        brandLight: "var(--color-brand-light)",
        accent: "var(--color-accent)",
        accentLight: "var(--color-accent-light)",
        line: "var(--color-line)",
        grid: "var(--color-grid)",
        goodishYellow: "var(--color-yellow)",
        pos: "var(--color-pos)",
        posLight: "var(--color-pos-light)",
        neu: "var(--color-neu)",
        neuLight: "var(--color-neu-light)",
        neg: "var(--color-neg)",
        negLight: "var(--color-neg-light)",

        // shadcn/ui colors (direct CSS variable references)
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
      },
      // Border radius with design tokens
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full: "var(--radius-full)",
      },
      // Animations
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
