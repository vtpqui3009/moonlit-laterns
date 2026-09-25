import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'

/** Full-screen loading veil driven by the real asset loading manager. */
export function Loader() {
  const { active, progress, item, loaded, total } = useProgress()
  const [hidden, setHidden] = useState(false)
  const done = !active && progress >= 100

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setHidden(true), 900)
    return () => clearTimeout(t)
  }, [done])

  if (hidden) return null
  const name = item ? item.split('/').pop()?.split('?')[0] : ''

  return (
    <div className={`loader ${done ? 'loader--done' : ''}`} aria-live="polite">
      <div className="loader__moon" />
      <p className="loader__title">Đang chuẩn bị đêm hội...</p>
      <div className="loader__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
        <span style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
      <p className="loader__item">
        {Math.round(progress)}% {total > 0 && `· ${loaded}/${total}`} {name && `· ${name.length > 40 ? name.slice(0, 40) + '…' : name}`}
      </p>
    </div>
  )
}
