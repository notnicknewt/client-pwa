import { useRef, useState, useEffect } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  maxPull?: number
}

export function usePullToRefresh({ onRefresh, threshold = 60, maxPull = 120 }: UsePullToRefreshOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const isPulling = useRef(false)
  const pullDistanceRef = useRef(0)
  const isRefreshingRef = useRef(false)
  const onRefreshRef = useRef(onRefresh)

  // Keep refs in sync with latest values
  onRefreshRef.current = onRefresh

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleTouchStart = (e: TouchEvent) => {
      if (el.scrollTop > 0 || isRefreshingRef.current) return
      touchStartY.current = e.touches[0].clientY
      isPulling.current = true
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return
      const delta = e.touches[0].clientY - touchStartY.current
      if (delta > 0) {
        // Apply resistance - pull distance decreases as you pull further
        const distance = Math.min(delta * 0.5, maxPull)
        pullDistanceRef.current = distance
        setPullDistance(distance)
        if (distance > 10) e.preventDefault()
      } else {
        isPulling.current = false
        pullDistanceRef.current = 0
        setPullDistance(0)
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling.current) return
      isPulling.current = false
      if (pullDistanceRef.current >= threshold) {
        isRefreshingRef.current = true
        setIsRefreshing(true)
        setPullDistance(threshold) // Hold at threshold during refresh
        try {
          await onRefreshRef.current()
        } finally {
          isRefreshingRef.current = false
          setIsRefreshing(false)
          pullDistanceRef.current = 0
          setPullDistance(0)
        }
      } else {
        pullDistanceRef.current = 0
        setPullDistance(0)
      }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [threshold, maxPull])

  return { containerRef, pullDistance, isRefreshing }
}
