/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Colors using CSS variables for easy theming
      colors: {
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
      },
      // Spacing scale (extends defaults)
      spacing: {
        18: "4.5rem",
        88: "22rem",
        112: "28rem",
        128: "32rem",
      },
      // Typography
      fontFamily: {
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
      fontSize: {
        xs: ["var(--text-xs)", { lineHeight: "var(--leading-normal)" }],
        sm: ["var(--text-sm)", { lineHeight: "var(--leading-normal)" }],
        base: ["var(--text-base)", { lineHeight: "var(--leading-normal)" }],
        lg: ["var(--text-lg)", { lineHeight: "var(--leading-relaxed)" }],
        xl: ["var(--text-xl)", { lineHeight: "var(--leading-relaxed)" }],
        "2xl": ["var(--text-2xl)", { lineHeight: "var(--leading-tight)" }],
        "3xl": ["var(--text-3xl)", { lineHeight: "var(--leading-tight)" }],
        "4xl": ["var(--text-4xl)", { lineHeight: "var(--leading-tight)" }],
        "5xl": ["var(--text-5xl)", { lineHeight: "var(--leading-tight)" }],
        "6xl": ["var(--text-6xl)", { lineHeight: "var(--leading-none)" }],
        "7xl": ["var(--text-7xl)", { lineHeight: "var(--leading-none)" }],
      },
      // Shadows with design tokens
      boxShadow: {
        e1: "var(--shadow-e1)",
        e2: "var(--shadow-e2)",
        e3: "var(--shadow-e3)",
        e4: "var(--shadow-e4)",
        glow: "var(--shadow-glow)",
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
      // Transitions
      transitionDuration: {
        fast: "150ms",
        DEFAULT: "200ms",
        slow: "300ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      // Z-index scale
      zIndex: {
        dropdown: "1000",
        sticky: "1100",
        fixed: "1200",
        "modal-backdrop": "1300",
        modal: "1400",
        popover: "1500",
        tooltip: "1600",
      },
      // Max widths
      maxWidth: {
        prose: "var(--max-width-prose)",
        container: "var(--max-width-container)",
        wide: "var(--max-width-wide)",
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
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

