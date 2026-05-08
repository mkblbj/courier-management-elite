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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">{t("current_batch")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-700">{currentBatchCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">{t("today_courier_total")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-700">{todayCourierTotal}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">{t("today_scan_total")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{todayTotal}</div>
        </CardContent>
      </Card>
    </div>
  )
}
