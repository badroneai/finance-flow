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
    // ملاحظة: emptyOutDir: false لأن بعض البيئات لا تسمح بحذف dist/
    // شغّل `npm run clean` يدوياً قبل البناء إذا أردت تنظيف dist/
    emptyOutDir: false,
    rollupOptions: {
      input: {
        app: 'finance-flow.html',
        landing: 'landing.html',
        index: 'index.html',
      },
      output: {
        manualChunks: {
          'supabase': ['@supabase/supabase-js'],
          'router': ['react-router-dom'],
        },
      },
    },
  },
});
