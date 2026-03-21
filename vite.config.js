import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/salmones-viz/',
  server: {
    host: '0.0.0.0',
    port: 5180,
  },
  build: {
    outDir: 'dist',
  },
})
