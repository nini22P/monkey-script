import { defineConfig } from 'vite'
import userscriptPlugin from './scripts/vite-plugin-userscript.ts'

export default defineConfig({
  plugins: [userscriptPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: false,
  },
})
