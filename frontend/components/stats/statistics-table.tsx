"use client";
import { useTranslation } from "react-i18next";

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { ApiError } from "@/components/api-error"
import { LoadingSpinner } from "@/components/loading-spinner"
import { formatDisplayDate } from "@/lib/date-utils"
import type { StatisticsData } from "@/hooks/use-statistics-data"
import React from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, ChevronUp, ChevronDown as CollapseIcon, ChevronsUp as ExpandIcon, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatisticsTableProps {
  data: StatisticsData | null
  isLoading: boolean
  error: string | null
  onRetry: () => void
}

export function StatisticsTable({
  data,
  isLoading,
  error,
  onRetry
}: StatisticsTableProps) {
  const {
    t: t
  } = useTranslation();

  const [showDetails, setShowDetails] = useState(false)

  // 过滤掉名字中包含"未指定"的快递类型
  const filterUnspecifiedCouriers = (items: any[]) => {
    return items.filter(item => !item.courierName?.includes('未指定'))
  }

  if (isLoading) {
    return (
      (<div className="flex justify-center items-center h-[300px]">
        <LoadingSpinner size="lg" text={t("加载中...")} />
      </div>)
    );
  }

  if (error) {
    return <ApiError message={error} onRetry={onRetry} />
  }

  if (!data) {
    return <div className="text-center py-8 text-muted-foreground">{t("暂无统计数据")}</div>;
  }

  // 过滤数据
  const filteredByCourier = filterUnspecifiedCouriers(data.byCourier)
  const filteredByDate = data.byDate.map(dateItem => ({
    ...dateItem,
    details: dateItem.details ? filterUnspecifiedCouriers(dateItem.details) : []
  }))

  // 重新计算总计（基于过滤后的数据）
  const filteredTotal = filteredByCourier.reduce((sum, item) => sum + item.total, 0)
  const filteredRecordCount = filteredByCourier.reduce((sum, item) => sum + item.recordCount, 0)

  return (
    (<div className="space-y-6">
      {/* 总计数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">{t("总发货量")}</p>
              <p className="text-3xl font-bold mt-1">{filteredTotal}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">{t("统计天数")}</p>
              <p className="text-3xl font-bold mt-1">{data.summary.daysCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">{t("记录数量")}</p>
              <p className="text-3xl font-bold mt-1">{filteredRecordCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* 按快递类型统计表格 */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">{t("按快递类型统计")}</h3>
        </div>

        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("快递类型")}</TableHead>
                <TableHead className="text-right">{t("发货量")}</TableHead>
                <TableHead className="text-right">{t("占比")}</TableHead>
                <TableHead className="text-right">{t("记录数")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredByCourier.map((item) => (
                <TableRow key={item.courierId}>
                  <TableCell className="font-medium">{item.courierName}</TableCell>
                  <TableCell className="text-right">{item.total}</TableCell>
                  <TableCell className="text-right">
                    {filteredTotal > 0 ? `${((item.total / filteredTotal) * 100).toFixed(2)}%` : "0%"}
                  </TableCell>
                  <TableCell className="text-right">{item.recordCount}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">{t("总计")}</TableCell>
                <TableCell className="text-right font-bold">{filteredTotal}</TableCell>
                <TableCell className="text-right font-bold">100%</TableCell>
                <TableCell className="text-right font-bold">{filteredRecordCount}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
      {/* 按日期统计表格 */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">{t("按日期统计")}</h3>
          <button
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? t("隐藏详情") : t("显示详情")}
          </button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("日期")}</TableHead>
                <TableHead className="text-right">{t("发货量")}</TableHead>
                <TableHead className="text-right">{t("占比")}</TableHead>
                <TableHead className="text-right">{t("记录数")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredByDate.map((dateItem) => (
                <React.Fragment key={dateItem.date}>
                  <TableRow key={`row-${dateItem.date}`}>
                    <TableCell className="font-medium">
                      {formatDisplayDate(new Date(dateItem.date), "yyyy-MM-dd")}
                      <div className="text-xs text-gray-500">
                        {t(`weekday.full.${formatDisplayDate(new Date(dateItem.date), 'EEEE').toLowerCase()}`)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{dateItem.total}</TableCell>
                    <TableCell className="text-right">
                      {filteredTotal > 0 ? `${((dateItem.total / filteredTotal) * 100).toFixed(2)}%` : "0%"}
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
                </React.Fragment>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">{t("总计")}</TableCell>
                <TableCell className="text-right font-bold">{filteredTotal}</TableCell>
                <TableCell className="text-right font-bold">100%</TableCell>
                <TableCell className="text-right font-bold">{filteredRecordCount}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>)
  );
}
