import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  plugins: [
    preact(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'public/*', dest: '.' },
        { src: 'src/pages/*.html', dest: '.' }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: path.resolve(__dirname, 'src/background/worker.ts'),
        popup: path.resolve(__dirname, 'src/pages/popup.tsx'),
        options: path.resolve(__dirname, 'src/pages/options.tsx'),
        reddit: path.resolve(__dirname, 'src/content/reddit.ts'),
        youtube: path.resolve(__dirname, 'src/content/youtube.ts'),
        instagram: path.resolve(__dirname, 'src/content/instagram.ts'),
        x: path.resolve(__dirname, 'src/content/x.ts'),
        facebook: path.resolve(__dirname, 'src/content/facebook.ts'),
        indicator: path.resolve(__dirname, 'src/content/indicator.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: '[name].[ext]'
      }
    },
    minify: false,
    sourcemap: true
  }
});
