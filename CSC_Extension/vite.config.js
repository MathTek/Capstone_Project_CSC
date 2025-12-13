import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    svelte(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/manifest.json',
          dest: '.'
        },
        {
          src: 'src/popup.html',
          dest: '.'
        },
        {
          src: 'public/vite.svg',
          dest: '.'
        },
        {
          src: 'public/icon.svg',
          dest: '.'
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.js'),
        background: resolve(__dirname, 'src/background/background.js'),
        content: resolve(__dirname, 'src/content/content.js')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId;
          if (facadeModuleId) {
            if (facadeModuleId.includes('background')) {
              return 'background.js';
            }
            if (facadeModuleId.includes('content')) {
              return 'content.js';
            }
            if (facadeModuleId.includes('popup')) {
              return 'popup.js';
            }
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'popup.css';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    },
    copyPublicDir: false
  }
});
