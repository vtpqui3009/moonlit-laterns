import fs from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { modelManifest } from './plugins/modelManifest.ts'

/**
 * `--mode single` embeds the HDRI in the JS bundle as a data URI, for hosts
 * that only serve standard web file types (no .exr).
 */
function inlineHdri(): Plugin {
  const id = '\0inline-hdri'
  return {
    name: 'inline-hdri',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === './hdriUrl' && importer?.includes('NightEnvironment')) return id
    },
    load(loadId) {
      if (loadId !== id) return
      const b64 = fs.readFileSync('public/hdri/night_1k.exr').toString('base64')
      return `export default ${JSON.stringify('data:application/exr;base64,' + b64)}`
    },
  }
}

export default defineConfig(({ mode }) => ({
  // Relative base so the built site works from any sub-path (static hosting, artifact preview).
  base: './',
  plugins: [react(), modelManifest(), mode === 'single' && inlineHdri()],
  build: mode === 'single' ? { outDir: 'dist-single', copyPublicDir: false } : undefined,
}))
