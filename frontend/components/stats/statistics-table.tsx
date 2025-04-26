"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { ApiError } from "@/components/api-error"
import { LoadingSpinner } from "@/components/loading-spinner"
import { format } from "date-fns"
import type { StatisticsData } from "@/hooks/use-statistics-data"

interface StatisticsTableProps {
  data: StatisticsData | null
  isLoading: boolean
  error: string | null
  onRetry: () => void
}

export function StatisticsTable({ data, isLoading, error, onRetry }: StatisticsTableProps) {
  const [showDetails, setShowDetails] = useState(false)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <LoadingSpinner size="lg" text="加载中..." />
      </div>
    )
  }

  if (error) {
    return <ApiError message={error} onRetry={onRetry} />
  }

  if (!data) {
    return <div className="text-center py-8 text-muted-foreground">暂无统计数据</div>
  }

  return (
    <div className="space-y-6">
      {/* 总计数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">总发货量</p>
              <p className="text-3xl font-bold mt-1">{data.summary.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">统计天数</p>
              <p className="text-3xl font-bold mt-1">{data.summary.daysCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">记录数量</p>
              <p className="text-3xl font-bold mt-1">{data.summary.recordCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 按快递类型统计表格 */}
      <div>
        <h3 className="text-lg font-medium mb-3">按快递类型统计</h3>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>快递类型</TableHead>
                <TableHead className="text-right">发货量</TableHead>
                <TableHead className="text-right">占比</TableHead>
                <TableHead className="text-right">记录数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byCourier.map((item) => (
                <TableRow key={item.courierId}>
                  <TableCell className="font-medium">{item.courierName}</TableCell>
                  <TableCell className="text-right">{item.total}</TableCell>
                  <TableCell className="text-right">
                    {data.summary.total > 0 ? `${((item.total / data.summary.total) * 100).toFixed(2)}%` : "0%"}
                  </TableCell>
                  <TableCell className="text-right">{item.recordCount}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">总计</TableCell>
                <TableCell className="text-right font-bold">{data.summary.total}</TableCell>
                <TableCell className="text-right font-bold">100%</TableCell>
                <TableCell className="text-right font-bold">{data.summary.recordCount}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 按日期统计表格 */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">按日期统计</h3>
          <button
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "隐藏详情" : "显示详情"}
          </button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日期</TableHead>
                <TableHead className="text-right">发货量</TableHead>
                <TableHead className="text-right">占比</TableHead>
                <TableHead className="text-right">记录数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byDate.map((dateItem) => (
                <>
                  <TableRow key={dateItem.date}>
                    <TableCell className="font-medium">{format(new Date(dateItem.date), "yyyy-MM-dd")}</TableCell>
                    <TableCell className="text-right">{dateItem.total}</TableCell>
                    <TableCell className="text-right">
                      {data.summary.total > 0 ? `${((dateItem.total / data.summary.total) * 100).toFixed(2)}%` : "0%"}
                    </TableCell>
                    <TableCell className="text-right">{dateItem.recordCount}</TableCell>
                  </TableRow>

                  {/* 详细数据行 */}
                  {showDetails &&
                    dateItem.details &&
                    dateItem.details.map((detail) => (
                      <TableRow key={`${dateItem.date}-${detail.courierId}`} className="bg-muted/20">
                        <TableCell className="pl-8 text-sm text-muted-foreground">{detail.courierName}</TableCell>
                        <TableCell className="text-right text-sm">{detail.total}</TableCell>
                        <TableCell className="text-right text-sm">
                          {dateItem.total > 0 ? `${((detail.total / dateItem.total) * 100).toFixed(2)}%` : "0%"}
                        </TableCell>
                        <TableCell className="text-right text-sm">1</TableCell>
                      </TableRow>
                    ))}
                </>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">总计</TableCell>
                <TableCell className="text-right font-bold">{data.summary.total}</TableCell>
                <TableCell className="text-right font-bold">100%</TableCell>
                <TableCell className="text-right font-bold">{data.summary.recordCount}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
