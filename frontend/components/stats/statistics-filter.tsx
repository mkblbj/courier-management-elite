"use client"

import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { CourierTypeSelector } from "@/components/courier-type-selector"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

interface StatisticsFilterProps {
  timeRange: DateRange
  courierTypeFilter: string[]
  onTimeRangeChange: (range: DateRange) => void
  onCourierTypeFilterChange: (types: string[]) => void
  onRefresh: () => void
  isLoading: boolean
}

export function StatisticsFilter({
  timeRange,
  courierTypeFilter,
  onTimeRangeChange,
  onCourierTypeFilterChange,
  onRefresh,
  isLoading,
}: StatisticsFilterProps) {
  // 处理快递类型选择变化
  const handleCourierTypeChange = (value: string | number | undefined) => {
    if (!value) {
      // 如果选择"全部"，则清空筛选
      onCourierTypeFilterChange([])
    } else {
      // 否则设置为选中的类型
      onCourierTypeFilterChange([value.toString()])
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <DateRangePicker value={timeRange} onChange={onTimeRangeChange} />

      <CourierTypeSelector
        value={courierTypeFilter.length > 0 ? courierTypeFilter[0] : undefined}
        onChange={handleCourierTypeChange}
        placeholder="选择快递类型"
        className="w-[150px] sm:w-[180px]"
      />

      <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading} className="h-10 w-10">
        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
      </Button>
    </div>
  )
}
