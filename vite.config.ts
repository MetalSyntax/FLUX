import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'FLUX Reader',
        short_name: 'FLUX',
        description: 'Your premium reading experience',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
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