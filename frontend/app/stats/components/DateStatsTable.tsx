import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus, Calendar, Users, Package } from 'lucide-react';
import { DateStatsItem } from '@/lib/types/stats';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DateStatsTableProps {
      data: DateStatsItem[];
      isLoading?: boolean;
      onDateClick?: (date: string) => void;
      groupBy?: 'day' | 'week' | 'month' | 'year';
}

type SortField = 'date' | 'total_quantity' | 'percentage' | 'shops_count' | 'mom_change_rate' | 'yoy_change_rate';
type SortDirection = 'asc' | 'desc';

const DateStatsTable: React.FC<DateStatsTableProps> = ({
      data,
      isLoading = false,
      onDateClick,
      groupBy = 'day'
}) => {
      const { t } = useTranslation('stats');
      const [sortField, setSortField] = useState<SortField>('date');
      const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
      const [currentPage, setCurrentPage] = useState(1);
      const itemsPerPage = 20;

      // 排序数据
      const sortedData = useMemo(() => {
            if (!data || data.length === 0) return [];

            return [...data].sort((a, b) => {
                  let aValue: any = a[sortField];
                  let bValue: any = b[sortField];

                  // 处理日期排序
                  if (sortField === 'date') {
                        aValue = new Date(aValue).getTime();
                        bValue = new Date(bValue).getTime();
                  }

                  // 处理数字排序
                  if (typeof aValue === 'number' && typeof bValue === 'number') {
                        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
                  }

                  // 处理字符串排序
                  const aStr = String(aValue || '');
                  const bStr = String(bValue || '');

                  if (sortDirection === 'asc') {
                        return aStr.localeCompare(bStr);
                  } else {
                        return bStr.localeCompare(aStr);
                  }
            });
      }, [data, sortField, sortDirection]);

      // 分页数据
      const paginatedData = useMemo(() => {
            const startIndex = (currentPage - 1) * itemsPerPage;
            return sortedData.slice(startIndex, startIndex + itemsPerPage);
      }, [sortedData, currentPage]);

      const totalPages = Math.ceil(sortedData.length / itemsPerPage);

      // 处理排序
      const handleSort = (field: SortField) => {
            if (sortField === field) {
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
                  setSortField(field);
                  setSortDirection('desc');
            }
            setCurrentPage(1);
      };

      // 获取排序图标
      const getSortIcon = (field: SortField) => {
            if (sortField !== field) {
                  return <ArrowUpDown className="h-4 w-4" />;
            }
            return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
      };

      // 格式化日期显示
      const formatDate = (dateStr: string) => {
            try {
                  if (groupBy === 'week') {
                        const [year, week] = dateStr.split('-');
                        return `${year}年第${week}周`;
                  } else if (groupBy === 'month') {
                        const [year, month] = dateStr.split('-');
                        return `${year}年${month}月`;
                  } else if (groupBy === 'year') {
                        return `${dateStr}年`;
                  } else {
                        // day
                        const date = parseISO(dateStr);
                        return format(date, 'yyyy年MM月dd日', { locale: zhCN });
                  }
            } catch (error) {
                  return dateStr;
            }
      };

      // 渲染变化率徽章
      const renderChangeRate = (rate?: number, type?: 'increase' | 'decrease' | 'unchanged') => {
            if (rate === undefined || rate === null || type === 'unchanged') {
                  return (
                        <Badge variant="secondary" className="flex items-center gap-1">
                              <Minus className="h-3 w-3" />
                              0%
                        </Badge>
                  );
            }

            const isPositive = type === 'increase';
            return (
                  <Badge
                        variant={isPositive ? "default" : "destructive"}
                        className={`flex items-center gap-1 ${isPositive ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}`}
                  >
                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(rate).toFixed(1)}%
                  </Badge>
            );
      };

      if (isLoading) {
            return (
                  <Card>
                        <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    按日期统计
                              </CardTitle>
                        </CardHeader>
                        <CardContent>
                              <div className="flex justify-center items-center h-40">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              </div>
                        </CardContent>
                  </Card>
            );
      }

      if (!data || data.length === 0) {
            return (
                  <Card>
                        <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    按日期统计
                              </CardTitle>
                        </CardHeader>
                        <CardContent>
                              <div className="text-center py-8 text-muted-foreground">
                                    暂无数据
                              </div>
                        </CardContent>
                  </Card>
            );
      }

      return (
            <Card>
                  <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              按日期统计 ({sortedData.length} 条记录)
                        </CardTitle>
                  </CardHeader>
                  <CardContent>
                        <div className="rounded-md border">
                              <Table>
                                    <TableHeader>
                                          <TableRow>
                                                <TableHead>
                                                      <Button
                                                            variant="ghost"
                                                            onClick={() => handleSort('date')}
                                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                                      >
                                                            日期
                                                            {getSortIcon('date')}
                                                      </Button>
                                                </TableHead>
                                                <TableHead className="text-right">
                                                      <Button
                                                            variant="ghost"
                                                            onClick={() => handleSort('total_quantity')}
                                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                                      >
                                                            总出力量
                                                            {getSortIcon('total_quantity')}
                                                      </Button>
                                                </TableHead>
                                                <TableHead className="text-right">
                                                      <Button
                                                            variant="ghost"
                                                            onClick={() => handleSort('percentage')}
                                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                                      >
                                                            占比
                                                            {getSortIcon('percentage')}
                                                      </Button>
                                                </TableHead>
                                                <TableHead className="text-center">
                                                      <Button
                                                            variant="ghost"
                                                            onClick={() => handleSort('shops_count')}
                                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                                      >
                                                            活跃店铺
                                                            {getSortIcon('shops_count')}
                                                      </Button>
                                                </TableHead>
                                                <TableHead className="text-center">
                                                      <Button
                                                            variant="ghost"
                                                            onClick={() => handleSort('mom_change_rate')}
                                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                                      >
                                                            环比变化
                                                            {getSortIcon('mom_change_rate')}
                                                      </Button>
                                                </TableHead>
                                                <TableHead className="text-center">
                                                      <Button
                                                            variant="ghost"
                                                            onClick={() => handleSort('yoy_change_rate')}
                                                            className="h-auto p-0 font-semibold hover:bg-transparent"
                                                      >
                                                            同比变化
                                                            {getSortIcon('yoy_change_rate')}
                                                      </Button>
                                                </TableHead>
                                                <TableHead className="text-center">操作</TableHead>
                                          </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                          {paginatedData.map((item, index) => (
                                                <TableRow key={item.date} className="hover:bg-muted/50">
                                                      <TableCell className="font-medium">
                                                            {formatDate(item.date)}
                                                      </TableCell>
                                                      <TableCell className="text-right font-mono">
                                                            {item.total_quantity.toLocaleString()}
                                                      </TableCell>
                                                      <TableCell className="text-right">
                                                            {item.percentage ? `${item.percentage.toFixed(1)}%` : '-'}
                                                      </TableCell>
                                                      <TableCell className="text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                  <Users className="h-4 w-4 text-muted-foreground" />
                                                                  {item.shops_count || 0}
                                                            </div>
                                                      </TableCell>
                                                      <TableCell className="text-center">
                                                            {renderChangeRate(item.mom_change_rate, item.mom_change_type)}
                                                      </TableCell>
                                                      <TableCell className="text-center">
                                                            {renderChangeRate(item.yoy_change_rate, item.yoy_change_type)}
                                                      </TableCell>
                                                      <TableCell className="text-center">
                                                            {onDateClick && (
                                                                  <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => onDateClick(item.date)}
                                                                        className="h-8 px-2"
                                                                  >
                                                                        查看详情
                                                                  </Button>
                                                            )}
                                                      </TableCell>
                                                </TableRow>
                                          ))}
                                    </TableBody>
                              </Table>
                        </div>

                        {/* 分页控件 */}
                        {totalPages > 1 && (
                              <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                          显示第 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} 条，
                                          共 {sortedData.length} 条记录
                                    </div>
                                    <div className="flex items-center gap-2">
                                          <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                          >
                                                上一页
                                          </Button>
                                          <div className="flex items-center gap-1">
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                      let pageNum;
                                                      if (totalPages <= 5) {
                                                            pageNum = i + 1;
                                                      } else if (currentPage <= 3) {
                                                            pageNum = i + 1;
                                                      } else if (currentPage >= totalPages - 2) {
                                                            pageNum = totalPages - 4 + i;
                                                      } else {
                                                            pageNum = currentPage - 2 + i;
                                                      }

                                                      return (
                                                            <Button
                                                                  key={pageNum}
                                                                  variant={currentPage === pageNum ? "default" : "outline"}
                                                                  size="sm"
                                                                  onClick={() => setCurrentPage(pageNum)}
                                                                  className="w-8 h-8 p-0"
                                                            >
                                                                  {pageNum}
                                                            </Button>
                                                      );
                                                })}
                                          </div>
                                          <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                          >
                                                下一页
                                          </Button>
                                    </div>
                              </div>
                        )}
                  </CardContent>
            </Card>
      );
};

export default DateStatsTable; 