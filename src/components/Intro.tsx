import { ambience } from '../audio/ambience'
import { INTRO } from '../letter'
import { useSceneStore } from '../store/useSceneStore'

/** The greeting card shown once everything is ready. The tap also unlocks sound. */
export function IntroCard() {
  const start = () => {
    const { reducedMotion, set } = useSceneStore.getState()
    window.scrollTo(0, 0)
    ambience.start({ drum: !reducedMotion })
    set({ started: true })
  }
  return (
    <div className="intro">
      <p className="intro__eyebrow">{INTRO.eyebrow}</p>
      <h1 className="intro__title">{INTRO.title}</h1>
      <p className="intro__subtitle">{INTRO.subtitle}</p>
      <button type="button" className="intro__start" onClick={start} autoFocus>
        {INTRO.start}
      </button>
      <p className="intro__hint">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 14v-4h4l5-4v16l-5-4H3zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
        </svg>
        {INTRO.hint}
      </p>
    </div>
  )
}
