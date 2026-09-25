/// <reference types="vite/client" />

declare module 'virtual:model-manifest' {
  const manifest: Record<string, string>
  export default manifest
}

/** True when public/audio/nhac-nen.mp3 exists at build time. */
declare const __HAS_CUSTOM_TRACK__: boolean
