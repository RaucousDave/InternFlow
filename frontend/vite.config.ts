import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

// Auth cookies go straight to the backend origin (same-site dev setup),
// so no /api proxy is needed. VITE_API_URL defaults to the backend below.
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: { port: 5173 },
})
