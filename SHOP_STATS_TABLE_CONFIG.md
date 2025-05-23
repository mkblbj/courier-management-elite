# 店铺统计表格配置说明

## 📋 配置选项

### 1. 每页显示数量配置

#### 默认设置

- **默认每页显示**：20 条记录
- **虚拟滚动模式**：1000 条记录（用于大数据量）

#### 自定义配置

可以通过 `pageSize` 属性自定义每页显示的数量：

```tsx
<ShopStatsTable
  data={shopData}
  pageSize={15} // 自定义每页显示15条
  enableVirtualization={false} // 关闭虚拟滚动使用分页
/>
```

#### 配置位置

在 `ShopStatsTable.tsx` 第 54 行：

```typescript
const effectivePageSize = enableVirtualization ? 1000 : customPageSize;
```

### 2. 页码显示格式

#### 新格式

- **分页控件**：第 1/3 页
- **状态栏**：分页模式 - 第 1/3 页

#### 修改位置

1. **分页控件**（第 575-579 行）：

```tsx
<span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-700 rounded-md">
  {currentPage}/{totalPages}
</span>
```

2. **状态栏**（第 605 行）：

```tsx
<span>
  分页模式 - 第{" "}
  <span className="font-semibold text-slate-800">
    {currentPage}/{totalPages}
  </span>{" "}
  页
</span>
```

## 🔧 使用方法

### 基本用法

```tsx
import ShopStatsTable from './components/ShopStatsTable';

// 使用默认设置（每页20条）
<ShopStatsTable data={shopData} />

// 自定义每页显示数量
<ShopStatsTable
  data={shopData}
  pageSize={25}  // 每页显示25条
/>

// 大数据量使用虚拟滚动
<ShopStatsTable
  data={shopData}
  enableVirtualization={true}  // 自动处理大量数据
/>
```

### 属性说明

| 属性                   | 类型              | 默认值 | 说明                               |
| ---------------------- | ----------------- | ------ | ---------------------------------- |
| `data`                 | `ShopStatsItem[]` | -      | 店铺统计数据                       |
| `pageSize`             | `number`          | `20`   | 每页显示数量（仅在分页模式下生效） |
| `enableVirtualization` | `boolean`         | `true` | 是否启用虚拟滚动                   |
| `groupByCategory`      | `boolean`         | `true` | 是否按类别分组显示                 |
| `maxHeight`            | `number`          | `600`  | 表格最大高度（px）                 |

## 📊 显示模式

### 分页模式 (`enableVirtualization: false`)

- 适用于数据量较小的情况（< 100 条）
- 显示传统的分页控件
- 可自定义每页显示数量
- 页码格式：第 X/Y 页

### 虚拟滚动模式 (`enableVirtualization: true`)

- 适用于大数据量（> 100 条）
- 无分页控件，支持无限滚动
- 自动优化性能
- 状态显示：虚拟滚动模式 - 共 X 条记录

## 🎯 最佳实践

1. **小数据量**（< 50 条）：使用分页模式，`pageSize: 20-30`
2. **中等数据量**（50-200 条）：使用分页模式，`pageSize: 50`
3. **大数据量**（> 200 条）：使用虚拟滚动模式

## 🔄 动态切换

可以根据数据量动态选择模式：

```tsx
const shouldUseVirtualization = shopData.length > 100;

<ShopStatsTable
  data={shopData}
  enableVirtualization={shouldUseVirtualization}
  pageSize={shouldUseVirtualization ? 1000 : 25}
/>;
```

## 📝 注意事项

1. **虚拟滚动模式下**：`pageSize` 参数不生效
2. **分页模式下**：建议 `pageSize` 不超过 100，避免性能问题
3. **分组显示时**：实际显示的行数可能比 `pageSize` 多（包含分组标题行）
4. **页码计算**：基于实际数据行数，不包含分组标题行
