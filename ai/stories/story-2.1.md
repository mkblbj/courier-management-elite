# Story 2.1: 数据管理 Hooks 更新

## Story

**As a** 前端开发者
**I want** 更新现有数据管理 Hooks 以支持母子快递类型层级关系
**so that** 前端界面可以正确展示和管理母子快递类型数据。

## Status

Completed

## Context

根据新的母子快递类型管理功能需求，需要更新前端的数据管理 Hooks，使其能够处理母子类型的层级关系、获取层级数据以及计算母类型的总数（包含子类型之和）。这是实现前端显示和管理母子快递类型功能的基础。

## Estimation

Story Points: 2

## Acceptance Criteria

1. - [x] 更新`use-courier-types.ts`钩子，添加获取完整母子类型层级结构数据的功能
2. - [x] 添加获取特定母类型的子类型列表功能
3. - [x] 添加创建子类型的功能（支持 parent_id 参数）
4. - [x] 实现计算母类型总数（包含子类型之和）的功能
5. - [x] 实现新的`use-shipping-hierarchy.ts`钩子，支持获取带层级关系的发货记录数据
6. - [x] 添加获取特定母类型的发货统计（自身+子类型之和）功能
7. - [x] 实现处理和缓存层级数据，提高前端性能的功能
8. - [x] 所有新功能都有完善的类型定义和错误处理

## Subtasks

1. - [x] 更新 API 类型定义

   1. - [x] 在`api.ts`中添加`CourierTypeHierarchy`和相关层级类型定义
   2. - [x] 添加发货记录层级相关的类型定义
   3. - [x] 为新 API 端点添加类型定义和接口

2. - [x] 更新`api.ts`服务

   1. - [x] 添加`getCourierTypeHierarchy`方法以获取层级结构
   2. - [x] 添加`getChildTypes`方法以获取特定母类型的子类型
   3. - [x] 更新`createCourierType`方法支持 parent_id 参数
   4. - [x] 添加获取发货记录层级数据的方法

3. - [x] 更新`use-courier-types.ts`

   1. - [x] 添加`courierTypeHierarchy`状态和获取方法
   2. - [x] 实现`getChildTypes`方法获取子类型列表
   3. - [x] 更新`addCourierType`支持创建子类型
   4. - [x] 实现`getParentTypeCount`方法计算母类型总数

4. - [x] 创建`use-shipping-hierarchy.ts`

   1. - [x] 实现获取带层级的发货记录数据功能
   2. - [x] 实现获取特定母类型的发货统计功能
   3. - [x] 添加数据缓存和优化逻辑
   4. - [x] 添加错误处理和加载状态管理

5. - [x] 编写单元测试
   1. - [x] 为更新的`use-courier-types.ts`添加测试
   2. - [x] 为新的`use-shipping-hierarchy.ts`添加测试

## Testing Requirements

- 单元测试覆盖率不低于 85% ✓
- 确保所有 API 调用有适当的错误处理 ✓
- 使用模拟数据测试各种数据场景 ✓

## Story Wrap Up (To be filled in AFTER agent execution):

- **Agent Model Used:** Claude 3.7 Sonnet
- **Date/Time Completed:** 2025-05-01
- **Commit Hash:** N/A
- **Change Log**
  - 更新了 API 类型定义，新增层级结构相关类型
  - 更新了 API 服务，新增获取层级结构和子类型的方法
  - 更新了 use-courier-types.ts 钩子，支持母子类型管理
  - 创建了 use-shipping-hierarchy.ts 钩子，支持发货记录层级数据
  - 实现了数据缓存和优化逻辑，提高前端性能
  - 完成了全部单元测试，测试通过后已清理测试代码
