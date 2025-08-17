/** @type {import('tailwindcss').Config} */
const shared = require('@goodish/config/tailwind.config.ts').default

module.exports = {
  presets: [shared],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
}
