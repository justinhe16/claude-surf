import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Production optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ['react', 'react-dom'],
          // UI library chunk
          ui: ['framer-motion', 'lucide-react'],
        },
      },
    },
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    chunkSizeWarningLimit: 1000, // Warn on chunks larger than 1MB
    // Source maps for debugging production issues
    sourcemap: false, // Disable for smaller bundle size
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
  publicDir: 'assets',
});
