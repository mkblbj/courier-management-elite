"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Edit2, Trash2, RefreshCw, ChevronLeft, ChevronRight, X } from "lucide-react"
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
import { SingleEntryForm } from "@/components/single-entry-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DateRange } from "react-day-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { ShippingEntry } from "@/hooks/use-shipping-data"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"

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
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<ShippingEntry | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
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
    // 先显示刷新中的提示
    toast({
      title: "刷新中",
      duration: 1000, // 较短的刷新提示时间
    })

    // 执行刷新操作
    onRefresh();
    
    // 使用setTimeout确保"刷新中"和"刷新成功"两个提示不会同时出现
    setTimeout(() => {
      toast({
        title: "刷新成功",
        description: "数据已更新",
        duration: 3000,
      });
    }, 1200); // 稍微延迟，确保在"刷新中"提示后显示
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
        dateFrom: format(range.from, "yyyy-MM-dd"),
        dateTo: format(range.to, "yyyy-MM-dd"),
      })
    }
  }

  const handleResetFilters = () => {
    setDateRange(undefined)
    onClearFilters()
  }

  const getFilterDescription = () => {
    if (!dateFilter) return null

    if (dateFilter.type === "date" && dateFilter.date) {
      return `日期: ${dateFilter.date}`
    } else if (dateFilter.type === "range" && dateFilter.dateFrom && dateFilter.dateTo) {
      return `日期范围: ${dateFilter.dateFrom} 至 ${dateFilter.dateTo}`
    } else if (dateFilter.type === "week" && dateFilter.week) {
      return `第 ${dateFilter.week} 周`
    } else if (dateFilter.type === "month" && dateFilter.month) {
      return `${dateFilter.month} 月`
    } else if (dateFilter.type === "quarter" && dateFilter.quarter) {
      return `第 ${dateFilter.quarter} 季度`
    } else if (dateFilter.type === "year" && dateFilter.year) {
      return `${dateFilter.year} 年`
    }

    return null
  }

  return (
    <TooltipProvider>
      <Card className="border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-lg font-medium whitespace-nowrap">最近录入记录</CardTitle>

              <div className="flex items-center gap-2">
                {dateFilter && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm">
                    <span>{getFilterDescription()}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={onClearFilters}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
              </div>
            </div>

            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">暂无记录</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="animate-fade-in" style={{ animationDelay: "50ms" }}>
                    <TableHead className="w-[120px]">日期</TableHead>
                    <TableHead className="w-[180px]">快递类型</TableHead>
                    <TableHead className="w-[80px] text-center">数量</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead className="w-[100px] text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className={cn(
                        "transition-all duration-300 hover:bg-gray-50",
                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                      )}
                      style={{ transitionDelay: `${index * 50 + 100}ms` }}
                    >
                      <TableCell className="w-[120px] whitespace-nowrap">
                        {format(new Date(entry.date), "yyyy-MM-dd")}
                      </TableCell>
                      <TableCell className="w-[180px] font-medium">{entry.courierTypeName}</TableCell>
                      <TableCell className="w-[80px] text-center">{entry.quantity}</TableCell>
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
                              className="max-w-[400px] bg-white border shadow-md p-3 z-50"
                            >
                              <p className="text-sm text-gray-700 break-words whitespace-normal">{entry.remarks}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="w-[100px]">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingEntry(entry)}
                            disabled={isLoading}
                            className="h-8 w-8 transition-colors hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4 text-blue-600" />
                            <span className="sr-only">编辑</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(entry.id.toString())}
                            disabled={isLoading}
                            className="h-8 w-8 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">删除</span>
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
          <div className="text-sm text-muted-foreground">共 {totalRecords} 条记录</div>
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
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>您确定要删除这条发货记录吗？此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 transition-colors">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="sm:max-w-[600px] animate-scale-in">
          <DialogHeader>
            <DialogTitle>编辑发货记录</DialogTitle>
          </DialogHeader>
          {editingEntry && <SingleEntryForm onSubmit={handleUpdate} isLoading={isLoading} initialData={editingEntry} />}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
