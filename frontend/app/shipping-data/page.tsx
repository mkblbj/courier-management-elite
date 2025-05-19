"use client"

import { useEffect, useState } from "react"
import { ShippingDataEntry } from "@/components/shipping-data-entry"
import { ShippingApiDebug } from "@/components/shipping-api-debug"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEnvStore } from "@/lib/env-config"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { useTranslation } from "react-i18next"

export default function ShippingDataPage() {
  const { debug } = useEnvStore()
  const [isVisible, setIsVisible] = useState(false)
  const { t } = useTranslation(['common', 'shipping', 'courier'])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <DashboardNav />

      <main className="container mx-auto py-6 px-4 sm:px-6 space-y-6">

        <div
          className={cn(
            "transition-all duration-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <ShippingDataEntry />
        </div>
        {/* API调试工具 - 仅在开发环境中显示 */}
        {debug && process.env.NODE_ENV !== "production" && (
          <div
            className={cn(
              "transition-all duration-500 delay-300",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <ShippingApiDebug />
          </div>
        )}
      </main>
    </div>
  )
}
