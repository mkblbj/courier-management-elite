import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CategoryStatsItem } from '@/lib/types/stats';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

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
      const [processedData, setProcessedData] = useState<CategoryStatsExtended[]>([]);

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
                  setProcessedData(processed);
            } else {
                  setProcessedData([]);
            }
      }, [data]);

      const handleCategoryClick = (categoryId: number) => {
            // 导航到类别详情页面
            router.push(`/stats/category/${categoryId}`);
      };

      // 处理变化率显示的辅助函数
      const renderChangeRate = (changeRate?: number, changeType?: 'increase' | 'decrease' | 'unchanged') => {
            if (changeRate === undefined) return null;

            const absoluteRate = Math.abs(changeRate);
            const formattedRate = `${absoluteRate.toFixed(2)}%`;

            // 如果未提供变化类型，根据变化率判断
            if (!changeType) {
                  changeType = changeRate > 0 ? 'increase' : changeRate < 0 ? 'decrease' : 'unchanged';
            }

            switch (changeType) {
                  case 'increase':
                        return (
                              <div className="flex items-center text-green-600">
                                    <ArrowUp className="h-4 w-4 mr-1" />
                                    {formattedRate}
                              </div>
                        );
                  case 'decrease':
                        return (
                              <div className="flex items-center text-red-600">
                                    <ArrowDown className="h-4 w-4 mr-1" />
                                    {formattedRate}
                              </div>
                        );
                  case 'unchanged':
                        return (
                              <div className="flex items-center text-gray-500">
                                    <ArrowRight className="h-4 w-4 mr-1" />
                                    {formattedRate}
                              </div>
                        );
                  default:
                        return formattedRate;
            }
      };

      return (
            <div className="border rounded-md">
                  <Table>
                        <TableHeader>
                              <TableRow>
                                    <TableHead className="w-[200px]">类别名称</TableHead>
                                    <TableHead className="text-right">总出力量</TableHead>
                                    <TableHead className="text-right">占总体出力的百分比</TableHead>
                                    <TableHead className="text-right">类别内店铺数量</TableHead>
                                    <TableHead className="text-right">日均出力量</TableHead>
                                    <TableHead className="text-right">同比/环比变化</TableHead>
                              </TableRow>
                        </TableHeader>
                        <TableBody>
                              {processedData.length === 0 ? (
                                    <TableRow>
                                          <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                {isLoading ? '加载中...' : '暂无数据'}
                                          </TableCell>
                                    </TableRow>
                              ) : (
                                    processedData.map((category) => (
                                          <TableRow key={category.category_id}>
                                                <TableCell>
                                                      <button
                                                            onClick={() => handleCategoryClick(category.category_id)}
                                                            className="text-primary hover:underline focus:outline-none"
                                                      >
                                                            {category.category_name}
                                                      </button>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                      {typeof category.total_quantity === 'number'
                                                            ? category.total_quantity.toLocaleString()
                                                            : category.total_quantity}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                      {category.percentage !== undefined
                                                            ? `${category.percentage.toFixed(2)}%`
                                                            : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">{category.shops_count}</TableCell>
                                                <TableCell className="text-right">
                                                      {category.daily_average !== undefined
                                                            ? category.daily_average.toFixed(2)
                                                            : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                      {renderChangeRate(category.change_rate, category.change_type)}
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