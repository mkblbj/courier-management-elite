"use client";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { CourierTypeSelector } from "@/components/courier-type-selector"
import { RefreshCw, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"
import { subDays } from "date-fns"

interface StatisticsFilterProps {
  timeRange: DateRange
  courierTypeFilter: string[]
  onTimeRangeChange: (range: DateRange) => void
  onCourierTypeFilterChange: (types: string[]) => void
  onRefresh: () => void
  onReset?: () => void
  isLoading: boolean
}

export function StatisticsFilter({
  timeRange,
  courierTypeFilter,
  onTimeRangeChange,
  onCourierTypeFilterChange,
  onRefresh,
  onReset,
  isLoading,
}: StatisticsFilterProps) {
  const {
    t: t
  } = useTranslation();

  // 处理快递类型选择变化
  const handleCourierTypeChange = (value: string | number | undefined) => {
    const {
      t: t
    } = useTranslation();

    if (!value) {
      // 如果选择"全部"，则清空筛选
      onCourierTypeFilterChange([])
    } else {
      // 否则设置为选中的类型
      onCourierTypeFilterChange([value.toString()])
    }
  }

  // 处理重置功能
  const handleReset = () => {
    const {
      t: t
    } = useTranslation();

    const today = new Date();
    const sevenDaysAgo = subDays(today, 6);

    // 重置日期范围为默认的最近7天
    onTimeRangeChange({
      from: sevenDaysAgo,
      to: today,
    });

    // 重置快递类型为"全部"
    onCourierTypeFilterChange([]);

    // 调用外部的重置函数（如果有的话）
    if (onReset) {
      onReset();
    }
  };

  return (
    (<div className="flex flex-wrap items-center gap-3">
      <DateRangePicker value={timeRange} onChange={onTimeRangeChange} />
      <CourierTypeSelector
        value={courierTypeFilter.length > 0 ? courierTypeFilter[0] : undefined}
        onChange={handleCourierTypeChange}
        placeholder={t("选择快递类型")}
        className="w-[150px] sm:w-[180px]"
      />
      <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading} className="h-10 w-10">
        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
      </Button>
      <Button variant="ghost" size="sm" onClick={handleReset} className="h-10 px-3">
        <RotateCcw className="h-4 w-4 mr-1" />{t("重置")}</Button>
    </div>)
  );
}
