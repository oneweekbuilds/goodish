import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Custom plugin to copy static files to dist
function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    writeBundle() {
      // Ensure dist directory exists
      if (!existsSync('dist')) {
        mkdirSync('dist', { recursive: true });
      }
      
      // Copy manifest.json
      copyFileSync('manifest.json', 'dist/manifest.json');
      
      // Copy popup HTML
      if (!existsSync('dist/popup')) {
        mkdirSync('dist/popup', { recursive: true });
      }
      copyFileSync('src/popup/index.html', 'dist/popup/index.html');
    }
  };
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyDirBeforeWrite: true,
    sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : false,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.js'),
        background: resolve(__dirname, 'src/background.js'),
        popup: resolve(__dirname, 'src/popup/popup.js'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Put popup.js inside popup folder, others at root
          if (chunkInfo.name === 'popup') {
            return 'popup/[name].js';
          }
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  plugins: [copyExtensionFiles()],
});

