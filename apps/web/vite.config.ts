import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Prevent Vite from caching workspace packages — changes are picked up immediately
  optimizeDeps: {
    exclude: ['@gem/api-client', '@gem/validators', '@gem/utils'],
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:5189',
        changeOrigin: true,
      },
    },
  },
});
