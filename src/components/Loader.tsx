import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'
import { useSceneStore } from '../store/useSceneStore'
import { IntroCard } from './Intro'

/**
 * Full-screen veil: real asset progress (useProgress), then the greeting card
 * as soon as everything is downloaded. Shaders compile behind the greeting;
 * "Bắt đầu" unlocks once they're ready. Scrolling stays locked until the tap.
 */
export function Loader() {
  const { progress, item, loaded, total } = useProgress()
  const ready = useSceneStore((s) => s.ready)
  const started = useSceneStore((s) => s.started)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', !started)
    if (!started) return
    const t = setTimeout(() => setGone(true), 1600)
    return () => clearTimeout(t)
  }, [started])

  if (gone) return null
  const name = item ? item.split('/').pop()?.split('?')[0] : ''
  const assetsDone = progress >= 100

  return (
    <div className={`loader ${started ? 'loader--done' : ''} ${assetsDone ? 'loader--ready' : ''}`} aria-live="polite">
      <div className="loader__moon" />
      {assetsDone ? (
        <IntroCard ready={ready} />
      ) : (
        <>
          <p className="loader__title">Đang chuẩn bị đêm hội…</p>
          <div className="loader__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
            <span style={{ transform: `scaleX(${progress / 100})` }} />
          </div>
          <p className="loader__item">
            {Math.round(progress)}% {total > 0 && `· ${loaded}/${total}`} {name && `· ${name.length > 40 ? name.slice(0, 40) + '…' : name}`}
          </p>
        </>
      )}
    </div>
  )
}
