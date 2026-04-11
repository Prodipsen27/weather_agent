import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Explicitly set env settings to ensure fallback logic and prefixing works as expected in Vite 8
  envDir: './',
  envPrefix: 'VITE_',
})
