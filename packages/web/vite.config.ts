import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@distro-tailor/core': path.resolve(__dirname, '../core/src/index.ts')
    }
  },
  server: {
    port: 3333
  }
});
