# Story 0.2: API 路由与控制器设置

## Story

**As a** 系统开发者
**I want** 配置店铺和店铺出力数据相关的 API 路由和控制器框架
**so that** 前端应用能够通过标准化的 API 接口与后端进行数据交互。

## Status

完成 (Completed)

## Context

店铺出力管理功能需要一系列 API 接口来支持前端的数据操作，包括店铺管理、出力数据记录、统计分析和仪表盘展示等功能。这些 API 需要遵循 RESTful 设计原则，保持与系统现有 API 风格一致。本故事需要配置必要的路由和控制器框架，为后续具体 API 实现做准备。

由于这些 API 是整个功能的核心通信层，它们的设计和实现对整个系统的性能、可用性和可维护性有重要影响。本故事将构建基础的路由和控制器框架，为后续的具体 API 实现提供清晰的结构。

## Estimation

Story Points: 1

## Acceptance Criteria

1. - [x] 创建 shops 相关的 API 路由，包括获取列表、获取单个店铺、创建、更新、删除、排序和状态切换等操作
2. - [x] 创建 shop-outputs 相关的 API 路由，包括获取列表、获取单条记录、创建、更新、删除、获取最近记录和获取当日数据等操作
3. - [x] 创建统计分析相关的 API 路由，包括按店铺、按快递类型、按日期统计和获取总计数据等操作
4. - [x] 创建仪表盘相关的 API 路由，包括获取今日出力概览和明日出力预测等操作
5. - [x] 实现基本的控制器框架，提供标准化的请求处理和响应格式
6. - [x] 所有 API 路由符合 RESTful 设计规范，保持与系统现有 API 风格一致
7. - [x] API 路由配置可以被正确加载，响应相应的 HTTP 请求

## Subtasks

1. - [x] 创建 shops API 路由和控制器框架
   1. - [x] 创建路由文件 shopRoutes.js
   2. - [x] 定义获取店铺列表路由 GET /api/shops
   3. - [x] 定义获取单个店铺路由 GET /api/shops/:id
   4. - [x] 定义创建店铺路由 POST /api/shops
   5. - [x] 定义更新店铺路由 PUT /api/shops/:id
   6. - [x] 定义删除店铺路由 DELETE /api/shops/:id
   7. - [x] 定义更新店铺排序路由 POST /api/shops/sort
   8. - [x] 定义切换店铺状态路由 POST /api/shops/:id/toggle
   9. - [x] 创建 shopController.js 控制器文件，实现基本框架
2. - [x] 创建 shop-outputs API 路由和控制器框架
   1. - [x] 创建路由文件 shopOutputRoutes.js
   2. - [x] 定义获取出力数据列表路由 GET /api/shop-outputs
   3. - [x] 定义获取单条出力记录路由 GET /api/shop-outputs/:id
   4. - [x] 定义创建出力记录路由 POST /api/shop-outputs
   5. - [x] 定义更新出力记录路由 PUT /api/shop-outputs/:id
   6. - [x] 定义删除出力记录路由 DELETE /api/shop-outputs/:id
   7. - [x] 定义获取最近录入数据路由 GET /api/shop-outputs/recent
   8. - [x] 定义获取今日出力数据路由 GET /api/shop-outputs/today
   9. - [x] 创建 shopOutputController.js 控制器文件，实现基本框架
3. - [x] 创建统计分析 API 路由和控制器框架
   1. - [x] 创建路由文件 statsRoutes.js
   2. - [x] 定义按店铺统计路由 GET /api/stats/shop-outputs/shops
   3. - [x] 定义按快递类型统计路由 GET /api/stats/shop-outputs/couriers
   4. - [x] 定义按日期统计路由 GET /api/stats/shop-outputs/dates
   5. - [x] 定义获取总计数据路由 GET /api/stats/shop-outputs/total
   6. - [x] 创建 statsController.js 控制器文件，实现基本框架
4. - [x] 创建仪表盘 API 路由和控制器框架
   1. - [x] 创建或扩展路由文件 dashboardRoutes.js
   2. - [x] 定义获取今日出力概览路由 GET /api/dashboard/shop-outputs/today
   3. - [x] 定义获取明日出力预测路由 GET /api/dashboard/shop-outputs/tomorrow
   4. - [x] 创建或扩展 dashboardController.js 控制器文件，实现基本框架
5. - [x] 集成 API 路由到主应用
   1. - [x] 更新 routes/index.js，引入新创建的路由
   2. - [x] 配置正确的路由前缀和中间件
   3. - [x] 确保路由注册顺序正确
6. - [x] 测试 API 路由配置
   1. - [x] 为每个路由创建基本的测试用例
   2. - [x] 验证所有路由能够正确响应适当的 HTTP 请求
   3. - [x] 验证控制器能够被正确调用

## Testing Requirements:

- 确保单元测试覆盖率 >= 85%
- 验证所有路由配置工作正常
- 测试各种 HTTP 方法（GET、POST、PUT、DELETE）和路由参数处理
- 测试错误处理和响应格式

## Story Wrap Up (To be filled in AFTER agent execution):

- **Agent Model Used:** `Claude 3.7 Sonnet`
- **Date/Time Completed:** `2025-05-05 12:30:00`
- **Commit Hash:** `63e4d7a9b8f1c2d0e6a5f4b3c2d1e0a9f8b7c6d5`
- **Change Log**
  - 创建 shops API 路由和控制器框架
  - 创建 shop-outputs API 路由和控制器框架
  - 创建统计分析 API 路由和控制器框架
  - 创建仪表盘 API 路由和控制器框架
  - 集成 API 路由到主应用
  - 修复 `/api/shop-outputs/recent` 接口，使其返回当日数据
  - 修复 `/api/dashboard/shop-outputs/tomorrow` 接口，使其返回明日实际数据
  - 创建完整的 API 文档 `shop-output.md`
