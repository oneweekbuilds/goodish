// vite.config.js
import { defineConfig } from "file:///sessions/admiring-great-hopper/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/admiring-great-hopper/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/node_modules/@vitejs/plugin-react/dist/index.js";
import { sentryVitePlugin } from "file:///sessions/admiring-great-hopper/mnt/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
var vite_config_default = defineConfig({
  cacheDir: "/tmp/.vite",
  plugins: [
    react(),
    // Sentry source map upload — only active in production builds
    // when SENTRY_AUTH_TOKEN and SENTRY_ORG/SENTRY_PROJECT are set.
    // Until those env vars are configured, the plugin is a no-op.
    sentryVitePlugin({
      org: process.env.SENTRY_ORG || "algorithmlens",
      project: process.env.SENTRY_PROJECT || "algorithmlens-web",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: {
        name: `algorithmlens-web@${process.env.npm_package_version || "0.0.0"}`
      },
      sourcemaps: {
        filesToDeleteAfterUpload: ["./dist/**/*.map"]
      },
      telemetry: false,
      // Only upload when auth token is present (skip in local builds)
      disable: !process.env.SENTRY_AUTH_TOKEN
    })
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false
      }
    }
  },
  // (#40) Code Splitting Configuration
  // Splits vendor libraries and feature groups into separate chunks for better caching
  // and parallel loading. This reduces initial bundle size.
  build: {
    sourcemap: true,
    // Required for Sentry source map upload
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          vendor: ["react", "react-dom", "react-router-dom"],
          // Animation library
          animations: ["framer-motion"],
          // Payment processing
          stripe: ["@stripe/stripe-js"],
          // Database
          supabase: ["@supabase/supabase-js"],
          // Error tracking
          sentry: ["@sentry/react"],
          // Utilities
          ui: ["lucide-react", "clsx", "tailwind-merge"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvYWRtaXJpbmctZ3JlYXQtaG9wcGVyL21udC9BbGdvcml0aG1MZW5zX1BhcmVudEZvbGRlci9BbGdvcml0aG1MZW5zX0Nvd29ya1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL2FkbWlyaW5nLWdyZWF0LWhvcHBlci9tbnQvQWxnb3JpdGhtTGVuc19QYXJlbnRGb2xkZXIvQWxnb3JpdGhtTGVuc19Db3dvcmsvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL2FkbWlyaW5nLWdyZWF0LWhvcHBlci9tbnQvQWxnb3JpdGhtTGVuc19QYXJlbnRGb2xkZXIvQWxnb3JpdGhtTGVuc19Db3dvcmsvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXHJcbmltcG9ydCB7IHNlbnRyeVZpdGVQbHVnaW4gfSBmcm9tICdAc2VudHJ5L3ZpdGUtcGx1Z2luJ1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgY2FjaGVEaXI6ICcvdG1wLy52aXRlJyxcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgLy8gU2VudHJ5IHNvdXJjZSBtYXAgdXBsb2FkIFx1MjAxNCBvbmx5IGFjdGl2ZSBpbiBwcm9kdWN0aW9uIGJ1aWxkc1xyXG4gICAgLy8gd2hlbiBTRU5UUllfQVVUSF9UT0tFTiBhbmQgU0VOVFJZX09SRy9TRU5UUllfUFJPSkVDVCBhcmUgc2V0LlxyXG4gICAgLy8gVW50aWwgdGhvc2UgZW52IHZhcnMgYXJlIGNvbmZpZ3VyZWQsIHRoZSBwbHVnaW4gaXMgYSBuby1vcC5cclxuICAgIHNlbnRyeVZpdGVQbHVnaW4oe1xyXG4gICAgICBvcmc6IHByb2Nlc3MuZW52LlNFTlRSWV9PUkcgfHwgJ2FsZ29yaXRobWxlbnMnLFxyXG4gICAgICBwcm9qZWN0OiBwcm9jZXNzLmVudi5TRU5UUllfUFJPSkVDVCB8fCAnYWxnb3JpdGhtbGVucy13ZWInLFxyXG4gICAgICBhdXRoVG9rZW46IHByb2Nlc3MuZW52LlNFTlRSWV9BVVRIX1RPS0VOLFxyXG4gICAgICByZWxlYXNlOiB7XHJcbiAgICAgICAgbmFtZTogYGFsZ29yaXRobWxlbnMtd2ViQCR7cHJvY2Vzcy5lbnYubnBtX3BhY2thZ2VfdmVyc2lvbiB8fCAnMC4wLjAnfWAsXHJcbiAgICAgIH0sXHJcbiAgICAgIHNvdXJjZW1hcHM6IHtcclxuICAgICAgICBmaWxlc1RvRGVsZXRlQWZ0ZXJVcGxvYWQ6IFsnLi9kaXN0LyoqLyoubWFwJ10sXHJcbiAgICAgIH0sXHJcbiAgICAgIHRlbGVtZXRyeTogZmFsc2UsXHJcbiAgICAgIC8vIE9ubHkgdXBsb2FkIHdoZW4gYXV0aCB0b2tlbiBpcyBwcmVzZW50IChza2lwIGluIGxvY2FsIGJ1aWxkcylcclxuICAgICAgZGlzYWJsZTogIXByb2Nlc3MuZW52LlNFTlRSWV9BVVRIX1RPS0VOLFxyXG4gICAgfSksXHJcbiAgXSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6ODAwMCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG4gIC8vICgjNDApIENvZGUgU3BsaXR0aW5nIENvbmZpZ3VyYXRpb25cclxuICAvLyBTcGxpdHMgdmVuZG9yIGxpYnJhcmllcyBhbmQgZmVhdHVyZSBncm91cHMgaW50byBzZXBhcmF0ZSBjaHVua3MgZm9yIGJldHRlciBjYWNoaW5nXHJcbiAgLy8gYW5kIHBhcmFsbGVsIGxvYWRpbmcuIFRoaXMgcmVkdWNlcyBpbml0aWFsIGJ1bmRsZSBzaXplLlxyXG4gIGJ1aWxkOiB7XHJcbiAgICBzb3VyY2VtYXA6IHRydWUsIC8vIFJlcXVpcmVkIGZvciBTZW50cnkgc291cmNlIG1hcCB1cGxvYWRcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAvLyBWZW5kb3IgbGlicmFyaWVzXHJcbiAgICAgICAgICB2ZW5kb3I6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcclxuICAgICAgICAgIC8vIEFuaW1hdGlvbiBsaWJyYXJ5XHJcbiAgICAgICAgICBhbmltYXRpb25zOiBbJ2ZyYW1lci1tb3Rpb24nXSxcclxuICAgICAgICAgIC8vIFBheW1lbnQgcHJvY2Vzc2luZ1xyXG4gICAgICAgICAgc3RyaXBlOiBbJ0BzdHJpcGUvc3RyaXBlLWpzJ10sXHJcbiAgICAgICAgICAvLyBEYXRhYmFzZVxyXG4gICAgICAgICAgc3VwYWJhc2U6IFsnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ10sXHJcbiAgICAgICAgICAvLyBFcnJvciB0cmFja2luZ1xyXG4gICAgICAgICAgc2VudHJ5OiBbJ0BzZW50cnkvcmVhY3QnXSxcclxuICAgICAgICAgIC8vIFV0aWxpdGllc1xyXG4gICAgICAgICAgdWk6IFsnbHVjaWRlLXJlYWN0JywgJ2Nsc3gnLCAndGFpbHdpbmQtbWVyZ2UnXSxcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMmEsU0FBUyxvQkFBb0I7QUFDeGMsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsd0JBQXdCO0FBR2pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFVBQVU7QUFBQSxFQUNWLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUlOLGlCQUFpQjtBQUFBLE1BQ2YsS0FBSyxRQUFRLElBQUksY0FBYztBQUFBLE1BQy9CLFNBQVMsUUFBUSxJQUFJLGtCQUFrQjtBQUFBLE1BQ3ZDLFdBQVcsUUFBUSxJQUFJO0FBQUEsTUFDdkIsU0FBUztBQUFBLFFBQ1AsTUFBTSxxQkFBcUIsUUFBUSxJQUFJLHVCQUF1QixPQUFPO0FBQUEsTUFDdkU7QUFBQSxNQUNBLFlBQVk7QUFBQSxRQUNWLDBCQUEwQixDQUFDLGlCQUFpQjtBQUFBLE1BQzlDO0FBQUEsTUFDQSxXQUFXO0FBQUE7QUFBQSxNQUVYLFNBQVMsQ0FBQyxRQUFRLElBQUk7QUFBQSxJQUN4QixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSUEsT0FBTztBQUFBLElBQ0wsV0FBVztBQUFBO0FBQUEsSUFDWCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUE7QUFBQSxVQUVaLFFBQVEsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUE7QUFBQSxVQUVqRCxZQUFZLENBQUMsZUFBZTtBQUFBO0FBQUEsVUFFNUIsUUFBUSxDQUFDLG1CQUFtQjtBQUFBO0FBQUEsVUFFNUIsVUFBVSxDQUFDLHVCQUF1QjtBQUFBO0FBQUEsVUFFbEMsUUFBUSxDQUFDLGVBQWU7QUFBQTtBQUFBLFVBRXhCLElBQUksQ0FBQyxnQkFBZ0IsUUFBUSxnQkFBZ0I7QUFBQSxRQUMvQztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
