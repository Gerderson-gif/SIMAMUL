import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Cuando el frontend diga "/api-local", Vite lo enviará a Python (puerto 8000)
      '/api-local': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-local/, ''),
      },
    },
  },
})