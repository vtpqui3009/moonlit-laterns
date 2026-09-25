import { lazy, Suspense } from 'react'
import { ChapterNav } from './components/ChapterNav'
import { Loader } from './components/Loader'
import { ScrollDirector } from './cinema/ScrollDirector'
import { useSceneStore } from './store/useSceneStore'

// The 3D bundle (three, R3F, postprocessing) loads after the page shell and loader paint.
const Experience = lazy(() => import('./components/Experience'))

export default function App() {
  const stage = useSceneStore((s) => s.stage)
  return (
    <>
      <Suspense fallback={null}>
        <Experience />
      </Suspense>
      <header className={`title ${stage > 0 ? 'title--quiet' : ''}`}>
        <p className="title__eyebrow">Tết Trung Thu · Rằm tháng Tám</p>
        <h1>Đêm hội trăng rằm</h1>
      </header>
      <ChapterNav />
      <p className={`hint ${stage > 0 ? 'hint--gone' : ''}`}>Cuộn để bước vào đêm hội</p>
      <ScrollDirector />
      <Loader />
    </>
  )
}
