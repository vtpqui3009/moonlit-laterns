import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const VIRTUAL_ID = 'virtual:model-manifest'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/**
 * Scans public/models for *.glb / *.gltf files and exposes them as
 * `virtual:model-manifest` → { [id]: "models/<file>" }.
 * Dropping `public/models/ong-sao.glb` makes the <ModelSlot id="ong-sao"> load it
 * instead of the procedural fallback. The dev server reloads when files change.
 */
export function modelManifest(): Plugin {
  let modelsDir = ''

  const scan = (): Record<string, string> => {
    if (!fs.existsSync(modelsDir)) return {}
    const out: Record<string, string> = {}
    for (const file of fs.readdirSync(modelsDir)) {
      const ext = path.extname(file).toLowerCase()
      if (ext !== '.glb' && ext !== '.gltf') continue
      out[path.basename(file, ext)] = `models/${file}`
    }
    return out
  }

  return {
    name: 'model-manifest',
    configResolved(config) {
      modelsDir = path.resolve(config.publicDir, 'models')
    },
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id === RESOLVED_ID) return `export default ${JSON.stringify(scan())}`
    },
    configureServer(server) {
      server.watcher.add(modelsDir)
      const onChange = (file: string) => {
        if (!file.startsWith(modelsDir)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', onChange)
      server.watcher.on('unlink', onChange)
    },
  }
}
