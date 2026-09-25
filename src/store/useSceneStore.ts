import { create } from 'zustand'

export type Quality = 'high' | 'low'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const isLikelyMobile = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 768)

interface SceneState {
  /** Current cinematic stage: 0 hoàng hôn · 1 mâm cỗ · 2 rước đèn · 3 trăng rằm */
  stage: number
  /** Overall scroll progress 0..1 across all stages */
  progress: number
  quality: Quality
  reducedMotion: boolean
  setStage: (stage: number) => void
  setProgress: (progress: number) => void
  setQuality: (quality: Quality) => void
}

export const useSceneStore = create<SceneState>((set) => ({
  stage: 0,
  progress: 0,
  quality: isLikelyMobile() ? 'low' : 'high',
  reducedMotion: prefersReducedMotion(),
  setStage: (stage) => set({ stage }),
  setProgress: (progress) => set({ progress }),
  setQuality: (quality) => set({ quality }),
}))

if (typeof window !== 'undefined' && window.matchMedia) {
  window
    .matchMedia('(prefers-reduced-motion: reduce)')
    .addEventListener('change', (e) => useSceneStore.setState({ reducedMotion: e.matches }))
}
