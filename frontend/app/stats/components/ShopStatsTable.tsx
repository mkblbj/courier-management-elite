import React, { useState, useRef, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShopStatsItem } from '@/lib/types/stats';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ArrowRight, ChevronDown, ChevronUp, Download, Loader2 } from 'lucide-react';
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

interface ShopStatsTableProps {
      data: ShopStatsItem[];
      isLoading?: boolean;
      error?: Error | null;
      onRetry?: () => void;
      groupByCategory?: boolean;
      enableVirtualization?: boolean;
      maxHeight?: number;
      pageSize?: number;
}

type SortField = 'shop_name' | 'category_name' | 'total_quantity' | 'percentage' | 'daily_average';
type SortDirection = 'asc' | 'desc';

interface TableRowData {
      type: 'category' | 'shop' | 'expanded';
      id: string;
      data: any;
      level: number;
}

const ShopStatsTable: React.FC<ShopStatsTableProps> = ({
      data,
      isLoading = false,
      error = null,
      onRetry,
      groupByCategory = true,
      enableVirtualization = true,
      maxHeight = 600,
      // 自定义默认页数，默认20条
      pageSize: customPageSize = 20,
}) => {
      const { t } = useTranslation('stats');
      const [sortField, setSortField] = useState<SortField>('total_quantity');
      const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
      const [expandedShopIds, setExpandedShopIds] = useState<number[]>([]);
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

      const toggleRowExpand = (shopId: number) => {
            setExpandedShopIds(prev =>
                  prev.includes(shopId)
                        ? prev.filter(id => id !== shopId)
                        : [...prev, shopId]
            );
      };

      const sortedData = useMemo(() => {
            return [...data].sort((a, b) => {
                  let valueA, valueB;

                  switch (sortField) {
                        case 'shop_name':
                              valueA = a.shop_name;
                              valueB = b.shop_name;
                              return sortDirection === 'asc'
                                    ? valueA.localeCompare(valueB)
                                    : valueB.localeCompare(valueA);
                        case 'category_name':
                              valueA = a.category_name || '';
                              valueB = b.category_name || '';
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
                        default:
                              valueA = a.total_quantity;
                              valueB = b.total_quantity;
                  }

                  return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
            });
      }, [data, sortField, sortDirection]);

      const virtualRows = useMemo(() => {
            const rows: TableRowData[] = [];

            if (groupByCategory) {
                  const groupedData = sortedData.reduce<Record<string, ShopStatsItem[]>>((groups, item) => {
                        const categoryName = item.category_name || '未分类';
                        if (!groups[categoryName]) {
                              groups[categoryName] = [];
                        }
                        groups[categoryName].push(item);
                        return groups;
                  }, {});

                  Object.entries(groupedData).forEach(([categoryName, shops]) => {
                        rows.push({
                              type: 'category',
                              id: `category-${categoryName}`,
                              data: { categoryName, shopsCount: shops.length },
                              level: 0
                        });

                        shops.forEach(shop => {
                              rows.push({
                                    type: 'shop',
                                    id: `shop-${shop.shop_id}`,
                                    data: shop,
                                    level: 1
                              });

                              if (expandedShopIds.includes(shop.shop_id) && shop.courier_distribution) {
                                    rows.push({
                                          type: 'expanded',
                                          id: `expanded-${shop.shop_id}`,
                                          data: shop.courier_distribution,
                                          level: 2
                                    });
                              }
                        });
                  });
            } else {
                  sortedData.forEach(shop => {
                        rows.push({
                              type: 'shop',
                              id: `shop-${shop.shop_id}`,
                              data: shop,
                              level: 0
                        });

                        if (expandedShopIds.includes(shop.shop_id) && shop.courier_distribution) {
                              rows.push({
                                    type: 'expanded',
                                    id: `expanded-${shop.shop_id}`,
                                    data: shop.courier_distribution,
                                    level: 1
                              });
                        }
                  });
            }

            return rows;
      }, [sortedData, groupByCategory, expandedShopIds]);

      const paginatedRows = useMemo(() => {
            if (enableVirtualization) {
                  return virtualRows;
            }
            const startIndex = (currentPage - 1) * effectivePageSize;
            return virtualRows.slice(startIndex, startIndex + effectivePageSize);
      }, [virtualRows, currentPage, effectivePageSize, enableVirtualization]);

      const totalPages = Math.ceil(virtualRows.length / effectivePageSize);

      const rowVirtualizer = useVirtualizer({
            count: enableVirtualization ? virtualRows.length : paginatedRows.length,
            getScrollElement: () => parentRef.current,
            estimateSize: (index) => {
                  const row = enableVirtualization ? virtualRows[index] : paginatedRows[index];
                  if (row.type === 'category') return 48;
                  if (row.type === 'expanded') return 200;
                  return 56;
            },
            overscan: 10,
      });

      const formatNumber = (value: number) => {
            return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };

      const formatQuantity = (value: number) => {
            return value.toLocaleString('zh-CN');
      };

      const renderSortIcon = (field: SortField) => {
            if (field !== sortField) return null;
            return sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />;
      };

      // 处理变化率显示的辅助函数
      const renderChangeRate = (changeRate?: number, changeType?: 'increase' | 'decrease' | 'unchanged') => {
            if (changeRate === undefined) return '-';

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
      const renderCombinedChangeRate = (shop: ShopStatsItem) => {
            // 获取同比和环比的值
            const yoyRate = shop.yoy_change_rate;
            const yoyType = shop.yoy_change_type;
            const momRate = shop.mom_change_rate;
            const momType = shop.mom_change_type;

            // 获取同比和环比的渲染元素
            const yoyElement = renderChangeRate(yoyRate, yoyType);
            const momElement = renderChangeRate(momRate, momType);

            // 只有当两个值都存在时才显示组合格式
            if (yoyElement !== '-' && momElement !== '-') {
                  return (
                        <div className="bg-slate-50 rounded-lg px-3 py-2 inline-flex flex-col items-center gap-1 min-w-[120px]">
                              <div className="flex items-center gap-1">
                                    <span className="text-xs text-slate-600 font-medium">同比</span>
                                    {yoyElement}
                              </div>
                              <div className="w-full h-px bg-slate-200"></div>
                              <div className="flex items-center gap-1">
                                    <span className="text-xs text-slate-600 font-medium">环比</span>
                                    {momElement}
                              </div>
                        </div>
                  );
            } else if (yoyElement !== '-') {
                  return (
                        <div className="bg-slate-50 rounded-lg px-3 py-2 inline-flex items-center gap-1 min-w-[100px]">
                              <span className="text-xs text-slate-600 font-medium">同比</span>
                              {yoyElement}
                        </div>
                  );
            } else if (momElement !== '-') {
                  return (
                        <div className="bg-slate-50 rounded-lg px-3 py-2 inline-flex items-center gap-1 min-w-[100px]">
                              <span className="text-xs text-slate-600 font-medium">环比</span>
                              {momElement}
                        </div>
                  );
            }

            return <span className="text-slate-400 text-sm">-</span>;
      };

      const renderTableRow = (rowData: TableRowData, style?: React.CSSProperties) => {
            const { type, data: rowDataContent, level } = rowData;

            if (type === 'category') {
                  return (
                        <TableRow key={rowData.id} className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200" style={style}>
                              <TableCell colSpan={7} className="font-semibold text-slate-700 py-3 px-4">
                                    <div className="flex items-center gap-2">
                                          <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                          <span className="text-base">{rowDataContent.categoryName}</span>
                                          <span className="text-sm text-slate-500 bg-white px-2 py-1 rounded-full">
                                                {rowDataContent.shopsCount} 家店铺
                                          </span>
                                    </div>
                              </TableCell>
                        </TableRow>
                  );
            }

            if (type === 'expanded') {
                  return (
                        <TableRow key={rowData.id} className="bg-slate-50/50" style={style}>
                              <TableCell></TableCell>
                              <TableCell colSpan={6}>
                                    <div className="py-3 px-4">
                                          <h4 className="text-sm font-semibold mb-3 text-slate-700 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-orange-400 rounded-full"></div>
                                                快递类型分布
                                          </h4>
                                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                                <Table>
                                                      <TableHeader>
                                                            <TableRow className="bg-slate-50">
                                                                  <TableHead className="font-semibold text-slate-700">快递类型</TableHead>
                                                                  <TableHead className="text-right font-semibold text-slate-700">数量</TableHead>
                                                                  <TableHead className="text-right font-semibold text-slate-700">占比</TableHead>
                                                            </TableRow>
                                                      </TableHeader>
                                                      <TableBody>
                                                            {Object.entries(rowDataContent as Record<string, any>).map(([courierId, courierData]: [string, any]) => (
                                                                  <TableRow key={courierId} className="hover:bg-slate-50">
                                                                        <TableCell className="font-medium">{courierData.courier_name}</TableCell>
                                                                        <TableCell className="text-right font-mono">{formatQuantity(courierData.quantity)}</TableCell>
                                                                        <TableCell className="text-right font-mono">{formatNumber(courierData.percentage)}%</TableCell>
                                                                  </TableRow>
                                                            ))}
                                                      </TableBody>
                                                </Table>
                                          </div>
                                    </div>
                              </TableCell>
                        </TableRow>
                  );
            }

            const shop = rowDataContent as ShopStatsItem;
            return (
                  <TableRow key={rowData.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100" style={style}>
                        <TableCell className="w-12 text-center" style={{ paddingLeft: `${level * 16 + 8}px` }}>
                              {shop.courier_distribution && (
                                    <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 hover:bg-slate-200"
                                          onClick={() => toggleRowExpand(shop.shop_id)}
                                          aria-label={expandedShopIds.includes(shop.shop_id) ? '收起' : '展开'}
                                    >
                                          {expandedShopIds.includes(shop.shop_id) ? (
                                                <ChevronUp className="h-4 w-4 text-slate-600" />
                                          ) : (
                                                <ChevronDown className="h-4 w-4 text-slate-600" />
                                          )}
                                    </Button>
                              )}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800 min-w-[120px]">
                              {shop.shop_name}
                        </TableCell>
                        <TableCell className="text-slate-600 min-w-[100px]">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                    {shop.category_name || '未分类'}
                              </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-slate-800 min-w-[100px]">
                              {formatQuantity(shop.total_quantity)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-700 min-w-[80px]">
                              {shop.percentage !== undefined ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                                          {formatNumber(shop.percentage)}%
                                    </span>
                              ) : (
                                    <span className="text-slate-400">-</span>
                              )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-700 min-w-[80px]">
                              {shop.daily_average !== undefined ? (
                                    <span className="font-semibold">{formatNumber(shop.daily_average)}</span>
                              ) : (
                                    <span className="text-slate-400">-</span>
                              )}
                        </TableCell>
                        <TableCell className="text-center min-w-[140px] p-2">
                              <div className="flex justify-center">
                                    {renderCombinedChangeRate(shop)}
                              </div>
                        </TableCell>
                  </TableRow>
            );
      };

      if (isLoading) {
            return (
                  <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
            );
      }

      if (error) {
            return (
                  <div className="text-center py-8">
                        <p className="text-destructive mb-4">{error.message || '获取数据失败'}</p>
                        {onRetry && (
                              <Button onClick={onRetry} variant="outline">
                                    重试
                              </Button>
                        )}
                  </div>
            );
      }

      if (data.length === 0) {
            return (
                  <div className="text-center py-8 text-muted-foreground">
                        暂无店铺统计数据
                  </div>
            );
      }

      return (
            <div className="space-y-4">
                  {enableVirtualization && data.length > 100 && (
                        <div className="text-sm text-muted-foreground bg-muted/20 p-2 rounded">
                              <span className="font-medium">性能模式：</span>
                              虚拟滚动已启用，显示 {data.length} 条记录
                        </div>
                  )}

                  <div className="overflow-hidden border rounded-lg shadow-sm bg-white">
                        <Table>
                              <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-50 sticky top-0 z-10 border-b-2 border-slate-200">
                                    <TableRow>
                                          <TableHead className="w-12 text-center font-semibold text-slate-700">
                                                <div className="flex items-center justify-center">
                                                      <span className="sr-only">展开</span>
                                                </div>
                                          </TableHead>
                                          <TableHead className="cursor-pointer min-w-[120px] font-semibold text-slate-700" onClick={() => handleSort('shop_name')}>
                                                <div className="flex items-center hover:text-blue-600 transition-colors">
                                                      {t('店铺名称')}
                                                      {renderSortIcon('shop_name')}
                                                </div>
                                          </TableHead>
                                          <TableHead className="cursor-pointer min-w-[100px] font-semibold text-slate-700" onClick={() => handleSort('category_name')}>
                                                <div className="flex items-center hover:text-blue-600 transition-colors">
                                                      {t('所属类别')}
                                                      {renderSortIcon('category_name')}
                                                </div>
                                          </TableHead>
                                          <TableHead className="text-right cursor-pointer min-w-[100px] font-semibold text-slate-700" onClick={() => handleSort('total_quantity')}>
                                                <div className="flex items-center justify-end hover:text-blue-600 transition-colors">
                                                      {t('总出力量')}
                                                      {renderSortIcon('total_quantity')}
                                                </div>
                                          </TableHead>
                                          <TableHead className="text-right cursor-pointer min-w-[80px] font-semibold text-slate-700" onClick={() => handleSort('percentage')}>
                                                <div className="flex items-center justify-end hover:text-blue-600 transition-colors">
                                                      {t('占比')}
                                                      {renderSortIcon('percentage')}
                                                </div>
                                          </TableHead>
                                          <TableHead className="text-right cursor-pointer min-w-[80px] font-semibold text-slate-700" onClick={() => handleSort('daily_average')}>
                                                <div className="flex items-center justify-end hover:text-blue-600 transition-colors">
                                                      {t('日均量')}
                                                      {renderSortIcon('daily_average')}
                                                </div>
                                          </TableHead>
                                          <TableHead className="text-center min-w-[140px] font-semibold text-slate-700">
                                                <TooltipProvider>
                                                      <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                  <div className="flex items-center justify-center gap-1 hover:text-blue-600 transition-colors cursor-help">
                                                                        <span>{t('同比/环比')}</span>
                                                                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                                                                  </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                  <p>{t('同比（与去年同期相比）/ 环比（与上一个月相比）')}</p>
                                                            </TooltipContent>
                                                      </Tooltip>
                                                </TooltipProvider>
                                          </TableHead>
                                    </TableRow>
                              </TableHeader>
                        </Table>

                        {/* 虚拟滚动容器 */}
                        {enableVirtualization ? (
                              <div
                                    ref={parentRef}
                                    className="overflow-auto bg-white"
                                    style={{ height: `${maxHeight}px` }}
                              >
                                    <div
                                          style={{
                                                height: `${rowVirtualizer.getTotalSize()}px`,
                                                width: '100%',
                                                position: 'relative',
                                          }}
                                    >
                                          <Table>
                                                <TableBody>
                                                      {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                                                            const rowData = virtualRows[virtualItem.index];
                                                            return (
                                                                  <React.Fragment key={virtualItem.key}>
                                                                        <div
                                                                              style={{
                                                                                    position: 'absolute',
                                                                                    top: 0,
                                                                                    left: 0,
                                                                                    width: '100%',
                                                                                    transform: `translateY(${virtualItem.start}px)`,
                                                                              }}
                                                                        >
                                                                              {renderTableRow(rowData)}
                                                                        </div>
                                                                  </React.Fragment>
                                                            );
                                                      })}
                                                </TableBody>
                                          </Table>
                                    </div>
                              </div>
                        ) : (
                              // 传统分页模式
                              <div className="overflow-x-auto bg-white">
                                    <Table>
                                          <TableBody>
                                                {paginatedRows.map((rowData) => renderTableRow(rowData))}
                                          </TableBody>
                                    </Table>
                              </div>
                        )}
                  </div>

                  {!enableVirtualization && totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
                              <div className="text-sm text-slate-600">
                                    共 <span className="font-semibold text-slate-800">{data.length}</span> 家店铺，
                                    <span className="font-semibold text-slate-800">{totalPages}</span> 页
                              </div>
                              <div className="flex items-center space-x-2">
                                    <Button
                                          variant="outline"
                                          size="sm"
                                          className="border-slate-300 hover:bg-slate-50"
                                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                          disabled={currentPage === 1}
                                    >
                                          上一页
                                    </Button>
                                    <div className="flex items-center gap-1">
                                          <span className="text-sm text-slate-600">第</span>
                                          <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-700 rounded-md">
                                                {currentPage}/{totalPages}
                                          </span>
                                          <span className="text-sm text-slate-600">页</span>
                                    </div>
                                    <Button
                                          variant="outline"
                                          size="sm"
                                          className="border-slate-300 hover:bg-slate-50"
                                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                          disabled={currentPage === totalPages}
                                    >
                                          下一页
                                    </Button>
                              </div>
                        </div>
                  )}

                  <div className="flex justify-between items-center bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
                        <div className="text-sm text-slate-600">
                              {enableVirtualization ? (
                                    <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                          <span>虚拟滚动模式 - 共 <span className="font-semibold text-slate-800">{data.length}</span> 条记录</span>
                                    </div>
                              ) : (
                                    <span>分页模式 - 第 <span className="font-semibold text-slate-800">{currentPage}/{totalPages}</span> 页</span>
                              )}
                        </div>
                        <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                        >
                              <Download className="h-4 w-4" />
                              {t('导出数据')}
                        </Button>
                  </div>
            </div>
      );
};

export default ShopStatsTable; 