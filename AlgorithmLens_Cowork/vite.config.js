import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  cacheDir: '/tmp/.vite',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // (#40) Code Splitting Configuration
  // Splits vendor libraries and feature groups into separate chunks for better caching
  // and parallel loading. This reduces initial bundle size.
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Animation library
          animations: ['framer-motion'],
          // Payment processing
          stripe: ['@stripe/stripe-js'],
          // Database
          supabase: ['@supabase/supabase-js'],
          // Utilities
          ui: ['lucide-react', 'clsx', 'tailwind-merge'],
        }
      }
    }
  }
})
