const CACHE = 'coplio-v1'
const OFFLINE_URL = '/offline'

const PRECACHE = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return

  const url = new URL(event.request.url)

  // Network-first for API/auth routes
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next/data')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
    )
    return
  }

  // Cache-first for static assets
  if (url.pathname.startsWith('/_next/static')) {
    event.respondWith(
      caches.match(event.request).then(cached => cached ?? fetch(event.request).then(res => {
        const clone = res.clone()
        caches.open(CACHE).then(cache => cache.put(event.request, clone))
        return res
      }))
    )
    return
  }

  // Network-first with offline fallback for pages
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone()
        caches.open(CACHE).then(cache => cache.put(event.request, clone))
        return res
      })
      .catch(async () => {
        const cached = await caches.match(event.request)
        return cached ?? caches.match(OFFLINE_URL)
      })
  )
})
