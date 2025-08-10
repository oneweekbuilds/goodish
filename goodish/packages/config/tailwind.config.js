/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // App and Pages within any app using this preset
    '../../apps/**/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../apps/**/components/**/*.{js,ts,jsx,tsx,mdx}',
    // Shared UI package components
    '../../packages/ui/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        white: '#FFFFFF',
        goodish: {
          green: '#00473E',
          teal: '#00AFC1',
          amber: '#FFB400',
          gray: '#E5E5E5',
          charcoal: '#1A1A1A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
