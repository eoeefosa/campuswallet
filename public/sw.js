// Service worker caching is disabled.
// This kill-switch unregisters any previously installed worker and clears
// all caches, then stops intercepting requests entirely.

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
      await self.clients.claim()
      await self.registration.unregister()
    })()
  )
})

// No fetch handler — all requests go straight to the network.
