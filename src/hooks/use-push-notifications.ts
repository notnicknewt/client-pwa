import { useState, useEffect } from 'react'

// Placeholder VAPID key - replace with real one when backend is ready
const VAPID_PUBLIC_KEY = 'placeholder-vapid-key'

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    const sub = localStorage.getItem('push_subscription')
    if (sub) setIsSubscribed(true)
  }, [])

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC_KEY,
        })
        localStorage.setItem('push_subscription', JSON.stringify(subscription))
        setIsSubscribed(true)
        // TODO: POST subscription to backend when endpoint exists
      } catch (err) {
        console.error('Push subscription failed:', err)
      }
    }
  }

  return { permission, requestPermission, isSubscribed }
}
