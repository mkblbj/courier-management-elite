# Homepage API Yesterday Output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `GET /api/dashboard/homepage` 增加与今日结构一致的昨日出力总量和明细。

**Architecture:** 在 `DashboardController.getHomepageStats` 的现有并行查询中加入昨日聚合出力查询，并复用 `buildShopOutputDetail` 生成响应。成功和失败响应都新增稳定字段，保持所有原有字段及 30 秒缓存行为不变。

**Tech Stack:** Node.js、Express、Jest、现有 Shop/ShopOutput/ShippingRecord 模型

## Global Constraints

- 只新增 `yesterday_output_quantity` 和 `yesterday_output`，不删除或重命名任何现有字段。
- `yesterday_output` 必须与 `today_output` 使用相同结构。
- 异常响应必须包含昨日日期对应的空出力结构。
- 不修改现有 30 秒缓存及发货数据逻辑。

---

### Task 1: Homepage API 昨日出力响应

**Files:**
- Create: `backend/src/tests/unit/dashboardController.homepage.test.js`
- Modify: `backend/src/controllers/DashboardController.js:927-1025`

**Interfaces:**
- Consumes: `ShopOutput.getAggregatedOutputsByDate(date: string): Promise<Array>`、`Shop.getAll(options): Promise<Array>`、`shippingRecordInstance.getByDate(date: string): Promise<Array>`。
- Produces: `GET /api/dashboard/homepage` 响应字段 `yesterday_output_quantity: number` 和 `yesterday_output: ShopOutputDetail`。

- [x] **Step 1: 编写成功响应的失败测试**

创建 `backend/src/tests/unit/dashboardController.homepage.test.js`，冻结时间为 `2026-07-13T00:00:00.000Z`，模拟模型返回值，并断言：

```js
expect(ShopOutput.getAggregatedOutputsByDate.mock.calls.map(([date]) => date))
  .toEqual(['2026-07-12', '2026-07-13', '2026-07-14']);
expect(body.yesterday_output_quantity).toBe(12);
expect(body.yesterday_output).toMatchObject({
  date: '2026-07-12',
  total_quantity: 12,
  shops_count: 1,
  active_shops_count: 1,
  shops: [{
    shop_id: 1,
    shop_name: '测试店铺',
    total_quantity: 12,
    couriers: [{ courier_id: 2, courier_name: '测试快递', quantity: 12 }]
  }]
});
```

同一文件再加入失败响应测试，让 `Shop.getAll` 抛错并断言：

```js
expect(res.status).toHaveBeenCalledWith(500);
expect(body.yesterday_output_quantity).toBe(0);
expect(body.yesterday_output).toEqual({
  date: '2026-07-12',
  total_quantity: 0,
  shops_count: 0,
  active_shops_count: 0,
  shops: []
});
```

- [x] **Step 2: 运行测试并确认按预期失败**

Run: `cd backend && npm test -- --runInBand src/tests/unit/dashboardController.homepage.test.js`

Expected: FAIL；成功用例缺少 `2026-07-12` 出力查询及 `yesterday_output_quantity`，失败用例缺少昨日出力空结构。

- [x] **Step 3: 编写最小实现**

在 `getHomepageStats` 的 `Promise.all` 中加入：

```js
ShopOutput.getAggregatedOutputsByDate(yesterday)
```

并构建：

```js
const yesterdayOutputDetail = buildShopOutputDetail(yesterday, shops, yesterdayOutputs);
```

成功响应加入：

```js
yesterday_output_quantity: yesterdayOutputDetail.total_quantity,
yesterday_output: yesterdayOutputDetail,
```

异常响应加入：

```js
yesterday_output_quantity: 0,
yesterday_output: {
  date: yesterday,
  total_quantity: 0,
  shops_count: 0,
  active_shops_count: 0,
  shops: []
},
```

- [x] **Step 4: 运行定向测试并确认通过**

Run: `cd backend && npm test -- --runInBand src/tests/unit/dashboardController.homepage.test.js`

Expected: PASS，2 tests passed。

- [x] **Step 5: 运行后端完整测试与静态检查**

Run: `cd backend && npm test -- --runInBand`

Expected: 所有测试通过。

Run: `git diff --check`

Expected: 无输出，退出码为 0。

- [x] **Step 6: 提交实现**

```bash
git add backend/src/controllers/DashboardController.js \
  backend/src/tests/unit/dashboardController.homepage.test.js \
  docs/superpowers/plans/2026-07-13-homepage-yesterday-output.md
git commit -m "feat: add yesterday output to homepage API"
```
