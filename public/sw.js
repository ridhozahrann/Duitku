// ponytail: minimal offline-friendly SW — network-first for navigation, cache-first for static
// upgrade: Workbox precache + background sync for Supabase queue when cloud required
const CACHE = 'duitku-v1'
const ASSETS = ['/manifest.json', '/icon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  // supabase, auth, vercel analytics: never cache
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/auth') || req.headers.get('authorization')) return
  // navigation: network-first fallback to cache
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r || caches.match('/'))))
    return
  }
  // static: cache-first
  if (req.destination === 'style' || req.destination === 'script' || req.destination === 'image' || req.destination === 'font') {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((ch) => ch.put(req, c)); return res })))
  }
})
