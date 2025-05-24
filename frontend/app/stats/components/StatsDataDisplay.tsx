import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import type { StatsDimension } from './ShopOutputStats';
import CategoryStatsTable from './CategoryStatsTable';
import CategoryStatsChart from './CategoryStatsChart';
import DateStatsTable from './DateStatsTable';
import DateStatsChart from './DateStatsChart';
import DateDetailModal from './DateDetailModal';
import { CategoryStatsItem, DateStatsItem } from '@/lib/types/stats';
import { useTranslation } from 'react-i18next';

interface StatsDataDisplayProps {
      isLoading: boolean;
      selectedDimension: StatsDimension;
      categoryData?: CategoryStatsItem[];
      dateData?: DateStatsItem[];
      groupBy?: 'day' | 'week' | 'month' | 'year';
      onDateClick?: (date: string) => void;
}

const StatsDataDisplay: React.FC<StatsDataDisplayProps> = ({
      isLoading,
      selectedDimension,
      categoryData = [],
      dateData = [],
      groupBy = 'day',
      onDateClick
}) => {
      const { t } = useTranslation('stats');
      const [selectedDate, setSelectedDate] = useState<string | null>(null);
      const [isModalOpen, setIsModalOpen] = useState(false);

      const handleDateClick = (date: string) => {
            setSelectedDate(date);
            setIsModalOpen(true);
            onDateClick?.(date);
      };

      const selectedDateData = selectedDate ? dateData.find(item => item.date === selectedDate) : null; // 使用'stats'命名空间
      const getChartPlaceholder = () => {
            switch (selectedDimension) {
                  case 'category':
                        return categoryData && categoryData.length > 0 ? null : '类别分布图表区域';
                  case 'shop':
                        return '店铺分布饼图（将在后续故事中实现）';
                  case 'courier':
                        return '快递类型分布折线图（将在后续故事中实现）';
                  case 'date':
                        return dateData && dateData.length > 0 ? null : '日期趋势图表区域';
                  default:
                        return '图表区域（将在后续故事中实现）';
            }
      };

      return (
            <div className="space-y-4">
                  {/* 图表区域 */}
                  <Card>
                        <CardHeader>
                              <CardTitle className="text-lg">{t('数据图表')}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                              {isLoading ? (
                                    <div className="flex justify-center items-center h-60">
                                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                              ) : (
                                    <>
                                          {selectedDimension === 'category' && categoryData.length > 0 && (
                                                <CategoryStatsChart data={categoryData} />
                                          )}
                                          {selectedDimension === 'date' && dateData.length > 0 && (
                                                <DateStatsChart
                                                      data={dateData}
                                                      isLoading={isLoading}
                                                      groupBy={groupBy}
                                                />
                                          )}
                                          {getChartPlaceholder() && (
                                                <div className="h-60 w-full flex items-center justify-center bg-muted/20 rounded-md">
                                                      <p className="text-muted-foreground">{getChartPlaceholder()}</p>
                                                </div>
                                          )}
                                    </>
                              )}
                        </CardContent>
                  </Card>

                  {/* 数据表格 */}
                  <Card>
                        <CardHeader>
                              <CardTitle className="text-lg">{t('数据表格')}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                              {isLoading ? (
                                    <div className="flex justify-center items-center h-40">
                                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                              ) : (
                                    <>
                                          {selectedDimension === 'category' && categoryData.length > 0 && (
                                                <CategoryStatsTable data={categoryData} />
                                          )}
                                          {selectedDimension === 'date' && dateData.length > 0 && (
                                                <DateStatsTable
                                                      data={dateData}
                                                      isLoading={isLoading}
                                                      onDateClick={onDateClick}
                                                      groupBy={groupBy}
                                                />
                                          )}
                                          {/* 占位表格 - 当没有数据或维度不支持时显示 */}
                                          {((selectedDimension === 'category' && categoryData.length === 0) ||
                                                (selectedDimension === 'date' && dateData.length === 0) ||
                                                (selectedDimension !== 'category' && selectedDimension !== 'date')) && (
                                                      <div className="border rounded-md">
                                                            <Table>
                                                                  <TableHeader>
                                                                        {selectedDimension === 'category' && (
                                                                              <TableRow>
                                                                                    <TableHead>类别名称</TableHead>
                                                                                    <TableHead className="text-right">总量</TableHead>
                                                                                    <TableHead className="text-right">占比</TableHead>
                                                                                    <TableHead className="text-right">日均量</TableHead>
                                                                              </TableRow>
                                                                        )}

                                                                        {selectedDimension === 'shop' && (
                                                                              <TableRow>
                                                                                    <TableHead>店铺名称</TableHead>
                                                                                    <TableHead>所属类别</TableHead>
                                                                                    <TableHead className="text-right">总量</TableHead>
                                                                                    <TableHead className="text-right">占比</TableHead>
                                                                                    <TableHead className="text-right">日均量</TableHead>
                                                                              </TableRow>
                                                                        )}

                                                                        {selectedDimension === 'courier' && (
                                                                              <TableRow>
                                                                                    <TableHead>快递类型</TableHead>
                                                                                    <TableHead className="text-right">总量</TableHead>
                                                                                    <TableHead className="text-right">占比</TableHead>
                                                                                    <TableHead className="text-right">日均量</TableHead>
                                                                              </TableRow>
                                                                        )}

                                                                        {selectedDimension === 'date' && (
                                                                              <TableRow>
                                                                                    <TableHead>日期</TableHead>
                                                                                    <TableHead className="text-right">总量</TableHead>
                                                                                    <TableHead className="text-right">占比</TableHead>
                                                                                    <TableHead className="text-center">活跃店铺</TableHead>
                                                                                    <TableHead className="text-center">环比变化</TableHead>
                                                                                    <TableHead className="text-center">同比变化</TableHead>
                                                                              </TableRow>
                                                                        )}
                                                                  </TableHeader>
                                                                  <TableBody>
                                                                        {/* 占位数据行 */}
                                                                        {[1, 2, 3].map((idx) => (
                                                                              <TableRow key={idx}>
                                                                                    {selectedDimension === 'category' && (
                                                                                          <>
                                                                                                <TableCell>示例类别 {idx}</TableCell>
                                                                                                <TableCell className="text-right">{idx * 100}</TableCell>
                                                                                                <TableCell className="text-right">{idx * 10}%</TableCell>
                                                                                                <TableCell className="text-right">{idx * 20}</TableCell>
                                                                                          </>
                                                                                    )}

                                                                                    {selectedDimension === 'shop' && (
                                                                                          <>
                                                                                                <TableCell>示例店铺 {idx}</TableCell>
                                                                                                <TableCell>示例类别 {idx}</TableCell>
                                                                                                <TableCell className="text-right">{idx * 100}</TableCell>
                                                                                                <TableCell className="text-right">{idx * 10}%</TableCell>
                                                                                                <TableCell className="text-right">{idx * 20}</TableCell>
                                                                                          </>
                                                                                    )}

                                                                                    {selectedDimension === 'courier' && (
                                                                                          <>
                                                                                                <TableCell>示例快递 {idx}</TableCell>
                                                                                                <TableCell className="text-right">{idx * 100}</TableCell>
                                                                                                <TableCell className="text-right">{idx * 10}%</TableCell>
                                                                                                <TableCell className="text-right">{idx * 20}</TableCell>
                                                                                          </>
                                                                                    )}

                                                                                    {selectedDimension === 'date' && (
                                                                                          <>
                                                                                                <TableCell>2023-06-{idx.toString().padStart(2, '0')}</TableCell>
                                                                                                <TableCell className="text-right">{idx * 100}</TableCell>
                                                                                                <TableCell className="text-right">{idx * 10}%</TableCell>
                                                                                                <TableCell className="text-center">{idx * 5}</TableCell>
                                                                                                <TableCell className="text-center">+{idx * 2}%</TableCell>
                                                                                                <TableCell className="text-center">+{idx * 3}%</TableCell>
                                                                                          </>
                                                                                    )}
                                                                              </TableRow>
                                                                        ))}
                                                                  </TableBody>
                                                            </Table>
                                                      </div>
                                                )}
                                    </>
                              )}
                        </CardContent>
                  </Card>

                  {/* 日期详情模态框 */}
                  {selectedDimension === 'date' && (
                        <DateDetailModal
                              isOpen={isModalOpen}
                              onClose={() => setIsModalOpen(false)}
                              date={selectedDate || ''}
                              groupBy={groupBy}
                              data={selectedDateData}
                        />
                  )}
            </div>
      );
};

export default StatsDataDisplay; 