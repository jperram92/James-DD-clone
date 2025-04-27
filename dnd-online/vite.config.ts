import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all available network interfaces
    port: 8080,       // Use a different port
    strictPort: true, // Fail if port is already in use
    open: true,       // Open browser automatically
  },
})
