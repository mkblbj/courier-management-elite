# Shop Time Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a “按店铺/时间” statistics entry that shows each shop’s output by day, month, or year with selectable time ranges and filters.

**Architecture:** Add one backend aggregation endpoint that returns long-form shop/time rows. The frontend adds a `shop-time` dimension, reuses the existing control panel and time range controls, then pivots the long-form API response into a matrix table and a top-shop trend chart. Existing date, shop, category, and courier statistics remain unchanged.

**Tech Stack:** Express 5, Jest, MySQL `DATE_FORMAT`, Next.js 15, React 19, TypeScript, Recharts, existing shadcn-style UI components.

---

## File Structure

- `backend/src/controllers/StatsController.js`: add `getShopOutputsByShopTimeSeries(req, res)`.
- `backend/src/routes/statsRoutes.js`: expose `GET /api/stats/shop-outputs/shop-time-series`.
- `backend/src/routes/index.js`: add the endpoint to API docs.
- `backend/src/tests/unit/statsController.shopTimeSeries.test.js`: new controller unit tests with mocked `db.query`.
- `frontend/lib/types/stats.ts`: add `ShopTimeStatsItem` and update `StatsQueryParams`.
- `frontend/lib/api/stats.ts`: add `getShopTimeStats(params)`.
- `frontend/app/stats/components/StatsControlPanel.tsx`: add the “按店铺/时间” dimension, grain switch, time picker behavior, and filters.
- `frontend/app/stats/components/ShopOutputStats.tsx`: add state, fetching, caching, summaries, and rendering for `shop-time`.
- `frontend/app/stats/components/ShopTimeStatsTable.tsx`: new pivot table component.
- `frontend/app/stats/components/ShopTimeStatsChart.tsx`: new top-shop trend chart component.
- `frontend/public/locales/{zh-CN,en,ja}/stats.json`: add user-facing labels.

## Task 1: Backend Controller Tests

**Files:**
- Create: `backend/src/tests/unit/statsController.shopTimeSeries.test.js`
- Reference: `backend/src/controllers/StatsController.js`
- Reference: `backend/src/db/index.js` through `require('../../db')`

- [ ] **Step 1: Create the unit test file**

```js
const StatsController = require('../../controllers/StatsController');
const db = require('../../db');

jest.mock('../../db', () => ({
  query: jest.fn()
}));

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('StatsController.getShopOutputsByShopTimeSeries', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('按月返回店铺时间序列聚合数据', async () => {
    db.query.mockResolvedValue([
      {
        period: '2026-04',
        group_by: 'month',
        shop_id: 1,
        shop_name: '测试店铺A',
        category_id: 2,
        category_name: '测试类别',
        total_quantity: '120'
      },
      {
        period: '2026-05',
        group_by: 'month',
        shop_id: 1,
        shop_name: '测试店铺A',
        category_id: 2,
        category_name: '测试类别',
        total_quantity: 80
      }
    ]);

    const req = {
      query: {
        group_by: 'month',
        date_from: '2026-01-01',
        date_to: '2026-12-31',
        category_id: '2',
        courier_id: '3',
        shop_id: '1'
      }
    };
    const res = createResponse();

    await StatsController.getShopOutputsByShopTimeSeries(req, res);

    expect(db.query).toHaveBeenCalledTimes(1);
    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toContain("DATE_FORMAT(so.output_date, '%Y-%m')");
    expect(sql).toContain('AND so.shop_id = ?');
    expect(sql).toContain('AND so.courier_id = ?');
    expect(sql).toContain('AND s.category_id = ?');
    expect(sql).toContain("so.operation_type != 'merge'");
    expect(params).toEqual(['1', '3', '2', '2026-01-01', '2026-12-31']);

    expect(res.json).toHaveBeenCalledWith({
      code: 0,
      message: '获取按店铺/时间统计数据成功',
      data: [
        {
          period: '2026-04',
          group_by: 'month',
          shop_id: 1,
          shop_name: '测试店铺A',
          category_id: 2,
          category_name: '测试类别',
          total_quantity: 120
        },
        {
          period: '2026-05',
          group_by: 'month',
          shop_id: 1,
          shop_name: '测试店铺A',
          category_id: 2,
          category_name: '测试类别',
          total_quantity: 80
        }
      ]
    });
  });

  test('拒绝不支持的时间粒度', async () => {
    const req = { query: { group_by: 'week' } };
    const res = createResponse();

    await StatsController.getShopOutputsByShopTimeSeries(req, res);

    expect(db.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: 400,
      message: 'group_by 只支持 day、month、year'
    });
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
cd backend
npm test -- --runInBand src/tests/unit/statsController.shopTimeSeries.test.js
```

Expected: FAIL with `StatsController.getShopOutputsByShopTimeSeries is not a function`.

- [ ] **Step 3: Commit the failing test**

```bash
git add backend/src/tests/unit/statsController.shopTimeSeries.test.js
git commit -m "test: cover shop time stats controller"
```

## Task 2: Backend Endpoint Implementation

**Files:**
- Modify: `backend/src/controllers/StatsController.js`
- Modify: `backend/src/routes/statsRoutes.js`
- Modify: `backend/src/routes/index.js`
- Test: `backend/src/tests/unit/statsController.shopTimeSeries.test.js`

- [ ] **Step 1: Add the controller method**

Insert this method in `StatsController` near the existing date statistics method:

```js
  /**
   * 获取店铺出力数据按店铺和时间统计
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getShopOutputsByShopTimeSeries(req, res) {
    try {
      const groupBy = req.query.group_by || 'month';
      const allowedGroupBy = ['day', 'month', 'year'];

      if (!allowedGroupBy.includes(groupBy)) {
        return res.status(400).json({
          code: 400,
          message: 'group_by 只支持 day、month、year'
        });
      }

      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const shopId = req.query.shop_id || null;
      const courierId = req.query.courier_id || null;
      const categoryId = req.query.category_id || null;

      const db = require('../db');

      const dateGroupExpressionMap = {
        day: "DATE_FORMAT(so.output_date, '%Y-%m-%d')",
        month: "DATE_FORMAT(so.output_date, '%Y-%m')",
        year: "DATE_FORMAT(so.output_date, '%Y')"
      };

      const dateGroupExpression = dateGroupExpressionMap[groupBy];

      let sql = `
        SELECT
          ${dateGroupExpression} as period,
          '${groupBy}' as group_by,
          s.id as shop_id,
          s.name as shop_name,
          s.category_id,
          sc.name as category_name,
          SUM(so.quantity) as total_quantity
        FROM
          shop_outputs so
        JOIN
          shops s ON so.shop_id = s.id
        LEFT JOIN
          shop_categories sc ON s.category_id = sc.id
        WHERE
          (so.operation_type IS NULL OR so.operation_type != 'merge')
      `;

      const params = [];

      if (shopId) {
        sql += ` AND so.shop_id = ?`;
        params.push(shopId);
      }

      if (courierId) {
        sql += ` AND so.courier_id = ?`;
        params.push(courierId);
      }

      if (categoryId) {
        sql += ` AND s.category_id = ?`;
        params.push(categoryId);
      }

      if (dateFrom) {
        sql += ` AND so.output_date >= ?`;
        params.push(dateFrom);
      }

      if (dateTo) {
        sql += ` AND so.output_date <= ?`;
        params.push(dateTo);
      }

      sql += `
        GROUP BY
          ${dateGroupExpression}, s.id, s.name, s.category_id, sc.name
        ORDER BY
          period ASC, s.name ASC
      `;

      const results = await db.query(sql, params);
      const data = Array.isArray(results) ? results.map(row => ({
        period: row.period,
        group_by: row.group_by || groupBy,
        shop_id: Number(row.shop_id),
        shop_name: row.shop_name,
        category_id: row.category_id === null || row.category_id === undefined ? null : Number(row.category_id),
        category_name: row.category_name || '未分类',
        total_quantity: Number(row.total_quantity) || 0
      })) : [];

      res.json({
        code: 0,
        message: '获取按店铺/时间统计数据成功',
        data
      });
    } catch (error) {
      console.error('获取按店铺/时间统计数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取按店铺/时间统计数据失败',
        error: error.message
      });
    }
  }
```

- [ ] **Step 2: Add the route**

In `backend/src/routes/statsRoutes.js`, add the route before the total/export routes:

```js
// 按店铺和时间统计
router.get('/shop-outputs/shop-time-series', StatsController.getShopOutputsByShopTimeSeries.bind(StatsController));
```

- [ ] **Step 3: Update API docs**

In `backend/src/routes/index.js`, add this endpoint under the 统计分析 API list:

```js
{ method: 'GET', path: '/shop-outputs/shop-time-series', description: '按店铺和时间统计' },
```

- [ ] **Step 4: Run backend tests**

Run:

```bash
cd backend
npm test -- --runInBand src/tests/unit/statsController.shopTimeSeries.test.js
```

Expected: PASS, 2 tests passing.

- [ ] **Step 5: Commit backend implementation**

```bash
git add backend/src/controllers/StatsController.js backend/src/routes/statsRoutes.js backend/src/routes/index.js
git commit -m "feat: add shop time stats endpoint"
```

## Task 3: Frontend Types and API Client

**Files:**
- Modify: `frontend/lib/types/stats.ts`
- Modify: `frontend/lib/api/stats.ts`

- [ ] **Step 1: Add frontend types**

In `frontend/lib/types/stats.ts`, add this type after `DateStatsItem`:

```ts
/**
 * 店铺时间统计数据类型
 */
export interface ShopTimeStatsItem {
  period: string;
  group_by: 'day' | 'month' | 'year';
  shop_id: number;
  shop_name: string;
  category_id: number | null;
  category_name: string;
  total_quantity: number;
}
```

Keep `StatsQueryParams.group_by` as `'day' | 'week' | 'month' | 'year'` because the existing date dimension still supports week.

- [ ] **Step 2: Add API function import type**

In `frontend/lib/api/stats.ts`, extend the import list:

```ts
import {
  CategoryStatsItem,
  ShopStatsItem,
  CourierStatsItem,
  DateStatsItem,
  ShopTimeStatsItem,
  StatsQueryParams,
  ShopStatsResponse
} from '@/lib/types/stats';
```

- [ ] **Step 3: Add API wrapper**

In `frontend/lib/api/stats.ts`, add this function after `getDateStats`:

```ts
/**
 * 获取按店铺/时间统计的出力数据
 * @param params 查询参数
 * @returns 按店铺和时间统计的数据
 */
export const getShopTimeStats = async (
  params: StatsQueryParams & { group_by: 'day' | 'month' | 'year' }
): Promise<ShopTimeStatsItem[]> => {
  return fetchWithCache<ShopTimeStatsItem[]>('/shop-time-series', params);
};
```

- [ ] **Step 4: Run TypeScript build check**

Run:

```bash
cd frontend
pnpm build
```

Expected: PASS.

- [ ] **Step 5: Commit frontend API types**

```bash
git add frontend/lib/types/stats.ts frontend/lib/api/stats.ts
git commit -m "feat: add shop time stats api client"
```

## Task 4: Control Panel Entry and Time Controls

**Files:**
- Modify: `frontend/app/stats/components/StatsControlPanel.tsx`
- Modify: `frontend/app/stats/components/ShopOutputStats.tsx`

- [ ] **Step 1: Extend the stats dimension type**

In `frontend/app/stats/components/ShopOutputStats.tsx`, change:

```ts
export type StatsDimension = 'category' | 'shop' | 'courier' | 'date';
```

to:

```ts
export type StatsDimension = 'category' | 'shop' | 'shop-time' | 'courier' | 'date';
```

- [ ] **Step 2: Add the icon case**

In `StatsControlPanel.tsx`, update `getDimensionIcon`:

```tsx
case 'shop-time':
  return <LineChart className="h-4 w-4 mr-1" />;
```

- [ ] **Step 3: Add the dimension button**

In the statistics dimension toggle group, insert this item after the existing `shop` item:

```tsx
<ToggleGroupItem value="shop-time" aria-label={t('按店铺/时间')} className="flex items-center">
  {getDimensionIcon('shop-time')}
  {t('按店铺/时间')}
</ToggleGroupItem>
```

- [ ] **Step 4: Show grain switch for date and shop-time**

Replace the “分组方式” render condition with:

```tsx
{(selectedDimension === 'date' || selectedDimension === 'shop-time') && onGroupByChange && (
  <div className="space-y-3">
    <div className="text-sm font-medium">{selectedDimension === 'shop-time' ? t('时间粒度') : t('分组方式')}</div>
    <ToggleGroup
      type="single"
      value={groupBy}
      onValueChange={(value) => value && onGroupByChange(value as 'day' | 'week' | 'month' | 'year')}
    >
      <ToggleGroupItem value="day" aria-label={t('按日')} className="text-xs">
        {t('按日')}
      </ToggleGroupItem>
      {selectedDimension === 'date' && (
        <ToggleGroupItem value="week" aria-label={t('按周')} className="text-xs">
          {t('按周')}
        </ToggleGroupItem>
      )}
      <ToggleGroupItem value="month" aria-label={t('按月')} className="text-xs">
        {t('按月')}
      </ToggleGroupItem>
      <ToggleGroupItem value="year" aria-label={t('按年')} className="text-xs">
        {t('按年')}
      </ToggleGroupItem>
    </ToggleGroup>
  </div>
)}
```

- [ ] **Step 5: Add shop-time date range behavior**

Update `getCurrentDateRange` in `StatsControlPanel.tsx` so `shop-time` uses the same range conversion as date for day/month/year:

```ts
const usesGroupedTimeRange = selectedDimension === 'date' || selectedDimension === 'shop-time';

if (usesGroupedTimeRange && groupBy === 'month' && monthRange) {
  if (monthRange.from) {
    fromDate = `${monthRange.from.year}-${String(monthRange.from.month || 1).padStart(2, '0')}-01`;
  }
  if (monthRange.to) {
    const lastDay = new Date(monthRange.to.year, monthRange.to.month || 12, 0).getDate();
    toDate = `${monthRange.to.year}-${String(monthRange.to.month || 12).padStart(2, '0')}-${lastDay}`;
  }
} else if (usesGroupedTimeRange && groupBy === 'year' && yearRange) {
  if (yearRange.from) {
    fromDate = `${yearRange.from.year}-01-01`;
  }
  if (yearRange.to) {
    toDate = `${yearRange.to.year}-12-31`;
  }
} else {
  fromDate = formatDateForApi(dateRange?.from);
  toDate = formatDateForApi(dateRange?.to);
}
```

- [ ] **Step 6: Add shop-time time picker behavior**

At the top of `renderTimeFilter`, use grouped controls for `date` and `shop-time`:

```tsx
const usesGroupedTimeRange = selectedDimension === 'date' || selectedDimension === 'shop-time';

if (!usesGroupedTimeRange) {
  return (
    <div className="w-full max-w-sm">
      <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
    </div>
  );
}
```

For the `month` case, use month mode for the new dimension:

```tsx
<MonthYearPicker
  mode={selectedDimension === 'shop-time' ? 'month' : 'year'}
  value={monthRange}
  onChange={onMonthRangeChange || (() => { })} 
/>
```

The existing date dimension keeps its current behavior.

- [ ] **Step 7: Show filters for shop-time**

Update `shouldShowFilters`:

```ts
return (selectedDimension === 'category' || selectedDimension === 'shop' || selectedDimension === 'shop-time' || selectedDimension === 'courier') && onFilterChange;
```

Update filter sections:

```tsx
{(selectedDimension === 'category' || selectedDimension === 'shop' || selectedDimension === 'shop-time') && (
  // 快递类型筛选器
)}

{(selectedDimension === 'shop' || selectedDimension === 'shop-time' || selectedDimension === 'courier') && (
  // 店铺类别筛选器
)}

{(selectedDimension === 'shop-time' || selectedDimension === 'courier') && (
  // 店铺筛选器
)}
```

- [ ] **Step 8: Initialize shop-time with monthly grain**

In `ShopOutputStats.tsx`, update `handleDimensionChange`:

```ts
const handleDimensionChange = useCallback((dimension: StatsDimension) => {
  setSelectedDimension(dimension);
  setError(null);
  statsCache.clearByPattern(dimension);

  if (dimension === 'shop-time') {
    const currentYear = new Date().getFullYear();
    setGroupBy('month');
    setMonthRange({
      from: { year: currentYear, month: 1 },
      to: { year: currentYear, month: 12 }
    });
  }
}, []);
```

- [ ] **Step 9: Run build check**

Run:

```bash
cd frontend
pnpm build
```

Expected: PASS.

- [ ] **Step 10: Commit the control panel changes**

```bash
git add frontend/app/stats/components/StatsControlPanel.tsx frontend/app/stats/components/ShopOutputStats.tsx
git commit -m "feat: add shop time stats controls"
```

## Task 5: Shop-Time Data Fetching and State

**Files:**
- Modify: `frontend/app/stats/components/ShopOutputStats.tsx`
- Reference: `frontend/lib/api/stats.ts`
- Reference: `frontend/lib/types/stats.ts`

- [ ] **Step 1: Import API, type, and components**

Update imports in `ShopOutputStats.tsx`:

```ts
import {
  getCategoryStats,
  getShopStats,
  getCourierStats,
  getDateStats,
  getShopTimeStats,
  getCourierTypes,
  getShopCategories,
  getShops,
  prefetchStatsData,
  clearStatsCache
} from '@/lib/api/stats';

import {
  CategoryStatsItem,
  ShopStatsItem,
  CourierStatsItem,
  DateStatsItem,
  ShopTimeStatsItem,
  CourierType,
  ShopCategory,
  Shop
} from '@/lib/types/stats';
```

- [ ] **Step 2: Add a data ref**

Add beside the other data refs:

```ts
const shopTimeDataRef = useRef<ShopTimeStatsItem[]>([]);
```

Clear it in the unmount cleanup and refresh handler:

```ts
shopTimeDataRef.current = [];
```

- [ ] **Step 3: Update time parameter conversion**

Update `getTimeParams` to support `shop-time`:

```ts
if (selectedDimension !== 'date' && selectedDimension !== 'shop-time') {
  return {
    date_from: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    date_to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  };
}
```

Keep the existing `day`, `week`, `month`, and `year` switch. For `shop-time`, `groupBy` will only be `day`, `month`, or `year`.

- [ ] **Step 4: Add fetch branch**

In `fetchData`, add this branch before the final `date` branch:

```ts
} else if (selectedDimension === 'shop-time') {
  if (filters.shop_ids && filters.shop_ids.length > 0) {
    const shopId = parseInt(filters.shop_ids[0]);
    if (!isNaN(shopId) && shopId !== -1) {
      params.shop_id = shopId;
    }
  }

  if (filters.courier_ids && filters.courier_ids.length > 0) {
    const courierId = parseInt(filters.courier_ids[0]);
    if (!isNaN(courierId) && courierId !== -1) {
      params.courier_id = courierId;
    }
  }

  if (filters.category_ids && filters.category_ids.length > 0) {
    const categoryId = parseInt(filters.category_ids[0]);
    if (!isNaN(categoryId) && categoryId !== -1) {
      params.category_id = categoryId;
    }
  }

  const shopTimeGroupBy = groupBy === 'week' ? 'month' : groupBy;
  params.group_by = shopTimeGroupBy;

  data = await getShopTimeStats(params as any);
  shopTimeDataRef.current = Array.isArray(data) ? data : [];
  statsCache.set(cacheKey, shopTimeDataRef.current);
  dataSize = JSON.stringify(shopTimeDataRef.current).length;
```

- [ ] **Step 5: Update cached data restoration**

In the cache hit branch:

```ts
} else if (selectedDimension === 'shop-time') {
  shopTimeDataRef.current = cachedData as ShopTimeStatsItem[];
}
```

- [ ] **Step 6: Add current data field**

Update `currentData`:

```ts
return {
  categoryData: categoryDataRef.current,
  shopData: shopDataRef.current,
  courierData: courierDataRef.current,
  dateData: dateDataRef.current,
  shopTimeData: shopTimeDataRef.current
};
```

- [ ] **Step 7: Keep shop-time render branch for the next task**

Do not add the visual render branch in this task. This task wires state and API data only. Rendering is added after the table and chart files exist.

- [ ] **Step 8: Run build check**

Run:

```bash
cd frontend
pnpm build
```

Expected: PASS.

- [ ] **Step 9: Commit state/fetch integration**

```bash
git add frontend/app/stats/components/ShopOutputStats.tsx
git commit -m "feat: wire shop time stats data"
```

## Task 6: Shop-Time Table and Chart

**Files:**
- Create: `frontend/app/stats/components/ShopTimeStatsTable.tsx`
- Create: `frontend/app/stats/components/ShopTimeStatsChart.tsx`
- Reference: `frontend/lib/types/stats.ts`

- [ ] **Step 1: Create pivot table component**

Create `frontend/app/stats/components/ShopTimeStatsTable.tsx`:

```tsx
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
```

- [ ] **Step 2: Create chart component**

Create `frontend/app/stats/components/ShopTimeStatsChart.tsx`:

```tsx
import React, { useMemo } from 'react';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ShopTimeStatsItem } from '@/lib/types/stats';
import { useTranslation } from 'react-i18next';

interface ShopTimeStatsChartProps {
  data: ShopTimeStatsItem[];
  groupBy: 'day' | 'month' | 'year';
}

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2', '#4f46e5', '#65a30d'];

const ShopTimeStatsChart: React.FC<ShopTimeStatsChartProps> = ({ data }) => {
  const { t } = useTranslation('stats');

  const { chartData, topShops } = useMemo(() => {
    const totals = new Map<number, { shop_name: string; total: number }>();

    data.forEach(item => {
      const current = totals.get(item.shop_id) || { shop_name: item.shop_name, total: 0 };
      current.total += item.total_quantity;
      totals.set(item.shop_id, current);
    });

    const shops = Array.from(totals.entries())
      .map(([shop_id, value]) => ({ shop_id, ...value }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const periods = Array.from(new Set(data.map(item => item.period))).sort();
    const rows = periods.map(period => {
      const row: Record<string, string | number> = { period };
      shops.forEach(shop => {
        const match = data.find(item => item.period === period && item.shop_id === shop.shop_id);
        row[shop.shop_name] = match ? match.total_quantity : 0;
      });
      return row;
    });

    return { chartData: rows, topShops: shops };
  }, [data]);

  if (data.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">{t('暂无数据')}</div>;
  }

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
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
```

- [ ] **Step 3: Import the new views**

In `frontend/app/stats/components/ShopOutputStats.tsx`, add:

```ts
import ShopTimeStatsTable from './ShopTimeStatsTable';
import ShopTimeStatsChart from './ShopTimeStatsChart';
```

- [ ] **Step 4: Add shop-time render branch**

Add this branch in `renderDataDisplay` before the courier branch:

```tsx
} else if (selectedDimension === 'shop-time') {
  const totalQuantity = currentData.shopTimeData.reduce((sum, item) => sum + item.total_quantity, 0);
  const shopCount = new Set(currentData.shopTimeData.map(item => item.shop_id)).size;
  const periodCount = new Set(currentData.shopTimeData.map(item => item.period)).size;
  const shopTimeGroupBy = groupBy === 'week' ? 'month' : groupBy;

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error.message}</span>
            <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('重试')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && currentData.shopTimeData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('店铺总数')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shopCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('时间段数')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{periodCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('总出力量')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>{t('正在加载数据...')}</span>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && currentData.shopTimeData.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('暂无数据')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('当前时间范围内没有找到店铺时间统计数据，请尝试调整筛选条件')}
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('重新加载')}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t('数据图表')}
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {t('刷新')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ShopTimeStatsChart data={currentData.shopTimeData} groupBy={shopTimeGroupBy} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('详细数据')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ShopTimeStatsTable data={currentData.shopTimeData} groupBy={shopTimeGroupBy} />
        </CardContent>
      </Card>
    </div>
  );
```

- [ ] **Step 5: Run frontend build**

Run:

```bash
cd frontend
pnpm build
```

Expected: PASS, unless existing unrelated build warnings are already present.

- [ ] **Step 6: Commit table, chart, and render integration**

```bash
git add frontend/app/stats/components/ShopTimeStatsTable.tsx frontend/app/stats/components/ShopTimeStatsChart.tsx frontend/app/stats/components/ShopOutputStats.tsx
git commit -m "feat: add shop time stats views"
```

## Task 7: Locale Labels

**Files:**
- Modify: `frontend/public/locales/zh-CN/stats.json`
- Modify: `frontend/public/locales/en/stats.json`
- Modify: `frontend/public/locales/ja/stats.json`

- [ ] **Step 1: Add Chinese labels**

Add these entries to `frontend/public/locales/zh-CN/stats.json`:

```json
"按店铺/时间": "按店铺/时间",
"时间粒度": "时间粒度",
"时间段数": "时间段数",
"店铺/时间统计": "店铺/时间统计",
"当前时间范围内没有找到店铺时间统计数据，请尝试调整筛选条件": "当前时间范围内没有找到店铺时间统计数据，请尝试调整筛选条件",
"重新加载": "重新加载",
"未分类": "未分类",
"合计": "合计",
"按日": "按日"
```

- [ ] **Step 2: Add English labels**

Add these entries to `frontend/public/locales/en/stats.json`:

```json
"按店铺/时间": "By Shop / Time",
"时间粒度": "Time Granularity",
"时间段数": "Time Periods",
"店铺/时间统计": "Shop / Time Statistics",
"当前时间范围内没有找到店铺时间统计数据，请尝试调整筛选条件": "No shop time statistics were found in the selected time range. Try adjusting the filters.",
"重新加载": "Reload",
"未分类": "Uncategorized",
"合计": "Total",
"按日": "By Day"
```

- [ ] **Step 3: Add Japanese labels**

Add these entries to `frontend/public/locales/ja/stats.json`:

```json
"按店铺/时间": "店舗/期間別",
"时间粒度": "期間単位",
"时间段数": "期間数",
"店铺/时间统计": "店舗/期間統計",
"当前时间范围内没有找到店铺时间统计数据，请尝试调整筛选条件": "選択した期間内に店舗/期間統計データがありません。フィルターを調整してください。",
"重新加载": "再読み込み",
"未分类": "未分類",
"合计": "合計",
"按日": "日別"
```

- [ ] **Step 4: Validate JSON**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('frontend/public/locales/zh-CN/stats.json','utf8')); JSON.parse(require('fs').readFileSync('frontend/public/locales/en/stats.json','utf8')); JSON.parse(require('fs').readFileSync('frontend/public/locales/ja/stats.json','utf8')); console.log('locale json ok')"
```

Expected: `locale json ok`.

- [ ] **Step 5: Commit locale updates**

```bash
git add frontend/public/locales/zh-CN/stats.json frontend/public/locales/en/stats.json frontend/public/locales/ja/stats.json
git commit -m "i18n: add shop time stats labels"
```

## Task 8: Final Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run backend targeted tests**

```bash
cd backend
npm test -- --runInBand src/tests/unit/statsController.shopTimeSeries.test.js
```

Expected: PASS, 2 tests passing.

- [ ] **Step 2: Run backend full test suite**

```bash
cd backend
npm test -- --runInBand
```

Expected: PASS. If existing tests fail due to environment database startup behavior, capture the exact failing test names and error messages.

- [ ] **Step 3: Run frontend production build**

```bash
cd frontend
pnpm build
```

Expected: PASS.

- [ ] **Step 4: Manual UI verification**

Start the app using the repo’s normal local commands:

```bash
cd backend
npm run dev
```

```bash
cd frontend
pnpm dev
```

In the browser:

```text
1. Open /stats?type=shop-output.
2. Click “按店铺/时间”.
3. Confirm default grain is “按月”.
4. Confirm default range is current year.
5. Switch to “按日” and select a date range.
6. Switch to “按年” and select a year range.
7. Apply 店铺类别, 快递类型, and 店铺 filters.
8. Confirm table columns change with the grain and totals update.
9. Confirm chart renders top shops without blank canvas.
10. Return to 按日期、按店铺、按快递类型、按店铺类别 and confirm existing views still load.
```

- [ ] **Step 5: Inspect git diff**

```bash
git status --short
git diff --stat
```

Expected: only files listed in this plan changed.

- [ ] **Step 6: Final commit if needed**

If Task 8 produced verification-only adjustments, commit them:

```bash
git add backend frontend
git commit -m "chore: verify shop time stats"
```

## Review Checklist

- The endpoint name is exactly `shop-time-series`.
- The frontend dimension value is `shop-time`.
- `group_by=week` is not sent to the new backend endpoint.
- Existing date dimension still supports week.
- Existing shop/date/category/courier views are not refactored.
- The table pivots frontend data; the backend returns long-form rows.
- Merge records remain excluded with `(so.operation_type IS NULL OR so.operation_type != 'merge')`.
- Month and year ranges are converted to `date_from` and `date_to` before calling the API.
