export const SCAN_COUNT_WEB_ROUTE = "/scan-count"
export const SCAN_COUNT_MOBILE_ROUTE = "/scan-count/mobile"
export const SCAN_COUNT_PWA_MANIFEST_PATH = "/scan-count/manifest.webmanifest"
export const SCAN_COUNT_PWA_SERVICE_WORKER_PATH = "/scan-count-sw.js"
export const SCAN_COUNT_PWA_SERVICE_WORKER_SCOPE = "/scan-count/mobile/"
export const SCAN_COUNT_PWA_CACHE_NAME = "scan-count-pwa-v1"

const SCAN_COUNT_API_PREFIXES = [
  "/api/scan-counts",
  "/api/proxy/scan-counts",
]

export function isScanCountApiPath(pathname: string) {
  return SCAN_COUNT_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
