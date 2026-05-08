"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ScanCountStatsProps = {
  currentBatchCount: number
  todayCourierTotal: number
  todayTotal: number
}

export function ScanCountStats({ currentBatchCount, todayCourierTotal, todayTotal }: ScanCountStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">本轮计数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-700">{currentBatchCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">今日该快递类型</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-700">{todayCourierTotal}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">今日全部扫码</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{todayTotal}</div>
        </CardContent>
      </Card>
    </div>
  )
}
