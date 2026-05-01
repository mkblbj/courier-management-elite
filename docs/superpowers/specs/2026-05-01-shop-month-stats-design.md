# 按店铺/时间统计设计说明

## 目标

在“统计页 > 店铺出力统计”中新增“按店铺/时间”统计入口，让用户可以直接查询每个店铺按日、按月、按年的出力量，并支持自选时间范围，不再依赖导出后手工做透视表。

## 入口位置

新增入口放在现有“店铺出力统计”的“统计维度”切换区中：

```text
按日期 / 按店铺类别 / 按店铺 / 按店铺/时间 / 按快递类型
```

选择“按店铺/时间”后，页面保留当前统计页的时间范围、刷新、导出、筛选条件等交互风格，并额外显示时间粒度切换：

```text
按日 / 按月 / 按年
```

## 数据口径

统计对象为 `shop_outputs` 中的出力记录。

口径保持现有统计逻辑一致：

- 排除 `operation_type = 'merge'` 的合单记录。
- 按 `shop_id` 和时间段聚合。
- 时间段来源于 `output_date`。
- `group_by = day` 时，时间段格式为 `YYYY-MM-DD`。
- `group_by = month` 时，时间段格式为 `YYYY-MM`。
- `group_by = year` 时，时间段格式为 `YYYY`。
- `total_quantity` 为该店铺在对应时间段内 `quantity` 求和。
- 支持按日期范围过滤。
- 支持按店铺类别、快递类型、单店铺过滤。

## 后端接口

新增接口：

```text
GET /api/stats/shop-outputs/shop-time-series
```

查询参数：

```text
group_by     必填，day | month | year
date_from    可选，YYYY-MM-DD
date_to      可选，YYYY-MM-DD
category_id  可选，店铺类别 ID
courier_id   可选，快递类型 ID
shop_id      可选，店铺 ID
```

响应数据为长表结构：

```ts
type ShopTimeStatsItem = {
  period: string;
  group_by: 'day' | 'month' | 'year';
  shop_id: number;
  shop_name: string;
  category_id: number | null;
  category_name: string;
  total_quantity: number;
};
```

示例：

```json
[
  {
    "period": "2026-04",
    "group_by": "month",
    "shop_id": 123,
    "shop_name": "店铺A",
    "category_id": 1,
    "category_name": "类别A",
    "total_quantity": 456
  }
]
```

后端只负责按店铺和时间段聚合数据，不负责生成透视表。前端根据返回数据构建“店铺 × 时间段”的矩阵展示。

## 前端展示

新增 `shop-time` 统计维度。

展示内容：

- 概览卡片：
  - 店铺数
  - 时间段数
  - 总出力量
- 表格：
  - 行：店铺
  - 固定信息列：店铺名、类别
  - 动态时间列：按当前粒度和时间范围升序展示
  - 合计列：该店铺在当前范围内总出力量
- 图表：
  - 展示当前范围内总出力量最高的若干店铺的时间趋势。
  - 避免全部店铺同时进入图表导致不可读。

空数据、加载中、错误重试沿用现有统计组件风格。

## 时间筛选

“按店铺/时间”默认使用按月粒度，默认范围为当前年份 1 月到 12 月。

不同粒度下的时间筛选规则：

- 按日：
  - 使用日期范围。
  - 默认范围为当前月份第一天到最后一天。
  - 请求参数为 `group_by=day`、`date_from`、`date_to`。
- 按月：
  - 使用月份范围。
  - 默认范围为当前年份 1 月到 12 月。
  - 请求参数为 `group_by=month`，并将月份范围转换为日期范围。
- 按年：
  - 使用年份范围。
  - 默认范围为当前年份往前 4 年到当前年份。
  - 请求参数为 `group_by=year`，并将年份范围转换为日期范围。

用户可以在每种粒度下自选时间范围。切换粒度时，系统按对应粒度设置合理默认范围。

## 筛选条件

“按店铺/时间”显示以下筛选：

- 快递类型
- 店铺类别
- 店铺

筛选参数最终传给 `/shop-time-series` 接口。

## 需要修改的文件

后端：

- `backend/src/routes/statsRoutes.js`
- `backend/src/controllers/StatsController.js`
- 新增或扩展后端统计接口测试

前端：

- `frontend/lib/types/stats.ts`
- `frontend/lib/api/stats.ts`
- `frontend/app/stats/components/StatsControlPanel.tsx`
- `frontend/app/stats/components/ShopOutputStats.tsx`
- 新增 `frontend/app/stats/components/ShopTimeStatsTable.tsx`
- 新增 `frontend/app/stats/components/ShopTimeStatsChart.tsx`

## 验收标准

功能验收：

- 统计页的店铺出力统计中出现“按店铺/时间”入口。
- 默认打开当前年份的按店铺/时间统计，粒度为按月。
- 用户可以切换按日、按月、按年。
- 用户可以在当前粒度下自选时间范围。
- 表格能看到每个店铺在每个时间段的出力量和合计。
- 店铺类别、快递类型、店铺筛选能影响结果。
- 空数据、加载失败、刷新行为正常。

技术验收：

- 后端接口返回按店铺和时间段聚合的数据。
- 前端类型定义和 API 封装完整。
- 不改变现有“按日期”“按店铺”“按快递类型”“按店铺类别”的行为。
- 后端相关测试通过。
- 前端构建或类型检查通过。
