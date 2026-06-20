'use client'

import { useEffect } from 'react'

export default function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // In development, never let a service worker run — it interferes with HMR
    // and serves stale HTML, causing hydration mismatches.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister())
      })
      caches?.keys().then(keys => keys.forEach(k => caches.delete(k)))
      return
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch(err => console.error('SW registration failed:', err))
  }, [])

  return null
}
