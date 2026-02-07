import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        pixi: resolve(__dirname, 'pixi.html'),
      },
    },
  },
  server: {
    host: true,
    port: 3000,
  },
});
