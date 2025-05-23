import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CategoryStatsItem } from '@/lib/types/stats';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useTranslation } from "react-i18next";
import { Button } from '@/components/ui/button';

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
      const [sortField, setSortField] = useState<SortField>(null);
      const [sortDirection, setSortDirection] = useState<SortDirection>(null);

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
                  return <ChevronUp className="h-4 w-4 opacity-0 group-hover:opacity-50" />;
            }

            return sortDirection === 'asc'
                  ? <ChevronUp className="h-4 w-4 text-primary" />
                  : <ChevronDown className="h-4 w-4 text-primary" />;
      };

      const handleCategoryClick = (categoryId: number) => {
            // 导航到类别详情页面
            router.push(`/stats/category/${categoryId}`);
      };

      // 处理变化率显示的辅助函数
      const renderChangeRate = (changeRate?: number, changeType?: 'increase' | 'decrease' | 'unchanged') => {
            if (changeRate === undefined) return null;

            // 确保changeRate是数字
            const numericRate = typeof changeRate === 'string' ? parseFloat(changeRate) : changeRate;
            if (isNaN(numericRate)) return null;

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
                              <div className="flex items-center text-green-600 whitespace-nowrap">
                                    <ArrowUp className="h-4 w-4 mr-1 flex-shrink-0" />
                                    {formattedRate}
                              </div>
                        );
                  case 'decrease':
                        return (
                              <div className="flex items-center text-red-600 whitespace-nowrap">
                                    <ArrowDown className="h-4 w-4 mr-1 flex-shrink-0" />
                                    {formattedRate}
                              </div>
                        );
                  case 'unchanged':
                        return (
                              <div className="flex items-center text-gray-500 whitespace-nowrap">
                                    <ArrowRight className="h-4 w-4 mr-1 flex-shrink-0" />
                                    {formattedRate}
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
            if (yoyElement && momElement) {
                  return (
                        <div className="bg-slate-50 rounded-md px-3 py-2 inline-flex items-center gap-2 justify-end">
                              {yoyElement}
                              <span className="text-slate-400">/</span>
                              {momElement}
                        </div>
                  );
            } else if (yoyElement) {
                  return (
                        <div className="bg-slate-50 rounded-md px-3 py-2 inline-flex items-center justify-end">
                              {yoyElement}
                        </div>
                  );
            } else if (momElement) {
                  return (
                        <div className="bg-slate-50 rounded-md px-3 py-2 inline-flex items-center justify-end">
                              {momElement}
                        </div>
                  );
            }

            return null;
      };

      return (
            <div className="border rounded-md shadow-sm overflow-hidden">
                  <Table>
                        <TableHeader>
                              <TableRow className="bg-muted/50">
                                    <TableHead className="w-[200px] font-semibold">
                                          <Button
                                                variant="ghost"
                                                className="font-semibold p-0 h-auto hover:bg-transparent group flex items-center gap-1"
                                                onClick={() => handleSort('category_name')}
                                          >
                                                {t('category_name')}
                                                {renderSortIcon('category_name')}
                                          </Button>
                                    </TableHead>
                                    <TableHead className="text-right font-semibold">
                                          <div className="flex justify-end">
                                                <Button
                                                      variant="ghost"
                                                      className="font-semibold p-0 h-auto hover:bg-transparent group flex items-center gap-1"
                                                      onClick={() => handleSort('total_quantity')}
                                                >
                                                      {t('total_output')}
                                                      {renderSortIcon('total_quantity')}
                                                </Button>
                                          </div>
                                    </TableHead>
                                    <TableHead className="text-right font-semibold">
                                          <div className="flex justify-end">
                                                <Button
                                                      variant="ghost"
                                                      className="font-semibold p-0 h-auto hover:bg-transparent group flex items-center gap-1"
                                                      onClick={() => handleSort('percentage')}
                                                >
                                                      {t('percentage_of_total')}
                                                      {renderSortIcon('percentage')}
                                                </Button>
                                          </div>
                                    </TableHead>
                                    <TableHead className="text-right font-semibold">
                                          <div className="flex justify-end">
                                                <Button
                                                      variant="ghost"
                                                      className="font-semibold p-0 h-auto hover:bg-transparent group flex items-center gap-1"
                                                      onClick={() => handleSort('shops_count')}
                                                >
                                                      {t('shops_count')}
                                                      {renderSortIcon('shops_count')}
                                                </Button>
                                          </div>
                                    </TableHead>
                                    <TableHead className="text-right font-semibold">
                                          <div className="flex justify-end">
                                                <Button
                                                      variant="ghost"
                                                      className="font-semibold p-0 h-auto hover:bg-transparent group flex items-center gap-1"
                                                      onClick={() => handleSort('daily_average')}
                                                >
                                                      {t('daily_average')}
                                                      {renderSortIcon('daily_average')}
                                                </Button>
                                          </div>
                                    </TableHead>
                                    <TableHead className="text-center font-semibold">
                                          <div className="flex justify-center">
                                                <Button
                                                      variant="ghost"
                                                      className="font-semibold p-0 h-auto hover:bg-transparent group flex items-center gap-1"
                                                      onClick={() => handleSort('change_rate')}
                                                >
                                                      {t('yoy_mom_change')}
                                                      {renderSortIcon('change_rate')}
                                                </Button>
                                          </div>
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
                                                className={cn(
                                                      "hover:bg-muted/50 transition-colors",
                                                      index % 2 === 0 ? "bg-background" : "bg-muted/20"
                                                )}
                                          >
                                                <TableCell>
                                                      <button
                                                            onClick={() => handleCategoryClick(category.category_id)}
                                                            className="text-primary font-medium hover:underline focus:outline-none flex items-center"
                                                      >
                                                            {category.category_name}
                                                      </button>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                      {typeof category.total_quantity === 'number'
                                                            ? category.total_quantity.toLocaleString('zh-CN')
                                                            : category.total_quantity}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                      {category.percentage !== undefined
                                                            ? `${category.percentage.toFixed(2)}%`
                                                            : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                      <Badge variant="secondary" className="font-normal">
                                                            {category.shops_count}
                                                      </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                      {category.daily_average !== undefined
                                                            ? category.daily_average.toFixed(2)
                                                            : '-'}
                                                </TableCell>
                                                <TableCell className="text-right p-2">
                                                      <div className="flex justify-end">
                                                            {renderCombinedChangeRate(category)}
                                                      </div>
                                                </TableCell>
                                          </TableRow>
                                    ))
                              )}
                        </TableBody>
                  </Table>
            </div>
      );
};

export default CategoryStatsTable; 