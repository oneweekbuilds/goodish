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
                'bg-page': '#F8F9FA',
                'surface-default': '#FFFFFF',
                'primary-blue': '#2563EB', // 70% dominance
                'accent-green': '#10B981', // 30% dominance
                'text-main': '#1E293B',
                'text-muted': '#64748B',
                'border-light': 'rgba(30, 41, 59, 0.06)',
            },
            borderRadius: {
                'radius-sm': '12px',
                'radius-md': '20px',
                'radius-lg': '28px',
                'pill': '9999px',
            },
            boxShadow: {
                'soft': '0 4px 12px rgba(0, 0, 0, 0.03)',
                'medium': '0 12px 24px rgba(15, 23, 42, 0.06)',
                'strong': '0 26px 70px rgba(15, 23, 42, 0.14)',
                'glow': '0 0 15px rgba(37, 99, 235, 0.3)',
            },
            animation: {
                'pulse-slow': 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'scroll-slow': 'scroll 40s linear infinite',
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
