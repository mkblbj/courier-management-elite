import React, { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ShopTimeStatsItem } from '@/lib/types/stats';
import { useTranslation } from 'react-i18next';

interface ShopTimeStatsChartProps {
      data: ShopTimeStatsItem[];
      groupBy: 'day' | 'month' | 'year';
}

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2', '#4f46e5', '#65a30d'];

const formatPeriod = (period: string, groupBy: 'day' | 'month' | 'year') => {
      if (groupBy === 'year') return `${period}年`;
      if (groupBy === 'month') {
            const [year, month] = period.split('-');
            return `${year}-${month}`;
      }
      return period;
};

const ShopTimeStatsChart: React.FC<ShopTimeStatsChartProps> = ({ data, groupBy }) => {
      const { t } = useTranslation('stats');

      const { chartData, topShops } = useMemo(() => {
            const totals = new Map<number, { shop_name: string; total: number }>();
            const valuesByPeriodAndShop = new Map<string, Map<number, number>>();

            data.forEach(item => {
                  const current = totals.get(item.shop_id) || { shop_name: item.shop_name, total: 0 };
                  current.total += item.total_quantity;
                  totals.set(item.shop_id, current);

                  if (!valuesByPeriodAndShop.has(item.period)) {
                        valuesByPeriodAndShop.set(item.period, new Map<number, number>());
                  }
                  const periodValues = valuesByPeriodAndShop.get(item.period)!;
                  periodValues.set(item.shop_id, (periodValues.get(item.shop_id) || 0) + item.total_quantity);
            });

            const shops = Array.from(totals.entries())
                  .map(([shop_id, value]) => ({ shop_id, ...value }))
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 8);

            const periods = Array.from(valuesByPeriodAndShop.keys()).sort();
            const rows = periods.map(period => {
                  const row: Record<string, string | number> = {
                        period,
                        period_label: formatPeriod(period, groupBy)
                  };
                  const periodValues = valuesByPeriodAndShop.get(period);

                  shops.forEach(shop => {
                        row[shop.shop_name] = periodValues?.get(shop.shop_id) || 0;
                  });

                  return row;
            });

            return { chartData: rows, topShops: shops };
      }, [data, groupBy]);

      if (data.length === 0) {
            return <div className="text-center py-8 text-muted-foreground">{t('暂无数据')}</div>;
      }

      return (
            <div className="h-[360px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="period_label" />
                              <YAxis />
                              <Tooltip />
                              {topShops.map((shop, index) => (
                                    <Line
                                          key={shop.shop_id}
                                          type="monotone"
                                          dataKey={shop.shop_name}
                                          stroke={COLORS[index % COLORS.length]}
                                          strokeWidth={2}
                                          dot={false}
                                    />
                              ))}
                        </LineChart>
                  </ResponsiveContainer>
            </div>
      );
};

export default ShopTimeStatsChart;
