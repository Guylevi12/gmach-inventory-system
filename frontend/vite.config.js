// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    // Raise warning threshold a bit after splitting vendor chunks
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Split heavy deps to separate chunks; other deps stay bundled
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('react')) return 'react';
          }
          return undefined;
        }
      }
    }
  },
});
