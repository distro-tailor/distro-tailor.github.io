import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [tailwindcss()],
  base: './', // Ensures relative assets work on GitHub Pages subpaths (e.g. /distro-tailor/)
  resolve: {
    alias: {
      '@distro-tailor/core': path.resolve(import.meta.dirname, '../core/src/index.ts')
    }
  },
  server: {
    port: 3333
  }
});
