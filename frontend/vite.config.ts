import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { config } from 'dotenv';
config({ path: '.env', quiet: true });
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: Number(process.env.FRONTEND_PORT || 3000),
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.API_TARGET || 'http://localhost:4000',
        changeOrigin: false,
        xfwd: false,
      },
    },
  },
  preview: {
    port: Number(process.env.FRONTEND_PORT || 3000),
    strictPort: true,
    headers: {
      'Content-Security-Policy':
        "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; font-src 'self'",
    },
  },
  build: { outDir: 'dist' },
});
