import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSceneStore } from '../store/useSceneStore'
import { cinema, SHOTS } from './director'

gsap.registerPlugin(ScrollTrigger)

// Dev-only handle so automated screenshots can jump straight to a shot.
if (import.meta.env.DEV) (window as unknown as { __cinema: typeof cinema }).__cinema = cinema

/**
 * The scroll track. Its height sets the film's length; GSAP ScrollTrigger
 * scrubs a proxy playhead with inertia (scrub: 1.6 s) so the camera glides
 * rather than following the wheel 1:1. Also feeds pointer parallax.
 */
export function ScrollDirector() {
  const track = useRef<HTMLElement>(null!)
  const reducedMotion = useSceneStore((s) => s.reducedMotion)
  const setStage = useSceneStore((s) => s.setStage)

  useEffect(() => {
    const proxy = { p: cinema.p }
    const tween = gsap.to(proxy, {
      p: SHOTS.length - 1,
      ease: 'none',
      scrollTrigger: {
        trigger: track.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: reducedMotion ? true : 1.6,
      },
      onUpdate: () => {
        cinema.p = proxy.p
        const stage = Math.round(proxy.p)
        if (useSceneStore.getState().stage !== stage) setStage(stage)
      },
    })
    const onPointer = (e: PointerEvent) => {
      cinema.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1))
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
      window.removeEventListener('pointermove', onPointer)
    }
  }, [reducedMotion, setStage])

  return (
    <main ref={track} className="track" aria-label="Đêm hội trăng rằm — cuộn để xem">
      {SHOTS.map((s) => (
        <section key={s.id} id={s.id} className="track__shot">
          {/* screen-reader copy of the on-screen captions */}
          <h2 className="sr-only">{s.title}</h2>
          <p className="sr-only">{s.caption}</p>
        </section>
      ))}
    </main>
  )
}

/** Scroll to the resting point of shot i. */
export function goToShot(i: number) {
  const max = document.documentElement.scrollHeight - window.innerHeight
  const reduce = useSceneStore.getState().reducedMotion
  window.scrollTo({ top: (i / (SHOTS.length - 1)) * max, behavior: reduce ? 'auto' : 'smooth' })
}
