import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all API requests to backend
      '/api': {
        target: 'http://localhost:6626',
        changeOrigin: true,
      },
      // Proxy static images to backend
      '/img': {
        target: 'http://localhost:6626',
        changeOrigin: true,
      },
    },
  },
})
