import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const extensionBuild = mode === 'extension'
  const input: Record<string, string> = extensionBuild ? {
    content: resolve(process.cwd(), 'src/content/content.ts'),
    background: resolve(process.cwd(), 'src/background/background.ts'),
  } : {
    popup: resolve(process.cwd(), 'index.html'),
  }

  return {
    plugins: [react(), tailwindcss()],
    build: {
      emptyOutDir: !extensionBuild,
      rollupOptions: {
        input,
        output: {
          entryFileNames: (chunk) => chunk.name === 'content' ? 'content.js'
            : chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js',
        },
      },
    },
  }
})
