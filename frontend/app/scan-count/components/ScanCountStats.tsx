"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "react-i18next"

type ScanCountStatsProps = {
  currentBatchCount: number
  todayCourierTotal: number
  todayTotal: number
}

export function ScanCountStats({ currentBatchCount, todayCourierTotal, todayTotal }: ScanCountStatsProps) {
  const { t } = useTranslation("common")

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <Card>
        <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
          <CardTitle className="text-xs text-muted-foreground sm:text-sm">{t("current_batch")}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          <div className="text-3xl font-bold text-green-700 sm:text-4xl">{currentBatchCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
          <CardTitle className="text-xs text-muted-foreground sm:text-sm">{t("today_courier_total")}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          <div className="text-3xl font-bold text-blue-700 sm:text-4xl">{todayCourierTotal}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
          <CardTitle className="text-xs text-muted-foreground sm:text-sm">{t("today_scan_total")}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          <div className="text-3xl font-bold sm:text-4xl">{todayTotal}</div>
        </CardContent>
      </Card>
    </div>
  )
}
