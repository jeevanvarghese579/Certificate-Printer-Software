import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          konva: ['konva', 'react-konva'],
          dnd: ['react-dnd', 'react-dnd-html5-backend'],
          export: ['jspdf'],
        },
      },
    },
  },
});
