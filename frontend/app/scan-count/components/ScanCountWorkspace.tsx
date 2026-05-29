"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useCourierTypes } from "@/hooks/use-courier-types"
import { useScanCount } from "@/hooks/use-scan-count"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BatchSummaryDialog } from "./BatchSummaryDialog"
import { ScanCountPanel } from "./ScanCountPanel"
import { ScanCountStats } from "./ScanCountStats"
import { ScanInputArea } from "./ScanInputArea"
import { ScanItemList } from "./ScanItemList"
import { TodayScanRecords } from "./TodayScanRecords"

type ScanCountWorkspaceProps = {
  showHeaderText?: boolean
  className?: string
}

export function ScanCountWorkspace({ showHeaderText = true, className }: ScanCountWorkspaceProps) {
  const { t } = useTranslation("common")
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
    <main className={cn("container mx-auto space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-6", className)}>
      {showHeaderText && (
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{t("scan_count")}</h1>
          <p className="text-sm text-muted-foreground">{t("scan_count_description")}</p>
        </div>
      )}

      <Tabs defaultValue="scan" className="space-y-4">
        <TabsList className="grid h-12 w-full grid-cols-2 sm:w-[360px]">
          <TabsTrigger value="scan" className="h-10 text-base sm:text-sm">
            {t("scan_tab")}
          </TabsTrigger>
          <TabsTrigger value="today" className="h-10 text-base sm:text-sm">
            {t("today_records_tab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4 xl:gap-6">
            <div className="space-y-4 xl:col-span-1">
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

            <div className="space-y-4 xl:col-span-3 xl:space-y-6">
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
        </TabsContent>

        <TabsContent value="today">
          <TodayScanRecords
            records={scanCount.todayRecords}
            courierTypes={activeCourierTypes}
            isLoading={scanCount.isLoading}
            onRefresh={scanCount.refreshTodayData}
            onDelete={scanCount.deleteTodayRecord}
          />
        </TabsContent>
      </Tabs>

      <BatchSummaryDialog
        open={summaryOpen}
        count={scanCount.currentBatch.length}
        courierName={selectedCourier?.name}
        onOpenChange={setSummaryOpen}
        onUndoBatch={async () => {
          await scanCount.deleteBatch()
        }}
      />
    </main>
  )
}
