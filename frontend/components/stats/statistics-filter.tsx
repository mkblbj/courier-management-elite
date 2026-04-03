"use client";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { CourierTypeSelector } from "@/components/courier-type-selector"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RefreshCw, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"
import type { StatisticsGroupBy } from "@/lib/stats-grouping"

interface StatisticsFilterProps {
  timeRange: DateRange
  courierTypeFilter: string[]
  groupBy: StatisticsGroupBy
  onTimeRangeChange: (range: DateRange) => void
  onCourierTypeFilterChange: (types: string[]) => void
  onGroupByChange: (groupBy: StatisticsGroupBy) => void
  onRefresh: () => void
  onReset?: () => void
  isLoading: boolean
}

export function StatisticsFilter({
  timeRange,
  courierTypeFilter,
  groupBy,
  onTimeRangeChange,
  onCourierTypeFilterChange,
  onGroupByChange,
  onRefresh,
  onReset,
  isLoading,
}: StatisticsFilterProps) {
  const { t } = useTranslation("stats");

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

  // 处理重置功能
  const handleReset = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 重置日期范围为默认的当月（从本月1日到今天）
    onTimeRangeChange({
      from: firstDayOfMonth,
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
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{t("分组方式")}</span>
        <ToggleGroup
          type="single"
          value={groupBy}
          onValueChange={(value) => value && onGroupByChange(value as StatisticsGroupBy)}
        >
          <ToggleGroupItem value="day" className="text-xs">{t("按日")}</ToggleGroupItem>
          <ToggleGroupItem value="week" className="text-xs">{t("按周")}</ToggleGroupItem>
          <ToggleGroupItem value="month" className="text-xs">{t("按月")}</ToggleGroupItem>
          <ToggleGroupItem value="year" className="text-xs">{t("按年")}</ToggleGroupItem>
        </ToggleGroup>
      </div>
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
