"use client";
import { useTranslation } from "react-i18next";

import { useState, useEffect } from "react"
import { format, getDay } from "date-fns"
import { Edit2, Trash2, RefreshCw, ChevronLeft, ChevronRight, X, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EditEntryForm } from "@/components/edit-entry-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DateRange } from "react-day-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { ShippingEntry } from "@/hooks/use-shipping-data"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { CourierTypeSelector } from "@/components/courier-type-selector"
import { Separator } from "@/components/ui/separator"
import { api } from "@/services/api"
import { dateToApiString } from "@/lib/date-utils"

interface RecentEntriesProps {
  entries: ShippingEntry[]
  totalRecords: number
  currentPage: number
  totalPages: number
  pageSize: number
  dateFilter: any
  onUpdate: (entry: ShippingEntry) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onRefresh: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onFilterChange: (filter: any) => void
  onClearFilters: () => void
  isLoading: boolean
}

export function RecentEntries({
  entries,
  totalRecords,
  currentPage,
  totalPages,
  pageSize,
  dateFilter,
  onUpdate,
  onDelete,
  onRefresh,
  onPageChange,
  onPageSizeChange,
  onFilterChange,
  onClearFilters,
  isLoading,
}: RecentEntriesProps) {
  const { t } = useTranslation("courier");

  // 获取星期的翻译
  const getWeekdayTranslation = (date: Date, useShort: boolean = true) => {
    const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const weekdayKey = weekdays[dayOfWeek];
    const translationKey = useShort ? `weekday.short.${weekdayKey}` : `weekday.full.${weekdayKey}`;
    return t(translationKey, { ns: 'common' });
  };

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<ShippingEntry | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [courierTypeId, setCourierTypeId] = useState<string | number | undefined>(
    dateFilter?.courierTypeId
  )
  const [courierTypes, setCourierTypes] = useState<Record<string, string>>({}) // 缓存快递类型 id -> name

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // 加载快递类型数据
  useEffect(() => {
    const fetchCourierTypes = async () => {
      try {
        const types = await api.getCourierTypes({ active_only: true })
        // 创建id -> name的映射对象
        const typesMap: Record<string, string> = {}
        types.forEach((type) => {
          typesMap[type.id.toString()] = type.name
        })
        setCourierTypes(typesMap)
      } catch (err) {
        console.error("获取快递类型失败:", err)
      }
    }

    fetchCourierTypes()
  }, [])

  // 当日期筛选变化时，更新日期范围状态
  useEffect(() => {
    if (dateFilter?.type === "range" && dateFilter.dateFrom && dateFilter.dateTo) {
      setDateRange({
        from: new Date(dateFilter.dateFrom),
        to: new Date(dateFilter.dateTo),
      })
    } else {
      setDateRange(undefined)
    }

    // 同步快递类型ID
    setCourierTypeId(dateFilter?.courierTypeId)
  }, [dateFilter])

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId)
      setDeleteId(null)
    }
  }

  const handleUpdate = async (entry: ShippingEntry) => {
    await onUpdate(entry)
    setEditingEntry(null)
  }

  const handleRefresh = () => {
    // 显示刷新中和结果通知
    try {
      onRefresh();
      // 刷新成功提示
      toast({
        title: t("刷新成功"),
        description: t("数据已更新"),
        variant: "default",
      });
    } catch (error) {
      // 刷新失败提示
      toast({
        title: t("刷新失败"),
        description: error instanceof Error ? error.message : t("获取数据失败"),
        variant: "destructive",
      });
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page)
    }
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)

    if (range?.from && range?.to) {
      onFilterChange({
        type: "range",
        dateFrom: dateToApiString(range.from),
        dateTo: dateToApiString(range.to),
        courierTypeId,
      })
    }
  }

  const handleCourierTypeChange = (value: string | number | undefined) => {
    setCourierTypeId(value)

    // 应用快递类型筛选
    if (dateRange?.from && dateRange?.to) {
      onFilterChange({
        type: "range",
        dateFrom: dateToApiString(dateRange.from),
        dateTo: dateToApiString(dateRange.to),
        courierTypeId: value,
      })
    } else {
      onFilterChange({
        courierTypeId: value,
      })
    }
  }

  const handleResetFilters = () => {
    setDateRange(undefined)
    setCourierTypeId(undefined)
    onClearFilters()
  }

  const getFilterDescription = () => {
    const descriptions: string[] = [];

    if (!dateFilter) return null;

    // 添加日期筛选描述
    if (dateFilter.type === "date" && dateFilter.date) {
      descriptions.push(`${t("日期")}: ${dateFilter.date}`);
    } else if (dateFilter.type === "range" && dateFilter.dateFrom && dateFilter.dateTo) {
      descriptions.push(`${t("日期范围")}: ${dateFilter.dateFrom} 至 ${dateFilter.dateTo}`);
    } else if (dateFilter.type === "week" && dateFilter.week) {
      descriptions.push(`第 ${dateFilter.week} 周`);
    } else if (dateFilter.type === "month" && dateFilter.month) {
      descriptions.push(`${dateFilter.month} 月`);
    } else if (dateFilter.type === "quarter" && dateFilter.quarter) {
      descriptions.push(`第 ${dateFilter.quarter} 季度`);
    } else if (dateFilter.type === "year" && dateFilter.year) {
      descriptions.push(`${dateFilter.year} 年`);
    }

    // 添加快递类型筛选描述
    if (dateFilter.courierTypeId && courierTypes[dateFilter.courierTypeId.toString()]) {
      descriptions.push(`${t("快递类型")}: ${courierTypes[dateFilter.courierTypeId.toString()]}`);
    }

    // 如果有多个描述，用逗号连接
    return descriptions.join(", ");
  }

  return (
    (<TooltipProvider>
      <Card className="border">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-lg font-medium whitespace-nowrap">{t("最近录入记录")}</CardTitle>

              {/* 日期范围选择器和快递类型选择器 */}
              <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />

              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <CourierTypeSelector
                  value={courierTypeId}
                  onChange={handleCourierTypeChange}
                  placeholder={t("选择快递类型")}
                  className="w-[150px] sm:w-[180px]"
                />
              </div>

              {/* 显示当前筛选条件 */}
              {(dateFilter || courierTypeId) && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm flex-shrink-0">
                  <span className="truncate max-w-[250px]">{getFilterDescription()}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full flex-shrink-0" onClick={onClearFilters}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* 刷新按钮 */}
            <Button variant="outline" size="icon" className="h-8 w-8 ml-auto" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">{t("暂无记录")}</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    {dateFilter || courierTypeId
                      ? t("当前筛选条件下没有找到记录，请尝试调整筛选条件")
                      : t("还没有发货记录，请从左边表单开始录入数据")
                    }
                  </p>
                </div>
                {(dateFilter || courierTypeId) && (
                  <Button variant="outline" onClick={onClearFilters} className="mt-2">
                    {t("清除筛选条件")}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="animate-fade-in" style={{ animationDelay: "50ms" }}>
                    <TableHead className="w-[100px]">{t("日期")}</TableHead>
                    <TableHead className="w-[140px]">{t("快递类型")}</TableHead>
                    <TableHead className="w-[60px] text-center">{t("数量")}</TableHead>
                    <TableHead className="min-w-0">{t("备注")}</TableHead>
                    <TableHead className="w-[80px] text-center">{t("操作")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className={cn(
                        "transition-all duration-300 hover:bg-muted dark:hover:bg-gray-700",
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                      )}
                      style={{ transitionDelay: `${index * 50 + 100}ms` }}
                    >
                      <TableCell className="w-[100px] whitespace-nowrap">
                        <div className="text-sm">{format(new Date(entry.date), "MM-dd")}</div>
                        <div className="text-xs text-gray-500">
                          {getWeekdayTranslation(new Date(entry.date))}
                        </div>
                      </TableCell>
                      <TableCell className="w-[140px] font-medium">
                        <div className="truncate text-sm">{entry.courierTypeName}</div>
                      </TableCell>
                      <TableCell className="w-[60px] text-center text-sm">{entry.quantity}</TableCell>
                      <TableCell>
                        {entry.remarks ? (
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger className="w-full text-left">
                              <div className="truncate text-sm text-muted-foreground max-w-[400px] group relative">
                                {entry.remarks}
                                {entry.remarks.length > 60 && (
                                  <span className="absolute -right-5 top-0 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    ···
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              align="start"
                              className="max-w-[400px] bg-background dark:bg-gray-800 border shadow-md p-3 z-50"
                            >
                              <p className="text-sm text-gray-700 break-words whitespace-normal">{entry.remarks}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="w-[80px]">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingEntry(entry)}
                            disabled={isLoading}
                            className="h-7 w-7 transition-colors hover:bg-blue-50"
                          >
                            <Edit2 className="h-3 w-3 text-blue-600" />
                            <span className="sr-only">{t("编辑")}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(entry.id.toString())}
                            disabled={isLoading}
                            className="h-7 w-7 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                            <span className="sr-only">{t("删除")}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t px-6 py-3">
          <div className="text-sm text-muted-foreground">{t("共 {{total}} 条记录", { total: totalRecords })}</div>
          <div className="flex items-center gap-2">
            <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number.parseInt(value))}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-r-none"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-center h-8 px-3 border-y">
                <span className="text-sm">
                  {currentPage} / {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-l-none"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("确认删除")}</AlertDialogTitle>
            <AlertDialogDescription>{t("您确定要删除这条发货记录吗？此操作无法撤销。")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("取消")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 transition-colors">{t("删除")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="sm:max-w-[600px] animate-scale-in">
          <DialogHeader>
            <DialogTitle>{t("编辑发货记录")}</DialogTitle>
          </DialogHeader>
          {editingEntry && <EditEntryForm onSubmit={handleUpdate} isLoading={isLoading} initialData={editingEntry} onCancel={() => setEditingEntry(null)} />}
        </DialogContent>
      </Dialog>
    </TooltipProvider>)
  );
}
