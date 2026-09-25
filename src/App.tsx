import { lazy, Suspense } from 'react'
import { ChapterNav } from './components/ChapterNav'
import { Finale } from './components/Finale'
import { Loader } from './components/Loader'
import { SoundToggle } from './components/SoundToggle'
import { ScrollDirector } from './cinema/ScrollDirector'
import { useSceneStore } from './store/useSceneStore'

// The 3D bundle (three, R3F, postprocessing) loads after the page shell and loader paint.
const Experience = lazy(() => import('./components/Experience'))
// Dev-only: ?audiotest skips the 3D scene so the soundscape can be recorded headlessly.
const audioTest = import.meta.env.DEV && new URLSearchParams(window.location.search).has('audiotest')

export default function App() {
  const stage = useSceneStore((s) => s.stage)
  const letterOpen = useSceneStore((s) => s.letterOpen)
  return (
    <>
      {!audioTest && (
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      )}
      <header className={`title ${stage > 0 ? 'title--quiet' : ''} ${letterOpen ? 'title--gone' : ''}`}>
        <p className="title__eyebrow">Tết Trung Thu · Rằm tháng Tám</p>
        <h1>Gửi em, đêm rằm</h1>
      </header>
      <ChapterNav />
      <SoundToggle />
      <p className={`hint ${stage > 0 ? 'hint--gone' : ''}`}>Cuộn xuống để đi cùng anh</p>
      <Finale />
      <ScrollDirector />
      <Loader />
    </>
  )
}
