import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      util: 'util',
      process: 'process/browser',
      buffer: 'buffer',
      events: 'events',
    }
  },
  base: '/',
  build: {
    outDir: 'dist',
  },
  server: {
    watch: {
      usePolling: true,
    },
    hmr: true,
    host: true
  }
})