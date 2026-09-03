import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // GitHub Pages production build uses /frontend/; dev/tunnel uses /
  base: mode === 'development' ? '/' : '/frontend/',
}))
