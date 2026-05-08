"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { useCourierTypes } from "@/hooks/use-courier-types"
import { useScanCount } from "@/hooks/use-scan-count"
import { ScanCountPanel } from "./components/ScanCountPanel"
import { ScanInputArea } from "./components/ScanInputArea"
import { ScanCountStats } from "./components/ScanCountStats"
import { ScanItemList } from "./components/ScanItemList"
import { BatchSummaryDialog } from "./components/BatchSummaryDialog"

export default function ScanCountPage() {
  const { courierTypes } = useCourierTypes()
  const scanCount = useScanCount()
  const [selectedCourierId, setSelectedCourierId] = useState<string>("")
  const [summaryOpen, setSummaryOpen] = useState(false)

  const activeCourierTypes = useMemo(() => {
    return courierTypes
      .filter((type) => Boolean(type.is_active))
      .filter((type) => !type.name.includes("未指定"))
  }, [courierTypes])

  const selectedCourier = activeCourierTypes.find((type) => type.id.toString() === selectedCourierId)

  useEffect(() => {
    scanCount.refreshTodayData()
  }, [scanCount.refreshTodayData])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (scanCount.status === "active") {
        event.preventDefault()
        event.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [scanCount.status])

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">出荷计数</h1>
          <p className="text-sm text-muted-foreground">选择快递类型后使用扫码枪扫描运单号，系统会自动计数并防止当天重复。</p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          <div className="space-y-6 xl:col-span-1">
            <ScanCountPanel
              courierTypes={activeCourierTypes}
              selectedCourierId={selectedCourierId}
              status={scanCount.status}
              isLoading={scanCount.isLoading}
              onSelectCourier={setSelectedCourierId}
              onStart={() => selectedCourier && scanCount.start(selectedCourier)}
              onStop={() => {
                scanCount.stop()
                setSummaryOpen(true)
              }}
            />
          </div>

          <div className="space-y-6 xl:col-span-3">
            <ScanCountStats
              currentBatchCount={scanCount.currentBatch.length}
              todayCourierTotal={scanCount.todaySelectedCourierTotal}
              todayTotal={scanCount.stats.total}
            />

            <ScanInputArea
              isActive={scanCount.status === "active"}
              lastError={scanCount.lastError}
              onSubmitScan={scanCount.submitScan}
            />

            <ScanItemList
              records={scanCount.currentBatch}
              onDelete={scanCount.removeItem}
              onUndoLast={scanCount.undoLast}
            />
          </div>
        </div>

        <BatchSummaryDialog
          open={summaryOpen}
          count={scanCount.currentBatch.length}
          courierName={selectedCourier?.name}
          onOpenChange={setSummaryOpen}
          onUndoBatch={scanCount.deleteBatch}
        />
      </main>
    </div>
  )
}
