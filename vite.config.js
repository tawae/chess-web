import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Gỡ bỏ hoặc comment out các header này nếu không cần COEP nữa
    // headers: {
    //   'Cross-Origin-Embedder-Policy': 'require-corp',
    //   'Cross-Origin-Opener-Policy': 'same-origin',
    // },
  },
  server: {
    port: 3000
  },  
  optimizeDeps: {
    exclude: ['stockfish'],
  },
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
})
