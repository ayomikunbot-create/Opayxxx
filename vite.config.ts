import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVitePlugin } from '@tanstack/router-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVitePlugin()
  ],
})
