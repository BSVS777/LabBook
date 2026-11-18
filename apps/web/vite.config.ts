import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const WEB_PORT = 5173;
const API_URL = 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: WEB_PORT,
    proxy: {
      '/api': { target: API_URL, changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
