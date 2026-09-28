import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(process.cwd(), 'index.html'),
        content: resolve(process.cwd(), 'src/content/content.ts'),
      },
      output: {
        entryFileNames: (chunk) => chunk.name === 'content' ? 'content.js' : 'assets/[name]-[hash].js',
      },
    },
  },
})
