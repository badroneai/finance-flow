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
    // إذا فشل تنظيف dist/ (ملفات مقفلة من deploy سابق)، أكمل البناء بدون حذفها أولاً
    emptyOutDir: false,
    rollupOptions: {
      input: {
        app: 'finance-flow.html',
        landing: 'landing.html',
        index: 'index.html',
      },
      output: {
        manualChunks: {
          'pdf-lib': ['jspdf', 'html2canvas'],
          'supabase': ['@supabase/supabase-js'],
          'router': ['react-router-dom'],
        },
      },
    },
  },
});
