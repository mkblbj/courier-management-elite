"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CourierType } from "@/services/api"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation("common")
  const isActive = status === "active"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("scan_count")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedCourierId} onValueChange={onSelectCourier} disabled={isActive}>
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder={t("select_courier_placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {courierTypes.map((courier) => (
              <SelectItem key={courier.id} value={courier.id.toString()}>
                {courier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onStart} disabled={!selectedCourierId || isActive || isLoading} className="h-12 text-base">
            {t("start_counting")}
          </Button>
          <Button onClick={onStop} disabled={!isActive} variant="outline" className="h-12 text-base">
            {t("stop_counting")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
