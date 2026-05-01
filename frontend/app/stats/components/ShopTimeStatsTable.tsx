import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShopTimeStatsItem } from '@/lib/types/stats';
import { useTranslation } from 'react-i18next';

interface ShopTimeStatsTableProps {
      data: ShopTimeStatsItem[];
      groupBy: 'day' | 'month' | 'year';
}

interface PivotRow {
      shop_id: number;
      shop_name: string;
      category_name: string;
      total: number;
      values: Record<string, number>;
}

const formatPeriod = (period: string, groupBy: 'day' | 'month' | 'year') => {
      if (groupBy === 'year') return `${period}年`;
      if (groupBy === 'month') {
            const [year, month] = period.split('-');
            return `${year}年${month}月`;
      }
      return period;
};

const ShopTimeStatsTable: React.FC<ShopTimeStatsTableProps> = ({ data, groupBy }) => {
      const { t } = useTranslation('stats');

      const { periods, rows } = useMemo(() => {
            const periodList = Array.from(new Set(data.map(item => item.period))).sort();
            const rowMap = new Map<number, PivotRow>();

            data.forEach(item => {
                  if (!rowMap.has(item.shop_id)) {
                        rowMap.set(item.shop_id, {
                              shop_id: item.shop_id,
                              shop_name: item.shop_name,
                              category_name: item.category_name || t('未分类'),
                              total: 0,
                              values: {}
                        });
                  }

                  const row = rowMap.get(item.shop_id)!;
                  row.values[item.period] = (row.values[item.period] || 0) + item.total_quantity;
                  row.total += item.total_quantity;
            });

            return {
                  periods: periodList,
                  rows: Array.from(rowMap.values()).sort((a, b) => b.total - a.total)
            };
      }, [data, t]);

      if (data.length === 0) {
            return <div className="text-center py-8 text-muted-foreground">{t('暂无数据')}</div>;
      }

      return (
            <div className="rounded-md border overflow-x-auto">
                  <Table>
                        <TableHeader>
                              <TableRow>
                                    <TableHead className="min-w-[180px]">{t('店铺')}</TableHead>
                                    <TableHead className="min-w-[140px]">{t('店铺类别')}</TableHead>
                                    {periods.map(period => (
                                          <TableHead key={period} className="text-right min-w-[110px]">
                                                {formatPeriod(period, groupBy)}
                                          </TableHead>
                                    ))}
                                    <TableHead className="text-right min-w-[110px]">{t('合计')}</TableHead>
                              </TableRow>
                        </TableHeader>
                        <TableBody>
                              {rows.map(row => (
                                    <TableRow key={row.shop_id}>
                                          <TableCell className="font-medium">{row.shop_name}</TableCell>
                                          <TableCell>{row.category_name}</TableCell>
                                          {periods.map(period => (
                                                <TableCell key={period} className="text-right">
                                                      {(row.values[period] || 0).toLocaleString()}
                                                </TableCell>
                                          ))}
                                          <TableCell className="text-right font-semibold">{row.total.toLocaleString()}</TableCell>
                                    </TableRow>
                              ))}
                        </TableBody>
                  </Table>
            </div>
      );
};

export default ShopTimeStatsTable;
