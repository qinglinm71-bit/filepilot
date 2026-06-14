import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), VitePWA({ registerType: 'autoUpdate', manifest: {
    name: 'FilePilot', short_name: 'FilePilot', description: '文件只在浏览器本地处理的效率工具',
    theme_color: '#0b1f3a', background_color: '#f4f7fb', display: 'standalone',
    icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  } })],
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', include: ['src/**/*.test.{ts,tsx}'] },
})
