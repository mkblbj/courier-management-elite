import React, { useState, useRef, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShopStatsItem } from '@/lib/types/stats';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Download, Loader2 } from 'lucide-react';
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
}) => {
      const { t } = useTranslation('stats');
      const [sortField, setSortField] = useState<SortField>('total_quantity');
      const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
      const [expandedShopIds, setExpandedShopIds] = useState<number[]>([]);
      const [currentPage, setCurrentPage] = useState(1);
      const pageSize = enableVirtualization ? 1000 : 10;

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
            const startIndex = (currentPage - 1) * pageSize;
            return virtualRows.slice(startIndex, startIndex + pageSize);
      }, [virtualRows, currentPage, pageSize, enableVirtualization]);

      const totalPages = Math.ceil(virtualRows.length / pageSize);

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

      const renderSortIcon = (field: SortField) => {
            if (field !== sortField) return null;
            return sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />;
      };

      const renderTableRow = (rowData: TableRowData, style?: React.CSSProperties) => {
            const { type, data: rowDataContent, level } = rowData;

            if (type === 'category') {
                  return (
                        <TableRow key={rowData.id} className="bg-muted/30" style={style}>
                              <TableCell colSpan={8} className="font-medium">
                                    {rowDataContent.categoryName} ({rowDataContent.shopsCount} 家店铺)
                              </TableCell>
                        </TableRow>
                  );
            }

            if (type === 'expanded') {
                  return (
                        <TableRow key={rowData.id} className="bg-muted/20" style={style}>
                              <TableCell></TableCell>
                              <TableCell colSpan={7}>
                                    <div className="py-2">
                                          <h4 className="text-sm font-medium mb-2">快递类型分布</h4>
                                          <Table>
                                                <TableHeader>
                                                      <TableRow>
                                                            <TableHead>快递类型</TableHead>
                                                            <TableHead className="text-right">数量</TableHead>
                                                            <TableHead className="text-right">占比</TableHead>
                                                      </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                      {Object.entries(rowDataContent as Record<string, any>).map(([courierId, courierData]: [string, any]) => (
                                                            <TableRow key={courierId}>
                                                                  <TableCell>{courierData.courier_name}</TableCell>
                                                                  <TableCell className="text-right">{courierData.quantity}</TableCell>
                                                                  <TableCell className="text-right">{formatNumber(courierData.percentage)}%</TableCell>
                                                            </TableRow>
                                                      ))}
                                                </TableBody>
                                          </Table>
                                    </div>
                              </TableCell>
                        </TableRow>
                  );
            }

            const shop = rowDataContent as ShopStatsItem;
            return (
                  <TableRow key={rowData.id} className="hover:bg-muted/50" style={style}>
                        <TableCell style={{ paddingLeft: `${level * 16 + 8}px` }}>
                              {shop.courier_distribution && (
                                    <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => toggleRowExpand(shop.shop_id)}
                                          aria-label={expandedShopIds.includes(shop.shop_id) ? '收起' : '展开'}
                                    >
                                          {expandedShopIds.includes(shop.shop_id) ? (
                                                <ChevronUp className="h-4 w-4" />
                                          ) : (
                                                <ChevronDown className="h-4 w-4" />
                                          )}
                                    </Button>
                              )}
                        </TableCell>
                        <TableCell className="font-medium">{shop.shop_name}</TableCell>
                        <TableCell>{shop.category_name || '未分类'}</TableCell>
                        <TableCell className="text-right">{shop.total_quantity}</TableCell>
                        <TableCell className="text-right">
                              {shop.percentage !== undefined ? `${formatNumber(shop.percentage)}%` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                              {shop.daily_average !== undefined ? formatNumber(shop.daily_average) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                              {shop.mom_change_rate !== undefined ? (
                                    <span className={shop.mom_change_type === 'increase' ? 'text-green-600' : shop.mom_change_type === 'decrease' ? 'text-red-600' : ''}>
                                          {shop.mom_change_type === 'increase' ? '+' : shop.mom_change_type === 'decrease' ? '-' : ''}
                                          {formatNumber(Math.abs(shop.mom_change_rate))}%
                                    </span>
                              ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                              {shop.yoy_change_rate !== undefined ? (
                                    <span className={shop.yoy_change_type === 'increase' ? 'text-green-600' : shop.yoy_change_type === 'decrease' ? 'text-red-600' : ''}>
                                          {shop.yoy_change_type === 'increase' ? '+' : shop.yoy_change_type === 'decrease' ? '-' : ''}
                                          {formatNumber(Math.abs(shop.yoy_change_rate))}%
                                    </span>
                              ) : '-'}
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

                  <div className="overflow-hidden border rounded-md">
                        <Table>
                              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                    <TableRow>
                                          <TableHead className="w-10"></TableHead>
                                          <TableHead className="cursor-pointer" onClick={() => handleSort('shop_name')}>
                                                <div className="flex items-center">
                                                      {t('店铺名称')}
                                                      {renderSortIcon('shop_name')}
                                                </div>
                                          </TableHead>
                                          <TableHead className="cursor-pointer" onClick={() => handleSort('category_name')}>
                                                <div className="flex items-center">
                                                      {t('所属类别')}
                                                      {renderSortIcon('category_name')}
                                                </div>
                                          </TableHead>
                                          <TableHead className="text-right cursor-pointer" onClick={() => handleSort('total_quantity')}>
                                                <div className="flex items-center justify-end">
                                                      {t('总出力量')}
                                                      {renderSortIcon('total_quantity')}
                                                </div>
                                          </TableHead>
                                          <TableHead className="text-right cursor-pointer" onClick={() => handleSort('percentage')}>
                                                <div className="flex items-center justify-end">
                                                      {t('占比')}
                                                      {renderSortIcon('percentage')}
                                                </div>
                                          </TableHead>
                                          <TableHead className="text-right cursor-pointer" onClick={() => handleSort('daily_average')}>
                                                <div className="flex items-center justify-end">
                                                      {t('日均量')}
                                                      {renderSortIcon('daily_average')}
                                                </div>
                                          </TableHead>
                                          <TableHead className="text-right">
                                                <TooltipProvider>
                                                      <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                  <span>{t('环比')}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                  <p>{t('与上一个月相比')}</p>
                                                            </TooltipContent>
                                                      </Tooltip>
                                                </TooltipProvider>
                                          </TableHead>
                                          <TableHead className="text-right">
                                                <TooltipProvider>
                                                      <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                  <span>{t('同比')}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                  <p>{t('与去年同期相比')}</p>
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
                                    className="overflow-auto"
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
                              <div className="overflow-x-auto">
                                    <Table>
                                          <TableBody>
                                                {paginatedRows.map((rowData) => renderTableRow(rowData))}
                                          </TableBody>
                                    </Table>
                              </div>
                        )}
                  </div>

                  {!enableVirtualization && totalPages > 1 && (
                        <div className="flex items-center justify-between">
                              <div>
                                    共 {data.length} 家店铺，{totalPages} 页
                              </div>
                              <div className="flex space-x-2">
                                    <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                          disabled={currentPage === 1}
                                    >
                                          上一页
                                    </Button>
                                    <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                          disabled={currentPage === totalPages}
                                    >
                                          下一页
                                    </Button>
                              </div>
                        </div>
                  )}

                  <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                              {enableVirtualization ?
                                    `虚拟滚动模式 - 共 ${data.length} 条记录` :
                                    `分页模式 - 第 ${currentPage} 页，共 ${totalPages} 页`
                              }
                        </div>
                        <Button variant="outline" size="sm" className="flex items-center">
                              <Download className="h-4 w-4 mr-2" />
                              {t('导出数据')}
                        </Button>
                  </div>
            </div>
      );
};

export default ShopStatsTable; 