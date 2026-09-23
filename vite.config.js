import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Trave_Dec/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    open: true,
  },
});
