/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 uses the "native" platform
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Font families — Geist font loaded via expo-font
      fontFamily: {
        'geist': ['Geist-Regular'],
        'geist-medium': ['Geist-Medium'],
        'geist-semibold': ['Geist-SemiBold'],
        'geist-bold': ['Geist-Bold'],
      },
      // Letter spacing matching the website design
      letterSpacing: {
        'hero': '-0.03em',
        'heading': '-0.02em',
        'card': '-0.01em',
      },
    },
  },
  plugins: [],
};
