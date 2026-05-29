"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ExternalLink, Wifi, WifiOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { SCAN_COUNT_WEB_ROUTE } from "@/lib/scan-count-pwa"
import { cn } from "@/lib/utils"

export function ScanCountAppHeader() {
  const { t } = useTranslation("common")
  const [mounted, setMounted] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const updateOnlineState = () => setIsOnline(navigator.onLine)

    setMounted(true)
    updateOnlineState()
    window.addEventListener("online", updateOnlineState)
    window.addEventListener("offline", updateOnlineState)

    return () => {
      window.removeEventListener("online", updateOnlineState)
      window.removeEventListener("offline", updateOnlineState)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex min-h-16 w-full max-w-screen-xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold leading-tight">{t("scan_count")}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{mounted ? format(new Date(), "yyyy-MM-dd") : ""}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
                isOnline ? "border-green-200 text-green-700" : "border-red-200 text-red-700",
              )}
            >
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? t("scan_count_mobile_online") : t("scan_count_mobile_offline")}
            </span>
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="h-9 shrink-0">
          <Link href={SCAN_COUNT_WEB_ROUTE}>
            <ExternalLink className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">{t("scan_count_web_version")}</span>
            <span className="sm:hidden">{t("back")}</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
