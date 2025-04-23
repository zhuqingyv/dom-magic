import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DomMagic',
      fileName: 'dom-magic'
    },
    rollupOptions: {
      output: {
        globals: {
          'dom-magic': 'DomMagic'
        }
      }
    },
  },
  resolve: {
    alias: {
      '@dom-magic': resolve(__dirname, 'src/main'),
      '@base': resolve(__dirname, 'src/base'),
    }
  },
  server: {
    port: 3000,
    open: true
  }
}); 