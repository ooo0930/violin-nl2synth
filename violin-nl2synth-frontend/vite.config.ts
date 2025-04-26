import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/translate': 'http://localhost:3000',
      '/parametrize': 'http://localhost:3000',
      '/play': 'http://localhost:3000'
    }
  }
});
