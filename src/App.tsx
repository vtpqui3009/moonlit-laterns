import { Experience } from './components/Experience'
import { Loader } from './components/Loader'

export default function App() {
  return (
    <>
      <Experience />
      <header className="title">
        <p className="title__eyebrow">Tết Trung Thu · Rằm tháng Tám</p>
        <h1>Đêm hội trăng rằm</h1>
        <p className="title__step">Bước 1 · Đèn ông sao, ánh sáng &amp; bóng đổ</p>
      </header>
      <p className="hint">Kéo để xoay · cuộn để lại gần</p>
      <Loader />
    </>
  )
}
