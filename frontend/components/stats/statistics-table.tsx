"use client";
import { useTranslation } from "react-i18next";

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { ApiError } from "@/components/api-error"
import { LoadingSpinner } from "@/components/loading-spinner"
import { format } from "date-fns"
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
  viewMode?: "flat" | "hierarchical"
  onViewModeChange?: (mode: "flat" | "hierarchical") => void
  expandedItems?: Set<string | number>
  onToggleExpanded?: (id: string | number) => void
  onToggleAllExpanded?: (expand: boolean) => void
}

export function StatisticsTable({ 
  data, 
  isLoading, 
  error, 
  onRetry,
  viewMode = "flat",
  onViewModeChange,
  expandedItems = new Set(),
  onToggleExpanded,
  onToggleAllExpanded
}: StatisticsTableProps) {
  const {
    t: t
  } = useTranslation();

  const [showDetails, setShowDetails] = useState(false)

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

  // 递归渲染层级数据行
  const renderHierarchicalRows = (items: any[], level = 0) => {
    return items.map(item => {
      const isExpanded = expandedItems.has(item.id);
      const hasChildren = item.children && item.children.length > 0;
      
      return (
        <React.Fragment key={item.id}>
          <TableRow className={cn(
            level > 0 && "bg-muted/20",
          )}>
            <TableCell className="font-medium">
              <div className="flex items-center">
                <div style={{ width: `${level * 16}px` }} />
                {hasChildren && onToggleExpanded && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 mr-1"
                    onClick={() => onToggleExpanded(item.id)}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                )}
                {!hasChildren && <div className="w-6" />}
                <span className={level === 0 ? "font-semibold" : ""}>{item.name}</span>
                {level === 0 && (
                  <div className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    {t("母类型")}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right font-medium">
              {item.total_with_children}
              {level === 0 && item.own_total > 0 && (
                <div className="text-xs text-gray-500">
                  ({t("自有")}: {item.own_total})
                </div>
              )}
            </TableCell>
            <TableCell className="text-right">
              {data.summary.total > 0 ? `${((item.total_with_children / data.summary.total) * 100).toFixed(2)}%` : "0%"}
            </TableCell>
            <TableCell className="text-right">
              {item.record_count_with_children}
              {level === 0 && item.own_record_count > 0 && (
                <div className="text-xs text-gray-500">
                  ({t("自有")}: {item.own_record_count})
                </div>
              )}
            </TableCell>
          </TableRow>
          
          {isExpanded && hasChildren && (
            renderHierarchicalRows(item.children, level + 1)
          )}
        </React.Fragment>
      );
    });
  };

  return (
    (<div className="space-y-6">
      {/* 总计数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">{t("总发货量")}</p>
              <p className="text-3xl font-bold mt-1">{data.summary.total}</p>
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
              <p className="text-3xl font-bold mt-1">{data.summary.recordCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 按快递类型统计表格 */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">{t("按快递类型统计")}</h3>
          
          <div className="flex items-center gap-2">
            {viewMode === "hierarchical" && onToggleAllExpanded && (
              <div className="flex items-center gap-1 mr-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => onToggleAllExpanded(!expandedItems.size)}
                >
                  <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
                  {expandedItems.size ? t("全部折叠") : t("全部展开")}
                </Button>
              </div>
            )}
            
            {onViewModeChange && (
              <div className="flex items-center border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "flat" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "rounded-none border-0",
                    viewMode === "flat" ? "bg-primary text-primary-foreground" : "bg-transparent hover:bg-muted"
                  )}
                  onClick={() => onViewModeChange("flat")}
                >
                  {t("平铺视图")}
                </Button>
                <Button
                  variant={viewMode === "hierarchical" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "rounded-none border-0",
                    viewMode === "hierarchical" ? "bg-primary text-primary-foreground" : "bg-transparent hover:bg-muted"
                  )}
                  onClick={() => onViewModeChange("hierarchical")}
                >
                  {t("层级视图")}
                </Button>
              </div>
            )}
          </div>
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
              {viewMode === "flat" ? (
                // 平铺视图
                <>
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
                </>
              ) : (
                // 层级视图
                data.hierarchical && data.hierarchical.length > 0 ? (
                  renderHierarchicalRows(data.hierarchical)
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      {t("暂无层级数据")}
                    </TableCell>
                  </TableRow>
                )
              )}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">{t("总计")}</TableCell>
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
              {data.byDate.map((dateItem) => (
                <React.Fragment key={dateItem.date}>
                  <TableRow key={`row-${dateItem.date}`}>
                    <TableCell className="font-medium">
                      {format(new Date(dateItem.date), "yyyy-MM-dd")}
                      <div className="text-xs text-gray-500">
                        {t(`weekday.full.${format(new Date(dateItem.date), 'EEEE').toLowerCase()}`)}
                      </div>
                    </TableCell>
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
                </React.Fragment>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">{t("总计")}</TableCell>
                <TableCell className="text-right font-bold">{data.summary.total}</TableCell>
                <TableCell className="text-right font-bold">100%</TableCell>
                <TableCell className="text-right font-bold">{data.summary.recordCount}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>)
  );
}
