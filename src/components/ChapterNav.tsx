import { goToShot } from '../cinema/ScrollDirector'
import { SHOTS } from '../cinema/director'
import { useSceneStore } from '../store/useSceneStore'

/** Shot list along the edge of the frame; click to travel to a shot. */
export function ChapterNav() {
  const stage = useSceneStore((s) => s.stage)
  return (
    <nav className="chapters" aria-label="Các cảnh">
      {SHOTS.map((s, i) => (
        <button
          key={s.id}
          type="button"
          className={`chapters__item ${i === stage ? 'is-active' : ''}`}
          aria-current={i === stage ? 'step' : undefined}
          onClick={() => goToShot(i)}
        >
          <span className="chapters__dot" aria-hidden="true" />
          <span className="chapters__label">{s.title}</span>
        </button>
      ))}
    </nav>
  )
}
