import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './', // Ensures relative assets work on GitHub Pages subpaths (e.g. /distro-tailor/)
  resolve: {
    alias: {
      '@distro-tailor/core': path.resolve(__dirname, '../core/src/index.ts')
    }
  },
  server: {
    port: 3333
  }
});
