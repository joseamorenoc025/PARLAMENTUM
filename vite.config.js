import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { 
    port: 5173,
    open: '/app.html' 
  },
  build: { 
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'app.html'
      }
    }
  },
  test: {
    exclude: ['node_modules', 'dist', 'test/e2e/**/*']
  }
});
