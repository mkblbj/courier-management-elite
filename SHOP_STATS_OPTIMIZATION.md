# 店铺统计表格优化总结

## 问题分析

根据用户提供的图片和代码分析，发现以下问题：

1. **占比显示问题**：表格中占比列显示为"-"，没有正确计算和显示占比数据
2. **同比环比显示问题**：环比和同比列也显示为"-"，缺少相关计算逻辑
3. **API 数据结构问题**：后端店铺统计 API 缺少占比计算和同比环比计算逻辑

## 解决方案

### 1. 后端 API 优化 (`backend/src/controllers/StatsController.js`)

#### 修改内容：

- **占比计算**：在 `getShopOutputsByShop` 方法中添加了占比计算逻辑
- **日均量计算**：添加了基于天数的日均量计算
- **同比环比计算**：参考 `getShopOutputsByCategory` 的实现，添加了完整的同比环比计算逻辑

#### 新增功能：

```javascript
// 计算总量用于占比计算
const totalQuantity = processedResults.reduce((sum, item) => {
  const quantity = parseFloat(item.total_quantity) || 0;
  return sum + quantity;
}, 0);

// 为每个店铺添加占比和日均量
processedResults.forEach((item) => {
  const quantity = parseFloat(item.total_quantity) || 0;
  const daysCount = parseInt(item.days_count) || 1;

  // 计算占比
  item.percentage =
    totalQuantity > 0
      ? parseFloat(((quantity / totalQuantity) * 100).toFixed(2))
      : 0;

  // 计算日均量
  item.daily_average = parseFloat((quantity / daysCount).toFixed(2));
});
```

#### 同比环比计算：

- **环比**：与上一个相同时间段的数据对比
- **同比**：与去年同期数据对比
- **变化率计算**：包含增长、下降、不变三种状态
- **错误处理**：如果计算出错，返回默认值而不是失败

### 2. 前端表格组件优化 (`frontend/app/stats/components/ShopStatsTable.tsx`)

#### 修改内容：

- **同比环比显示优化**：参考 `CategoryStatsTable.tsx` 的实现
- **变化率渲染函数**：添加了 `renderChangeRate` 和 `renderCombinedChangeRate` 函数
- **表格列合并**：将原来的两列（环比、同比）合并为一列（同比/环比）
- **视觉效果改进**：添加了颜色标识和图标显示

#### 新增功能：

```typescript
// 处理变化率显示的辅助函数
const renderChangeRate = (
  changeRate?: number,
  changeType?: "increase" | "decrease" | "unchanged"
) => {
  // 支持增长（绿色↑）、下降（红色↓）、不变（灰色→）三种状态
  // 自动处理数据类型转换和边界情况
};

// 同时渲染同比和环比变化率
const renderCombinedChangeRate = (shop: ShopStatsItem) => {
  // 格式：同比/环比，如果只有一个值则只显示一个
  // 使用背景色区分，提高可读性
};
```

### 3. 测试页面 (`frontend/app/test-shop-stats/page.tsx`)

创建了一个专门的测试页面来验证修改效果：

- 可以自定义日期范围
- 显示原始 API 返回数据
- 实时预览表格效果
- 便于调试和验证

## 技术特点

### 1. 数据一致性

- 后端计算逻辑与前端显示逻辑保持一致
- 统一的数据格式和字段命名
- 完善的错误处理机制

### 2. 用户体验

- 直观的颜色和图标标识
- 合理的数据格式化（保留 2 位小数）
- 响应式布局和虚拟滚动支持

### 3. 性能优化

- 缓存机制减少重复请求
- 虚拟滚动处理大量数据
- 异步计算避免阻塞

## 使用方法

### 1. 启动服务

```bash
# 后端
cd backend && npm start

# 前端
cd frontend && npm run dev
```

### 2. 测试验证

访问 `/test-shop-stats` 页面进行功能测试

### 3. 正常使用

在统计页面选择"店铺"维度，设置日期范围即可查看优化后的表格

## API 参数说明

### 店铺统计 API (`/api/stats/shop-outputs/shops`)

**请求参数：**

- `date_from`: 开始日期 (YYYY-MM-DD)
- `date_to`: 结束日期 (YYYY-MM-DD)
- `courier_id`: 快递类型 ID（可选）
- `category_id`: 店铺类别 ID（可选）

**响应字段：**

- `shop_id`: 店铺 ID
- `shop_name`: 店铺名称
- `category_name`: 类别名称
- `total_quantity`: 总出力量
- `percentage`: 占比（%）
- `daily_average`: 日均量
- `mom_change_rate`: 环比变化率（%）
- `mom_change_type`: 环比变化类型
- `yoy_change_rate`: 同比变化率（%）
- `yoy_change_type`: 同比变化类型

## 注意事项

1. **日期范围**：同比环比计算需要提供 `date_from` 和 `date_to` 参数
2. **数据依赖**：需要有历史数据才能计算同比环比
3. **性能考虑**：大量数据时建议启用虚拟滚动
4. **错误处理**：API 异常时会返回默认值，不会中断整个流程

## 后续优化建议

1. **缓存策略**：可以考虑在数据库层面缓存计算结果
2. **批量计算**：对于大量店铺，可以考虑批量计算优化性能
3. **实时更新**：可以添加 WebSocket 支持实时数据更新
4. **导出功能**：完善数据导出功能，支持 Excel 格式
5. **图表集成**：添加趋势图表显示变化情况
