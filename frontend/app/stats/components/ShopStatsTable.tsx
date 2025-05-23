import React, { useState } from 'react';
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

interface ShopStatsTableProps {
      data: ShopStatsItem[];
      isLoading?: boolean;
      error?: Error | null;
      onRetry?: () => void;
      groupByCategory?: boolean;
}

type SortField = 'shop_name' | 'category_name' | 'total_quantity' | 'percentage' | 'daily_average';
type SortDirection = 'asc' | 'desc';

const ShopStatsTable: React.FC<ShopStatsTableProps> = ({
      data,
      isLoading = false,
      error = null,
      onRetry,
      groupByCategory = true,
}) => {
      const { t } = useTranslation('stats');
      const [sortField, setSortField] = useState<SortField>('total_quantity');
      const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
      const [expandedShopIds, setExpandedShopIds] = useState<number[]>([]);
      const [currentPage, setCurrentPage] = useState(1);
      const pageSize = 10;

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

      // 对数据进行排序
      const sortedData = [...data].sort((a, b) => {
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

      // 如果按类别分组，首先按类别组织数据
      const groupedData = groupByCategory
            ? sortedData.reduce<Record<string, ShopStatsItem[]>>((groups, item) => {
                  const categoryName = item.category_name || '未分类';
                  if (!groups[categoryName]) {
                        groups[categoryName] = [];
                  }
                  groups[categoryName].push(item);
                  return groups;
            }, {})
            : { '所有店铺': sortedData };

      // 分页逻辑 (只有在不分组的情况下才应用)
      const categories = Object.keys(groupedData);
      const totalPages = groupByCategory
            ? Math.ceil(categories.length / pageSize)
            : Math.ceil(sortedData.length / pageSize);

      const paginatedCategories = groupByCategory
            ? categories.slice((currentPage - 1) * pageSize, currentPage * pageSize)
            : categories;

      const paginatedData = groupByCategory
            ? paginatedCategories.reduce<Record<string, ShopStatsItem[]>>((result, category) => {
                  result[category] = groupedData[category];
                  return result;
            }, {})
            : { '所有店铺': sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize) };

      // 格式化数字，保留两位小数
      const formatNumber = (value: number) => {
            return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };

      // 渲染排序图标
      const renderSortIcon = (field: SortField) => {
            if (field !== sortField) return null;
            return sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />;
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
                  <div className="overflow-x-auto">
                        <Table className="border">
                              <TableHeader className="bg-muted/50">
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
                                          {/* 增加同比环比数据 */}
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
                              <TableBody>
                                    {Object.entries(paginatedData).map(([categoryName, shops]) => (
                                          <React.Fragment key={categoryName}>
                                                {groupByCategory && (
                                                      <TableRow className="bg-muted/30">
                                                            <TableCell colSpan={8} className="font-medium">
                                                                  {categoryName} ({shops.length} 家店铺)
                                                            </TableCell>
                                                      </TableRow>
                                                )}
                                                {shops.map((shop) => (
                                                      <React.Fragment key={shop.shop_id}>
                                                            <TableRow className="hover:bg-muted/50">
                                                                  <TableCell>
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
                                                            {/* 展开的快递类型分布数据 */}
                                                            {expandedShopIds.includes(shop.shop_id) && shop.courier_distribution && (
                                                                  <TableRow className="bg-muted/20">
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
                                                                                                {Object.entries(shop.courier_distribution).map(([courierId, data]) => (
                                                                                                      <TableRow key={courierId}>
                                                                                                            <TableCell>{data.courier_name}</TableCell>
                                                                                                            <TableCell className="text-right">{data.quantity}</TableCell>
                                                                                                            <TableCell className="text-right">{formatNumber(data.percentage)}%</TableCell>
                                                                                                      </TableRow>
                                                                                                ))}
                                                                                          </TableBody>
                                                                                    </Table>
                                                                              </div>
                                                                        </TableCell>
                                                                  </TableRow>
                                                            )}
                                                      </React.Fragment>
                                                ))}
                                          </React.Fragment>
                                    ))}
                              </TableBody>
                        </Table>
                  </div>

                  {/* 分页控制 */}
                  {totalPages > 1 && (
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

                  {/* 数据导出按钮 */}
                  <div className="flex justify-end">
                        <Button variant="outline" size="sm" className="flex items-center">
                              <Download className="h-4 w-4 mr-2" />
                              {t('导出数据')}
                        </Button>
                  </div>
            </div>
      );
};

export default ShopStatsTable; 