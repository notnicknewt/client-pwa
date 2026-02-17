import { useRef, useState, useEffect } from 'react'

interface UseSwipeNavigationOptions {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  enabled?: boolean
  threshold?: number
}

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
  threshold = 50,
}: UseSwipeNavigationOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const directionLocked = useRef<'horizontal' | 'vertical' | null>(null)
  const swipeOffsetRef = useRef(0)
  const onSwipeLeftRef = useRef(onSwipeLeft)
  const onSwipeRightRef = useRef(onSwipeRight)
  const enabledRef = useRef(enabled)

  onSwipeLeftRef.current = onSwipeLeft
  onSwipeRightRef.current = onSwipeRight
  enabledRef.current = enabled

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const isInteractiveTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName.toLowerCase()
      return tag === 'input' || tag === 'textarea' || tag === 'select'
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (!enabledRef.current) return
      if (isInteractiveTarget(e.target)) return
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      directionLocked.current = null
      setIsSwiping(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!enabledRef.current || directionLocked.current === 'vertical') return

      const deltaX = e.touches[0].clientX - touchStartX.current
      const deltaY = e.touches[0].clientY - touchStartY.current

      // Lock direction on first significant movement
      if (directionLocked.current === null) {
        if (Math.abs(deltaY) > 30 && Math.abs(deltaY) > Math.abs(deltaX)) {
          directionLocked.current = 'vertical'
          setIsSwiping(false)
          setSwipeOffset(0)
          swipeOffsetRef.current = 0
          return
        }
        if (Math.abs(deltaX) > 10) {
          directionLocked.current = 'horizontal'
        } else {
          return
        }
      }

      e.preventDefault()
      const offset = deltaX * 0.5 // resistance
      swipeOffsetRef.current = offset
      setSwipeOffset(offset)
    }

    const handleTouchEnd = () => {
      if (!enabledRef.current) return
      const offset = swipeOffsetRef.current
      if (directionLocked.current === 'horizontal') {
        if (offset <= -threshold) {
          onSwipeLeftRef.current()
        } else if (offset >= threshold) {
          onSwipeRightRef.current()
        }
      }
      swipeOffsetRef.current = 0
      setSwipeOffset(0)
      setIsSwiping(false)
      directionLocked.current = null
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [threshold])

  return { containerRef, swipeOffset, isSwiping }
}
