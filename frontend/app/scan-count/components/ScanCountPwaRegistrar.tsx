"use client"

import { useEffect } from "react"
import {
  SCAN_COUNT_PWA_SERVICE_WORKER_PATH,
  SCAN_COUNT_PWA_SERVICE_WORKER_SCOPE,
} from "@/lib/scan-count-pwa"

export function ScanCountPwaRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker.register(
      SCAN_COUNT_PWA_SERVICE_WORKER_PATH,
      {
        scope: SCAN_COUNT_PWA_SERVICE_WORKER_SCOPE,
        updateViaCache: "none",
      },
    )
      .catch((error) => {
        console.error("出荷计数 PWA 注册失败:", error)
      })
  }, [])

  return null
}
