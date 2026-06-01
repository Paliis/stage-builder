import { useEffect, useRef, type RefObject } from 'react'

const AUTO_ADVANCE_MS = 5500

function sliderStepPx(el: HTMLElement): number {
  const card = el.querySelector<HTMLElement>('.portal-home__matches-feature-card')
  if (!card) return Math.max(120, el.clientWidth * 0.85)
  const gap = Number.parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap || '0') || 10
  return card.offsetWidth + gap
}

/** Slow auto-advance for home featured matches strip; pauses on hover/focus; respects reduced motion. */
export function useFeaturedMatchesSliderAutoplay(
  sliderRef: RefObject<HTMLDivElement | null>,
  itemCount: number,
  enabled: boolean,
) {
  const pausedRef = useRef(false)

  useEffect(() => {
    pausedRef.current = false
  }, [itemCount])

  useEffect(() => {
    if (!enabled || itemCount < 2) return
    const el = sliderRef.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const onEnter = () => {
      pausedRef.current = true
    }
    const onLeave = () => {
      pausedRef.current = false
    }
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)

    const tick = () => {
      if (pausedRef.current) return
      const step = sliderStepPx(el)
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
      if (maxScroll <= 0) return
      const next = el.scrollLeft + step
      if (next >= maxScroll - 2) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollTo({ left: next, behavior: 'smooth' })
      }
    }

    const id = window.setInterval(tick, AUTO_ADVANCE_MS)
    return () => {
      window.clearInterval(id)
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [enabled, itemCount, sliderRef])
}
