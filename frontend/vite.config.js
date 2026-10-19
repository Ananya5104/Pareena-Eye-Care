import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, /api and /media are forwarded to the Django server, so no CORS setup is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/media': 'http://localhost:8000',
    },
  },
})
