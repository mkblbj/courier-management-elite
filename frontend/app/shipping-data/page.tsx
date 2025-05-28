"use client"

import { useEffect, useState } from "react"
import { UnifiedEntryForm } from "@/components/unified-entry-form"
import { RecentEntries } from "@/components/recent-entries"
import { useShippingData } from "@/hooks/use-shipping-data"
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

  const {
    entries,
    addBatchEntries,
    updateEntry,
    deleteEntry,
    isLoading,
    error,
    totalRecords,
    currentPage,
    totalPages,
    pageSize,
    dateFilter,
    refetch,
    changePage,
    changePageSize,
    setFilter,
    clearFilters,
  } = useShippingData()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleBatchSubmit = async (data: Parameters<typeof addBatchEntries>[0]): Promise<void> => {
    try {
      await addBatchEntries(data);
    } finally {
      refetch();
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <DashboardNav />

      <main className="container mx-auto py-6 px-4 sm:px-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-[calc(100vh-200px)]">
          {/* 录入表单区域 - 占 2/5 宽度 */}
          <div
            className={cn(
              "xl:col-span-2 transition-all duration-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <div className="h-full overflow-y-auto">
              <UnifiedEntryForm onSubmit={handleBatchSubmit} isLoading={isLoading} />
            </div>
          </div>

          {/* 记录列表区域 - 占 3/5 宽度 */}
          <div
            className={cn(
              "xl:col-span-3 transition-all duration-500 delay-200",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <div className="h-full">
              <RecentEntries
                entries={entries}
                totalRecords={totalRecords}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                dateFilter={dateFilter}
                onUpdate={updateEntry}
                onDelete={deleteEntry}
                onRefresh={() => refetch()}
                onPageChange={changePage}
                onPageSizeChange={changePageSize}
                onFilterChange={setFilter}
                onClearFilters={clearFilters}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* API调试工具 - 仅在开发环境中显示 */}
        {debug && process.env.NODE_ENV !== "production" && (
          <div
            className={cn(
              "mt-6 transition-all duration-500 delay-300",
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
