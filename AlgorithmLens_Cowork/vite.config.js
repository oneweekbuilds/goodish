import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  cacheDir: '/tmp/.vite',
  plugins: [
    react(),
    // Sentry source map upload — only active in production builds
    // when SENTRY_AUTH_TOKEN and SENTRY_ORG/SENTRY_PROJECT are set.
    // Until those env vars are configured, the plugin is a no-op.
    sentryVitePlugin({
      org: process.env.SENTRY_ORG || 'algorithmlens',
      project: process.env.SENTRY_PROJECT || 'algorithmlens-web',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: {
        name: `algorithmlens-web@${process.env.npm_package_version || '0.0.0'}`,
      },
      sourcemaps: {
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
      telemetry: false,
      // Only upload when auth token is present (skip in local builds)
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
  // (#40) Code Splitting Configuration
  // Splits vendor libraries and feature groups into separate chunks for better caching
  // and parallel loading. This reduces initial bundle size.
  build: {
    sourcemap: true, // Required for Sentry source map upload
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
          // Error tracking
          sentry: ['@sentry/react'],
          // Utilities
          ui: ['lucide-react', 'clsx', 'tailwind-merge'],
        }
      }
    }
  }
})
