/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
            },
            colors: {
                // === Existing AlgorithmLens design tokens (preserved) ===
                'bg-page': '#F7F8FC',
                'surface-default': '#FFFFFF',
                'primary-blue': '#2563EB', // 70% dominance
                'accent-green': '#10B981', // 30% dominance
                'text-main': '#1E293B',
                'text-muted': '#4B5563', // Darkened from #64748B for WCAG AA contrast
                'border-light': 'rgba(30, 41, 59, 0.08)',
                'status-success': '#059669',
                'status-error': '#DC2626',
                'status-warning': '#D97706',
                // Expanded blue palette for richer UI
                'blue-50': '#EFF6FF',
                'blue-100': '#DBEAFE',
                'blue-200': '#BFDBFE',
                'blue-600': '#2563EB',
                'blue-700': '#1D4ED8',
                'blue-800': '#1E40AF',
                // Expanded green palette
                'green-50': '#ECFDF5',
                'green-100': '#D1FAE5',
                'green-200': '#A7F3D0',
                'green-500': '#10B981',
                'green-600': '#059669',
                'green-700': '#047857',
                // === shadcn/ui CSS variable-based colors ===
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                // Existing AlgorithmLens tokens (preserved)
                'radius-sm': '12px',
                'radius-md': '20px',
                'radius-lg': '28px',
                'pill': '9999px',
                // shadcn/ui radius tokens
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            boxShadow: {
                'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
                'medium': '0 8px 24px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.03)',
                'strong': '0 20px 60px rgba(15, 23, 42, 0.12), 0 4px 16px rgba(15, 23, 42, 0.04)',
                'glow': '0 0 20px rgba(37, 99, 235, 0.25), 0 0 6px rgba(37, 99, 235, 0.1)',
                'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04)',
                'card-hover': '0 4px 12px rgba(0, 0, 0, 0.06), 0 8px 32px rgba(15, 23, 42, 0.06)',
                'hero': '0 8px 40px rgba(37, 99, 235, 0.1), 0 2px 8px rgba(37, 99, 235, 0.04)',
            },
            animation: {
                'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'scroll-slow': 'scroll 40s linear infinite',
                // shadcn/ui animations
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
            letterSpacing: {
                'tight-hero': '-0.03em',
                'tight-heading': '-0.02em',
                'tight-card': '-0.01em',
                'wide-label': '0.05em',
                'wider-label': '0.1em',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            },
            keyframes: {
                scroll: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                // shadcn/ui keyframes
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            }
        },
    },
    plugins: [require("tailwindcss-animate")],
}
