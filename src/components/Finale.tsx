import { useEffect, useState } from 'react'
import { ambience } from '../audio/ambience'
import { goToShot } from '../cinema/ScrollDirector'
import { LETTER } from '../letter'
import { useSceneStore } from '../store/useSceneStore'

/**
 * Under the full moon: "Thả đèn ước" releases a paper lantern from the pond
 * toward the moon (see WishLantern); as it rises, the letter appears line by line.
 */
export function Finale() {
  const stage = useSceneStore((s) => s.stage)
  const started = useSceneStore((s) => s.started)
  const letterOpen = useSceneStore((s) => s.letterOpen)
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const [showLetter, setShowLetter] = useState(false)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (showLetter) setSeen(true)
  }, [showLetter])

  useEffect(() => {
    if (!letterOpen) {
      setShowLetter(false)
      setSeen(false)
      return
    }
    const t = setTimeout(() => setShowLetter(true), reducedMotion ? 300 : 3200)
    return () => clearTimeout(t)
  }, [letterOpen, reducedMotion])

  const release = () => {
    ambience.bell()
    useSceneStore.getState().set({ letterOpen: true })
  }
  const replay = () => {
    useSceneStore.getState().set({ letterOpen: false })
    goToShot(0)
  }

  const canRelease = started && stage === 3 && !letterOpen
  let row = 0

  return (
    <>
      <button type="button" className={`wish ${canRelease ? 'is-visible' : ''}`} onClick={release} tabIndex={canRelease ? 0 : -1}>
        <span className="wish__glow" aria-hidden="true" />
        Thả đèn ước
      </button>

      {showLetter && (
        <div className="letter-wrap" role="dialog" aria-label="Lá thư">
          <article className={`letter ${reducedMotion ? 'letter--still' : ''}`}>
            <p className="letter__line letter__greeting" style={{ animationDelay: `${row++ * 0.9}s` }}>
              {LETTER.greeting}
            </p>
            {LETTER.lines.map((l, i) =>
              l === '' ? (
                <div key={i} className="letter__gap" />
              ) : (
                <p key={i} className="letter__line" style={{ animationDelay: `${row++ * 0.9}s` }}>
                  {l}
                </p>
              ),
            )}
            <p className="letter__line letter__signature" style={{ animationDelay: `${row++ * 0.9 + 0.4}s` }}>
              {LETTER.signature}
            </p>
            <div className="letter__actions" style={{ animationDelay: `${row * 0.9 + 0.8}s` }}>
              <button type="button" onClick={() => setShowLetter(false)}>
                Ngắm trăng
              </button>
              <button type="button" onClick={replay}>
                Xem lại từ đầu
              </button>
            </div>
          </article>
        </div>
      )}
      {letterOpen && seen && !showLetter && (
        <button type="button" className="wish is-visible wish--reopen" onClick={() => setShowLetter(true)}>
          Đọc lại thư
        </button>
      )}
    </>
  )
}
