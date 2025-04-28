"use client"

import { Suspense, useEffect, useState } from "react"
import { CourierTypeManagement } from "@/components/courier-type-management"
import { PageHeader } from "@/components/page-header"
import { CourierTypesSkeleton } from "@/components/courier-types-skeleton"
import { ApiDebug } from "@/components/api-debug" // 导入调试组件
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileInput } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEnvStore } from "@/lib/env-config"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { useTranslation } from "react-i18next"

export default function CourierTypesPage() {
  const { debug } = useEnvStore()
  const [isVisible, setIsVisible] = useState(false)
  const { t } = useTranslation(['common', 'courier'])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardNav />
      
      <main className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
        <PageHeader
          title={t('courier:courier_management')}
          description={t('courier:courier_list')}
          className="max-w-5xl mx-auto"
          action={
            <Link href="/shipping-data">
              <Button className="bg-blue-600 hover:bg-blue-700 transition-all duration-300">
                <FileInput className="mr-2 h-4 w-4" />
                {t('shipping:shipping_management')}
              </Button>
            </Link>
          }
        />
        <div
          className={cn(
            "transition-all duration-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <Suspense fallback={<CourierTypesSkeleton />}>
            <CourierTypeManagement />
          </Suspense>
        </div>
        {/* 添加API调试组件 - 只在开发模式下显示 */}
        {debug && process.env.NODE_ENV !== "production" && (
          <div
            className={cn(
              "transition-all duration-500 delay-300",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <ApiDebug />
          </div>
        )}
      </main>
    </div>
  )
}
