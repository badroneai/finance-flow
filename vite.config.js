import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages / static hosting: keep relative asset paths
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
  build: {
    rollupOptions: {
      input: {
        app: 'finance-flow.html',
      },
    },
  },
});
