import type { Config } from 'tailwindcss'

export default {
  content: [],
  theme: {
    extend: {
      colors: {
        goodish: {
          green: '#00473E',
          teal: '#00AFC1',
          amber: '#FFB400',
          gray: '#E5E5E5',
          charcoal: '#1A1A1A',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
