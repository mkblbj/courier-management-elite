import type React from "react"
import type { Metadata, Viewport } from "next"
import {
  SCAN_COUNT_PWA_MANIFEST_PATH,
  SCAN_COUNT_PWA_SERVICE_WORKER_SCOPE,
} from "@/lib/scan-count-pwa"

export const metadata: Metadata = {
  title: "出荷计数",
  description: "移动端出荷计数工具",
  manifest: SCAN_COUNT_PWA_MANIFEST_PATH,
  appleWebApp: {
    capable: true,
    title: "出荷计数",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/scan-count/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/scan-count/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/scan-count/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "application-scope": SCAN_COUNT_PWA_SERVICE_WORKER_SCOPE,
  },
}

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
}

export default function ScanCountMobileLayout({ children }: { children: React.ReactNode }) {
  return children
}
