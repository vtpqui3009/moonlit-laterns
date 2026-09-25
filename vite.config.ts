import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { modelManifest } from './plugins/modelManifest.ts'

export default defineConfig({
  // Relative base so the built site works from any sub-path (static hosting, artifact preview).
  base: './',
  plugins: [react(), modelManifest()],
})
