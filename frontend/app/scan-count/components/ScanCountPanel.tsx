"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CourierType } from "@/services/api"

type ScanCountPanelProps = {
  courierTypes: CourierType[]
  selectedCourierId?: string
  status: "idle" | "active"
  isLoading: boolean
  onSelectCourier: (courierId: string) => void
  onStart: () => void
  onStop: () => void
}

export function ScanCountPanel({
  courierTypes,
  selectedCourierId,
  status,
  isLoading,
  onSelectCourier,
  onStart,
  onStop,
}: ScanCountPanelProps) {
  const isActive = status === "active"

  return (
    <Card>
      <CardHeader>
        <CardTitle>出荷计数</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedCourierId} onValueChange={onSelectCourier} disabled={isActive}>
          <SelectTrigger>
            <SelectValue placeholder="请选择快递类型" />
          </SelectTrigger>
          <SelectContent>
            {courierTypes.map((courier) => (
              <SelectItem key={courier.id} value={courier.id.toString()}>
                {courier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button onClick={onStart} disabled={!selectedCourierId || isActive || isLoading} className="flex-1">
            开始计数
          </Button>
          <Button onClick={onStop} disabled={!isActive} variant="outline" className="flex-1">
            停止计数
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
