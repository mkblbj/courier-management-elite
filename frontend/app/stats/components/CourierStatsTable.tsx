import React, { useState, useRef, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CourierStatsItem } from '@/lib/types/stats';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ArrowRight, ChevronDown, ChevronUp, Download, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuLabel,
      DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';

interface CourierStatsTableProps {
      data: CourierStatsItem[];
      isLoading?: boolean;
      error?: Error | null;
      onRetry?: () => void;
      enableVirtualization?: boolean;
      maxHeight?: number;
      pageSize?: number;
}

type SortField = 'courier_name' | 'total_quantity' | 'percentage' | 'daily_average' | 'shops_count';
type SortDirection = 'asc' | 'desc';

const CourierStatsTable: React.FC<CourierStatsTableProps> = ({
      data,
      isLoading = false,
      error = null,
      onRetry,
      enableVirtualization = true,
      maxHeight = 600,
      pageSize: customPageSize = 20,
}) => {
      const { t } = useTranslation('stats');
      const [sortField, setSortField] = useState<SortField>('total_quantity');
      const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
      const [currentPage, setCurrentPage] = useState(1);

      // 使用传入的pageSize或默认值
      const effectivePageSize = enableVirtualization ? 1000 : customPageSize;

      const parentRef = useRef<HTMLDivElement>(null);

      const handleSort = (field: SortField) => {
            if (field === sortField) {
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
                  setSortField(field);
                  setSortDirection('desc');
            }
      };

      const sortedData = useMemo(() => {
            return [...data].sort((a, b) => {
                  let valueA, valueB;

                  switch (sortField) {
                        case 'courier_name':
                              valueA = a.courier_name;
                              valueB = b.courier_name;
                              return sortDirection === 'asc'
                                    ? valueA.localeCompare(valueB)
                                    : valueB.localeCompare(valueA);
                        case 'total_quantity':
                              valueA = a.total_quantity;
                              valueB = b.total_quantity;
                              break;
                        case 'percentage':
                              valueA = a.percentage || 0;
                              valueB = b.percentage || 0;
                              break;
                        case 'daily_average':
                              valueA = a.daily_average || 0;
                              valueB = b.daily_average || 0;
                              break;
                        case 'shops_count':
                              valueA = a.shops_count || 0;
                              valueB = b.shops_count || 0;
                              break;
                        default:
                              valueA = a.total_quantity;
                              valueB = b.total_quantity;
                  }

                  return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
            });
      }, [data, sortField, sortDirection]);

      const paginatedData = useMemo(() => {
            if (enableVirtualization) {
                  return sortedData;
            }
            const startIndex = (currentPage - 1) * effectivePageSize;
            return sortedData.slice(startIndex, startIndex + effectivePageSize);
      }, [sortedData, currentPage, effectivePageSize, enableVirtualization]);

      const totalPages = Math.ceil(sortedData.length / effectivePageSize);

      const rowVirtualizer = useVirtualizer({
            count: enableVirtualization ? sortedData.length : paginatedData.length,
            getScrollElement: () => parentRef.current,
            estimateSize: () => 56,
            overscan: 10,
      });

      const formatNumber = (value: number) => {
            return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
      };

      const formatQuantity = (value: number) => {
            return new Intl.NumberFormat('zh-CN').format(value);
      };

      const renderSortIcon = (field: SortField) => {
            if (sortField !== field) return null;
            return sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4 text-blue-600" /> : <ArrowDown className="ml-1 h-4 w-4 text-blue-600" />;
      };

      // 处理变化率显示的辅助函数
      const renderChangeRate = (changeRate?: number, changeType?: 'increase' | 'decrease' | 'unchanged') => {
            if (changeRate === undefined || changeRate === null) return '-';

            // 确保changeRate是数字
            const numericRate = typeof changeRate === 'string' ? parseFloat(changeRate) : changeRate;
            if (isNaN(numericRate)) return '-';

            const absoluteRate = Math.abs(numericRate);
            const formattedRate = `${absoluteRate.toFixed(2)}%`;

            // 如果未提供变化类型，根据变化率判断
            let effectiveChangeType = changeType;
            if (!effectiveChangeType) {
                  effectiveChangeType = numericRate > 0 ? 'increase' : numericRate < 0 ? 'decrease' : 'unchanged';
            }

            // 修正：根据实际数值覆盖API返回的类型，防止类型不匹配导致的显示错误
            if (numericRate > 0 && effectiveChangeType !== 'increase') {
                  effectiveChangeType = 'increase';
            } else if (numericRate < 0 && effectiveChangeType !== 'decrease') {
                  effectiveChangeType = 'decrease';
            } else if (numericRate === 0 && effectiveChangeType !== 'unchanged') {
                  effectiveChangeType = 'unchanged';
            }

            switch (effectiveChangeType) {
                  case 'increase':
                        return (
                              <div className="flex items-center text-green-600 whitespace-nowrap font-medium">
                                    <ArrowUp className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="text-xs">{formattedRate}</span>
                              </div>
                        );
                  case 'decrease':
                        return (
                              <div className="flex items-center text-red-600 whitespace-nowrap font-medium">
                                    <ArrowDown className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="text-xs">{formattedRate}</span>
                              </div>
                        );
                  case 'unchanged':
                        return (
                              <div className="flex items-center text-gray-500 whitespace-nowrap font-medium">
                                    <ArrowRight className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="text-xs">{formattedRate}</span>
                              </div>
                        );
                  default:
                        return formattedRate;
            }
      };

      // 同时渲染同比和环比变化率
      const renderCombinedChangeRate = (courier: CourierStatsItem) => {
            // 获取同比和环比的值
            const yoyRate = courier.yoy_change_rate;
            const yoyType = courier.yoy_change_type;
            const momRate = courier.mom_change_rate;
            const momType = courier.mom_change_type;

            // 获取同比和环比的渲染元素
            const yoyElement = renderChangeRate(yoyRate, yoyType);
            const momElement = renderChangeRate(momRate, momType);

            // 只有当两个值都存在时才显示组合格式
            if (yoyElement !== '-' && momElement !== '-') {
                  return (
                        <div className="bg-slate-50 rounded-lg px-3 py-2 inline-flex flex-col items-center gap-1 min-w-[120px]">
                              <div className="flex items-center gap-1">
                                    <span className="text-xs text-slate-600 font-medium">{t('同比')}</span>
                                    {yoyElement}
                              </div>
                              <div className="w-full h-px bg-slate-200"></div>
                              <div className="flex items-center gap-1">
                                    <span className="text-xs text-slate-600 font-medium">{t('环比')}</span>
                                    {momElement}
                              </div>
                        </div>
                  );
            } else if (yoyElement !== '-') {
                  return (
                        <div className="bg-slate-50 rounded-lg px-3 py-2 inline-flex items-center gap-1 min-w-[100px]">
                              <span className="text-xs text-slate-600 font-medium">{t('同比')}</span>
                              {yoyElement}
                        </div>
                  );
            } else if (momElement !== '-') {
                  return (
                        <div className="bg-slate-50 rounded-lg px-3 py-2 inline-flex items-center gap-1 min-w-[100px]">
                              <span className="text-xs text-slate-600 font-medium">{t('环比')}</span>
                              {momElement}
                        </div>
                  );
            }

            return <span className="text-slate-400 text-sm">-</span>;
      };

      const renderTableRow = (courier: CourierStatsItem, style?: React.CSSProperties) => {
            return (
                  <TableRow key={courier.courier_id} style={style} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                        <TableCell className="font-semibold text-slate-800 min-w-[120px]">
                              <div className="flex items-center gap-2">
                                    <span>{courier.courier_name}</span>
                              </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-slate-800 min-w-[100px]">
                              {formatQuantity(courier.total_quantity)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-700 min-w-[80px]">
                              {courier.percentage !== undefined ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                                          {formatNumber(courier.percentage)}%
                                    </span>
                              ) : (
                                    <span className="text-slate-400">-</span>
                              )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-700 min-w-[80px]">
                              {courier.daily_average !== undefined ? (
                                    <span className="font-semibold">{formatNumber(courier.daily_average)}</span>
                              ) : (
                                    <span className="text-slate-400">-</span>
                              )}
                        </TableCell>
                        <TableCell className="text-right min-w-[80px]">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                    {courier.shops_count || 0}
                              </span>
                        </TableCell>
                        <TableCell className="text-center min-w-[140px] p-2">
                              <div className="flex justify-center">
                                    {renderCombinedChangeRate(courier)}
                              </div>
                        </TableCell>
                  </TableRow>
            );
      };

      if (isLoading) {
            return (
                  <Card>
                        <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    {t('加载中')}...
                              </CardTitle>
                        </CardHeader>
                        <CardContent>
                              <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                                    ))}
                              </div>
                        </CardContent>
                  </Card>
            );
      }

      if (error) {
            return (
                  <Card>
                        <CardHeader>
                              <CardTitle className="text-destructive">{t('加载失败')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                              <p className="text-muted-foreground mb-4">{error.message}</p>
                              {onRetry && (
                                    <Button onClick={onRetry} variant="outline">
                                          {t('重试')}
                                    </Button>
                              )}
                        </CardContent>
                  </Card>
            );
      }

      if (!data || data.length === 0) {
            return (
                  <Card>
                        <CardHeader>
                              <CardTitle>{t('按快递类型统计')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                              <p className="text-muted-foreground text-center py-8">
                                    {t('暂无数据')}
                              </p>
                        </CardContent>
                  </Card>
            );
      }

      return (
            <Card>
                  <CardHeader>
                        <div className="flex justify-between items-center">
                              <CardTitle>{t('按快递类型统计')}</CardTitle>
                              <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                          {t('共')} {data.length} {t('个快递类型')}
                                    </span>
                                    <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                      <Download className="h-4 w-4 mr-1" />
                                                      {t('导出')}
                                                </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent>
                                                <DropdownMenuLabel>{t('导出格式')}</DropdownMenuLabel>
                                                <DropdownMenuItem>Excel (.xlsx)</DropdownMenuItem>
                                                <DropdownMenuItem>CSV (.csv)</DropdownMenuItem>
                                                <DropdownMenuItem>PDF (.pdf)</DropdownMenuItem>
                                          </DropdownMenuContent>
                                    </DropdownMenu>
                              </div>
                        </div>
                  </CardHeader>
                  <CardContent>
                        <div
                              ref={parentRef}
                              className="relative overflow-auto border rounded-md"
                              style={{ height: enableVirtualization ? `${maxHeight}px` : 'auto' }}
                        >
                              <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                          <TableRow>
                                                <TableHead className="w-[200px]">
                                                      <Button
                                                            variant="ghost"
                                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                                            onClick={() => handleSort('courier_name')}
                                                      >
                                                            {t('快递类型')}
                                                            {renderSortIcon('courier_name')}
                                                      </Button>
                                                </TableHead>
                                                <TableHead className="text-right">
                                                      <Button
                                                            variant="ghost"
                                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                                            onClick={() => handleSort('total_quantity')}
                                                      >
                                                            {t('总出力量')}
                                                            {renderSortIcon('total_quantity')}
                                                      </Button>
                                                </TableHead>
                                                <TableHead className="text-right">
                                                      <Button
                                                            variant="ghost"
                                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                                            onClick={() => handleSort('percentage')}
                                                      >
                                                            {t('占比')}
                                                            {renderSortIcon('percentage')}
                                                      </Button>
                                                </TableHead>
                                                <TableHead className="text-right">
                                                      <Button
                                                            variant="ghost"
                                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                                            onClick={() => handleSort('daily_average')}
                                                      >
                                                            {t('日均出力')}
                                                            {renderSortIcon('daily_average')}
                                                      </Button>
                                                </TableHead>
                                                <TableHead className="text-right">
                                                      <Button
                                                            variant="ghost"
                                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                                            onClick={() => handleSort('shops_count')}
                                                      >
                                                            {t('涉及店铺数')}
                                                            {renderSortIcon('shops_count')}
                                                      </Button>
                                                </TableHead>
                                                <TableHead className="text-right w-[120px]">
                                                      {t('变化趋势')}
                                                </TableHead>
                                          </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                          {enableVirtualization ? (
                                                <div
                                                      style={{
                                                            height: `${rowVirtualizer.getTotalSize()}px`,
                                                            width: '100%',
                                                            position: 'relative',
                                                      }}
                                                >
                                                      {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                                                            const courier = sortedData[virtualItem.index];
                                                            return (
                                                                  <div
                                                                        key={virtualItem.key}
                                                                        style={{
                                                                              position: 'absolute',
                                                                              top: 0,
                                                                              left: 0,
                                                                              width: '100%',
                                                                              height: `${virtualItem.size}px`,
                                                                              transform: `translateY(${virtualItem.start}px)`,
                                                                        }}
                                                                  >
                                                                        {renderTableRow(courier)}
                                                                  </div>
                                                            );
                                                      })}
                                                </div>
                                          ) : (
                                                paginatedData.map((courier) => renderTableRow(courier))
                                          )}
                                    </TableBody>
                              </Table>
                        </div>

                        {!enableVirtualization && totalPages > 1 && (
                              <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                          {t('第')} {currentPage} {t('页，共')} {totalPages} {t('页')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                          <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                          >
                                                <ChevronUp className="h-4 w-4" />
                                                {t('上一页')}
                                          </Button>
                                          <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                          >
                                                {t('下一页')}
                                                <ChevronDown className="h-4 w-4" />
                                          </Button>
                                    </div>
                              </div>
                        )}
                  </CardContent>
            </Card>
      );
};

export default CourierStatsTable; 