import { defineConfig } from 'vite';
import { resolve, join } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Custom plugin to copy static files to the build output directory
function copyExtensionFiles() {
  let resolvedOutDir = '';
  let projectRoot = '';

  return {
    name: 'copy-extension-files',
    configResolved(config) {
      // Use the fully resolved output directory from Vite
      resolvedOutDir = config.build.outDir.startsWith('/')
        ? config.build.outDir
        : resolve(config.root, config.build.outDir);
      projectRoot = config.root;
    },
    writeBundle() {
      const srcDir = join(projectRoot, 'src');
      const iconsSource = join(projectRoot, 'icons');

      // Ensure output directories exist
      const popupDir = join(resolvedOutDir, 'popup');
      const iconsDir = join(resolvedOutDir, 'icons');
      mkdirSync(popupDir, { recursive: true });
      mkdirSync(iconsDir, { recursive: true });

      // Copy manifest.json from project root
      const manifestSrc = join(projectRoot, 'manifest.json');
      const manifestDest = join(resolvedOutDir, 'manifest.json');
      if (existsSync(manifestSrc)) {
        copyFileSync(manifestSrc, manifestDest);
        console.log('[copy-extension-files] Copied manifest.json');
      } else {
        console.warn('[copy-extension-files] WARNING: manifest.json not found at', manifestSrc);
      }

      // Copy popup/index.html
      const popupSrc = join(srcDir, 'popup', 'index.html');
      const popupDest = join(popupDir, 'index.html');
      if (existsSync(popupSrc)) {
        copyFileSync(popupSrc, popupDest);
        console.log('[copy-extension-files] Copied popup/index.html');
      } else {
        console.warn('[copy-extension-files] WARNING: popup/index.html not found at', popupSrc);
      }

      // Copy icons (including logo.png used by popup header) [Audit 6 C1]
      for (const icon of ['icon16.png', 'icon48.png', 'icon128.png', 'logo.png']) {
        const iconSrc = join(iconsSource, icon);
        const iconDest = join(iconsDir, icon);
        if (existsSync(iconSrc)) {
          copyFileSync(iconSrc, iconDest);
          console.log(`[copy-extension-files] Copied icons/${icon}`);
        } else {
          console.warn(`[copy-extension-files] WARNING: ${icon} not found at`, iconSrc);
        }
      }

      console.log('[copy-extension-files] All static files copied to', resolvedOutDir);
    }
  };
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : false,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.js'),
        background: resolve(__dirname, 'src/background.js'),
        popup: resolve(__dirname, 'src/popup/popup.js'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
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
