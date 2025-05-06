# 店铺出力管理前端组件说明

本文档记录了店铺出力管理功能的前端组件和路由实现情况。

## 目录结构

```
frontend/
├── app/
│   ├── courier-types/          # 快递类型管理页面（已添加店铺管理标签页）
│   │   └── page.tsx
│   ├── output-data/            # 出力数据管理页面
│   │   ├── components/         # 出力数据组件
│   │   │   ├── FilterPanel.tsx # 筛选面板
│   │   │   ├── OutputForm.tsx  # 出力数据表单
│   │   │   ├── OutputList.tsx  # 出力数据列表
│   │   │   └── OutputSummary.tsx # 出力数据汇总
│   │   └── page.tsx
│   └── stats/                  # 统计页面（已添加出力统计标签页）
│       └── page.tsx
├── components/
│   ├── shop/                   # 店铺管理组件
│   │   ├── ShopForm.tsx        # 店铺表单
│   │   ├── ShopList.tsx        # 店铺列表
│   │   └── ShopSortModal.tsx   # 店铺排序模态框
│   └── shop-output/            # 出力数据公共组件
│       ├── DateSelector.tsx    # 日期选择器
│       └── ShopSelector.tsx    # 店铺选择器
└── lib/
    ├── api/                    # API服务
    │   ├── shop.ts             # 店铺API服务
    │   └── shop-output.ts      # 出力数据API服务
    ├── types/                  # 类型定义
    │   ├── shop.ts             # 店铺类型
    │   └── shop-output.ts      # 出力数据类型
    ├── constants.ts            # 常量定义
    └── utils.ts                # 工具函数
```

## 主要功能

### 1. 店铺管理

- 店铺列表展示
- 店铺添加/编辑/删除
- 店铺状态切换
- 店铺排序

### 2. 出力数据管理

- 出力数据列表展示
- 出力数据筛选（按店铺、日期等）
- 出力数据添加/编辑/删除
- 出力数据汇总统计（按店铺、快递类型、日期等维度）

## 路由说明

- `/courier-types` 页面添加了店铺管理标签页
- `/output-data` 新增页面用于出力数据管理
- `/stats` 页面添加了出力数据统计标签页

## 注意事项

1. 快递类型选择器尚未实现，目前在表单中硬编码为"顺丰速运"，后续需要实现
2. 店铺排序模态框使用了`@dnd-kit`库实现拖拽排序功能，需要安装相关依赖：
   ```
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers
   ```
3. 所有 API 服务均已按照 API 文档实现，但未经实际连接测试
4. 表单验证使用`zod`库实现

## 后续工作

1. 实现快递类型选择器
2. 连接后端 API 并进行测试
3. 完善错误处理和加载状态
4. 添加单元测试
5. 优化移动端适配
