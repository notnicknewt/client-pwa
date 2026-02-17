import { useSyncExternalStore } from 'react'

function subscribe(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

export function useNetworkStatus() {
  const isOnline = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  return { isOnline }
}
