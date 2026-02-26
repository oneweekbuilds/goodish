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
            },
            borderRadius: {
                'radius-sm': '12px',
                'radius-md': '20px',
                'radius-lg': '28px',
                'pill': '9999px',
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
                }
            }
        },
    },
    plugins: [],
}
