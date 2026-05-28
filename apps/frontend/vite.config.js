import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) {
              return 'vendor-react'
            }
            if (id.includes('zustand')) {
              return 'vendor-state'
            }
            if (id.includes('axios')) {
              return 'vendor-http'
            }
            if (id.includes('laravel-echo') || id.includes('pusher-js')) {
              return 'vendor-realtime'
            }
            if (id.includes('sonner')) {
              return 'vendor-ui'
            }
          }
        }
      }
    }
  }
})
