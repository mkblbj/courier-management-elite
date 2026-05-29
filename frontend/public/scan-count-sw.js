const CACHE_NAME = "scan-count-pwa-v1"
const APP_SHELL_URLS = [
  "/scan-count/mobile",
  "/scan-count/manifest.webmanifest",
  "/scan-count/icons/icon-192.svg",
  "/scan-count/icons/icon-512.svg",
  "/scan-count/icons/maskable.svg",
]
const API_PREFIXES = [
  "/api/scan-counts",
  "/api/proxy/scan-counts",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith("scan-count-pwa-") && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isApiRequest(url) {
  return API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
}

function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    (
      url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/scan-count/icons/") ||
      url.pathname === "/scan-count/manifest.webmanifest"
    )
  )
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response && response.status === 200) {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(request, response.clone())
  }

  return response
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put("/scan-count/mobile", response.clone())
    }
    return response
  } catch (error) {
    const cached = await caches.match("/scan-count/mobile")
    if (cached) return cached
    throw error
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (request.method !== "GET") return
  if (url.origin !== self.location.origin) return
  if (isApiRequest(url)) return

  if (request.mode === "navigate" && url.pathname.startsWith("/scan-count/mobile")) {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request))
  }
})
