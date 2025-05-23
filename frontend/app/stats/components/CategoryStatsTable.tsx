import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CategoryStatsItem } from '@/lib/types/stats';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, ArrowRight, ChevronDown, ChevronUp, Download, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useTranslation } from "react-i18next";
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// 定义排序类型
type SortDirection = 'asc' | 'desc' | null;
type SortField = 'category_name' | 'total_quantity' | 'percentage' | 'shops_count' | 'daily_average' | 'change_rate' | null;

interface CategoryStatsTableProps {
      data: CategoryStatsItem[];
      isLoading?: boolean;
}

// 扩展API返回的类型，增加days_count字段
interface CategoryStatsExtended extends CategoryStatsItem {
      days_count?: number;
      percentage?: number;
      daily_average?: number;
}

const CategoryStatsTable: React.FC<CategoryStatsTableProps> = ({ data, isLoading = false }) => {
      const router = useRouter();
      const { t } = useTranslation('stats'); // 使用'stats'命名空间
      const [processedData, setProcessedData] = useState<CategoryStatsExtended[]>([]);
      const [originalData, setOriginalData] = useState<CategoryStatsExtended[]>([]);
      // 新增：排序状态
      const [sortField, setSortField] = useState<SortField>('total_quantity');
      const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

      // 处理和计算数据
      useEffect(() => {
            if (data && data.length > 0) {
                  console.log('原始表格数据:', data);
                  // 计算总量
                  const totalQuantity = data.reduce((sum, item) => {
                        const quantity = typeof item.total_quantity === 'string'
                              ? parseFloat(item.total_quantity)
                              : Number(item.total_quantity);
                        return sum + (isNaN(quantity) ? 0 : quantity);
                  }, 0);

                  // 处理数据
                  const processed = data.map(item => {
                        // 转换为扩展类型
                        const extendedItem = item as CategoryStatsExtended;

                        const quantity = typeof item.total_quantity === 'string'
                              ? parseFloat(item.total_quantity)
                              : Number(item.total_quantity);

                        // 计算占比
                        const percentage = totalQuantity > 0
                              ? (quantity / totalQuantity) * 100
                              : 0;

                        // 计算日均量（如果有天数数据）
                        const dailyAverage = extendedItem.days_count && extendedItem.days_count > 0
                              ? quantity / extendedItem.days_count
                              : undefined;

                        return {
                              ...extendedItem,
                              total_quantity: quantity,
                              percentage: percentage,
                              daily_average: dailyAverage
                        };
                  });

                  console.log('处理后的表格数据:', processed);
                  setOriginalData(processed);
                  setProcessedData(processed);
            } else {
                  setOriginalData([]);
                  setProcessedData([]);
            }
      }, [data]);

      // 新增：排序数据的函数
      const sortData = (field: SortField, direction: SortDirection) => {
            if (!field || !direction || originalData.length === 0) {
                  return [...originalData];
            }

            return [...originalData].sort((a, b) => {
                  if (field === 'category_name') {
                        if (!a.category_name) return direction === 'asc' ? -1 : 1;
                        if (!b.category_name) return direction === 'asc' ? 1 : -1;
                        return direction === 'asc'
                              ? a.category_name.localeCompare(b.category_name)
                              : b.category_name.localeCompare(a.category_name);
                  }

                  if (field === 'total_quantity') {
                        const valueA = a.total_quantity || 0;
                        const valueB = b.total_quantity || 0;
                        return direction === 'asc' ? valueA - valueB : valueB - valueA;
                  }

                  if (field === 'percentage') {
                        const valueA = a.percentage || 0;
                        const valueB = b.percentage || 0;
                        return direction === 'asc' ? valueA - valueB : valueB - valueA;
                  }

                  if (field === 'shops_count') {
                        const valueA = a.shops_count || 0;
                        const valueB = b.shops_count || 0;
                        return direction === 'asc' ? valueA - valueB : valueB - valueA;
                  }

                  if (field === 'daily_average') {
                        const valueA = a.daily_average || 0;
                        const valueB = b.daily_average || 0;
                        return direction === 'asc' ? valueA - valueB : valueB - valueA;
                  }

                  if (field === 'change_rate') {
                        const valueA = a.yoy_change_rate || 0;
                        const valueB = b.yoy_change_rate || 0;
                        return direction === 'asc' ? valueA - valueB : valueB - valueA;
                  }

                  return 0;
            });
      };

      // 使用Effect应用排序状态变化
      useEffect(() => {
            const sorted = sortData(sortField, sortDirection);
            setProcessedData(sorted);
      }, [sortField, sortDirection, originalData]);

      // 新增：处理排序请求
      const handleSort = (field: SortField) => {
            // 如果点击的是当前排序字段，则切换排序方向或重置
            if (field === sortField) {
                  if (sortDirection === 'asc') {
                        setSortDirection('desc');
                  } else if (sortDirection === 'desc') {
                        setSortField(null);
                        setSortDirection(null);
                  } else {
                        setSortDirection('asc');
                  }
            } else {
                  // 如果点击的是新字段，则设置为升序
                  setSortField(field);
                  setSortDirection('asc');
            }
      };

      // 新增：渲染排序图标
      const renderSortIcon = (field: SortField) => {
            if (sortField !== field) {
                  return null;
            }

            return sortDirection === 'asc'
                  ? <ArrowUp className="ml-1 h-4 w-4 text-blue-600" />
                  : <ArrowDown className="ml-1 h-4 w-4 text-blue-600" />;
      };

      const handleCategoryClick = (categoryId: number) => {
            // 导航到类别详情页面
            router.push(`/stats/category/${categoryId}`);
      };

      const formatNumber = (value: number) => {
            return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };

      const formatQuantity = (value: number) => {
            return value.toLocaleString('zh-CN');
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
      const renderCombinedChangeRate = (category: CategoryStatsExtended) => {
            // 获取同比和环比的值
            const yoyRate = category.yoy_change_rate;
            const yoyType = category.yoy_change_type;
            const momRate = category.mom_change_rate;
            const momType = category.mom_change_type;

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

      if (isLoading) {
            return (
                  <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
            );
      }

      if (data.length === 0) {
            return (
                  <div className="text-center py-8 text-muted-foreground">
                        暂无类别统计数据
                  </div>
            );
      }

      return (
            <div className="space-y-4">
                  <div className="overflow-hidden border rounded-lg shadow-sm bg-white">
                        <Table>
                              <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-50 sticky top-0 z-10 border-b-2 border-slate-200">
                                    <TableRow>
                                          <TableHead className="cursor-pointer min-w-[120px] font-semibold text-slate-700" onClick={() => handleSort('category_name')}>
                                                <div className="flex items-center hover:text-blue-600 transition-colors">
                                                      {t('category_name')}
                                                      {renderSortIcon('category_name')}
                                                </div>
                                          </TableHead>
                                          <TableHead className="text-right cursor-pointer min-w-[100px] font-semibold text-slate-700" onClick={() => handleSort('total_quantity')}>
                                                <div className="flex items-center justify-end hover:text-blue-600 transition-colors">
                                                      {t('total_output')}
                                                      {renderSortIcon('total_quantity')}
                                                </div>
                                          </TableHead>
                                          <TableHead className="text-right cursor-pointer min-w-[80px] font-semibold text-slate-700" onClick={() => handleSort('percentage')}>
                                                <div className="flex items-center justify-end hover:text-blue-600 transition-colors">
                                                      {t('percentage_of_total')}
                                                      {renderSortIcon('percentage')}
                                                </div>
                                          </TableHead>
                                          <TableHead className="text-right cursor-pointer min-w-[80px] font-semibold text-slate-700" onClick={() => handleSort('shops_count')}>
                                                <div className="flex items-center justify-end hover:text-blue-600 transition-colors">
                                                      {t('shops_count')}
                                                      {renderSortIcon('shops_count')}
                                                </div>
                                          </TableHead>
                                          <TableHead className="text-right cursor-pointer min-w-[80px] font-semibold text-slate-700" onClick={() => handleSort('daily_average')}>
                                                <div className="flex items-center justify-end hover:text-blue-600 transition-colors">
                                                      {t('daily_average')}
                                                      {renderSortIcon('daily_average')}
                                                </div>
                                          </TableHead>
                                          <TableHead className="text-center min-w-[140px] font-semibold text-slate-700">
                                                <TooltipProvider>
                                                      <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                  <div className="flex items-center justify-center gap-1 hover:text-blue-600 transition-colors cursor-help">
                                                                        <span>{t('yoy_mom_change')}</span>
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
                              <TableBody>
                                    {processedData.length === 0 ? (
                                          <TableRow>
                                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                      {isLoading ? t('loading') : t('no_data')}
                                                </TableCell>
                                          </TableRow>
                                    ) : (
                                          processedData.map((category, index) => (
                                                <TableRow
                                                      key={category.category_id}
                                                      className="hover:bg-slate-50/50 transition-colors border-b border-slate-100"
                                                >
                                                      <TableCell className="font-semibold text-slate-800 min-w-[120px]">
                                                            <button
                                                                  onClick={() => handleCategoryClick(category.category_id)}
                                                                  className="text-primary font-medium hover:underline focus:outline-none flex items-center hover:text-blue-600 transition-colors"
                                                            >
                                                                  {category.category_name}
                                                            </button>
                                                      </TableCell>
                                                      <TableCell className="text-right font-mono font-semibold text-slate-800 min-w-[100px]">
                                                            {typeof category.total_quantity === 'number'
                                                                  ? formatQuantity(category.total_quantity)
                                                                  : category.total_quantity}
                                                      </TableCell>
                                                      <TableCell className="text-right font-mono text-slate-700 min-w-[80px]">
                                                            {category.percentage !== undefined ? (
                                                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                                                                        {formatNumber(category.percentage)}%
                                                                  </span>
                                                            ) : (
                                                                  <span className="text-slate-400">-</span>
                                                            )}
                                                      </TableCell>
                                                      <TableCell className="text-right min-w-[80px]">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                                  {category.shops_count}
                                                            </span>
                                                      </TableCell>
                                                      <TableCell className="text-right font-mono text-slate-700 min-w-[80px]">
                                                            {category.daily_average !== undefined ? (
                                                                  <span className="font-semibold">{formatNumber(category.daily_average)}</span>
                                                            ) : (
                                                                  <span className="text-slate-400">-</span>
                                                            )}
                                                      </TableCell>
                                                      <TableCell className="text-center min-w-[140px] p-2">
                                                            <div className="flex justify-center">
                                                                  {renderCombinedChangeRate(category)}
                                                            </div>
                                                      </TableCell>
                                                </TableRow>
                                          ))
                                    )}
                              </TableBody>
                        </Table>
                  </div>

                  <div className="flex justify-between items-center bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
                        <div className="text-sm text-slate-600">
                              共 <span className="font-semibold text-slate-800">{data.length}</span> 个类别
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

export default CategoryStatsTable;