const CACHE = 'campuswallet-v1'
const OFFLINE_URL = '/offline'

const PRECACHE = [
  '/',
  '/dashboard',
  '/expenses',
  '/budgets',
  '/wallet',
  '/reports',
  '/offline',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept API calls — always go to network
  if (url.hostname !== self.location.hostname || url.pathname.startsWith('/api/')) {
    return
  }

  // Navigation requests: network-first, fall back to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then(r => r ?? new Response('Offline', { status: 503 }))
      )
    )
    return
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then(cache => cache.put(request, clone))
        }
        return response
      }).catch(() => caches.match(OFFLINE_URL))
    })
  )
})
