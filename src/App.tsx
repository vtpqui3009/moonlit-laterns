import { ChapterNav } from './components/ChapterNav'
import { Experience } from './components/Experience'
import { Loader } from './components/Loader'
import { ScrollDirector } from './cinema/ScrollDirector'
import { useSceneStore } from './store/useSceneStore'

export default function App() {
  const stage = useSceneStore((s) => s.stage)
  return (
    <>
      <Experience />
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
