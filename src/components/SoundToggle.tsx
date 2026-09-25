import { ambience } from '../audio/ambience'
import { useSceneStore } from '../store/useSceneStore'

/** Mute / unmute the night's soundscape. */
export function SoundToggle() {
  const started = useSceneStore((s) => s.started)
  const muted = useSceneStore((s) => s.muted)
  if (!started) return null
  const toggle = () => {
    ambience.setMuted(!muted)
    useSceneStore.getState().set({ muted: !muted })
  }
  return (
    <button type="button" className="sound" onClick={toggle} aria-pressed={muted} aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 14v-4h4l5-4v16l-5-4H3z" />
        {muted ? <path d="M16 9l5 6M21 9l-5 6" /> : <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />}
      </svg>
    </button>
  )
}
