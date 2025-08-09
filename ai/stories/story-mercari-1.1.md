# Story 1.1: Mercari 工具后端 API 基础结构（Mock）

## Story

**As a** 前后端协作开发者  
**I want** 提供一个受鉴权保护的后端只读接口 GET /api/mercari/shops-overview，先返回硬编码的模拟数据  
**so that** 前端可以并行开发仪表盘页面并锁定通信契约，后续可无缝替换为真实数据源。

## Status

Ready for Development

## Context

- 本故事仅建立“通信契约”，返回固定的 Mock 数据，不进行任何 Mercari API 调用与数据库访问。
- 路由前缀：`/api/mercari`；核心端点：`GET /api/mercari/shops-overview`。
- 代码位置（后端）：在现有后端项目中新增 `src/api/mercari/` 模块，包含 `router`、`controller`、`service` 三层结构，遵循项目现有的 TS/JS 约定与中间件风格。
- 必须套用现有的用户鉴权/授权中间件，保持与系统一致的安全策略；绝不向前端暴露任何密钥。
- 响应体必须与后续真实实现保持同构，确保前端零改动即可切换。

最低通信契约（示例）：

```json
{
  "shops": [
    { "shopId": "shop_1", "shopName": "Shop A", "pendingCount": 5 },
    { "shopId": "shop_2", "shopName": "Shop B", "pendingCount": 0 }
  ]
}
```

## Estimation

Story Points: 1

## Acceptance Criteria

1. 路由与文件结构

   - [ ] 在 `src/api/mercari/` 下创建：
     - [ ] `mercari.router.(ts|js)` 定义路由前缀 `/api/mercari`
     - [ ] `mercari.controller.(ts|js)` 实现控制器方法 `getShopsOverview`
     - [ ] `mercari.service.(ts|js)` 返回硬编码 Mock 数据 `getShopsOverview`
   - [ ] 将 `mercari.router` 注册到主应用路由聚合处，实际可访问路径为 `GET /api/mercari/shops-overview`

2. 鉴权与中间件

   - [ ] `GET /shops-overview` 套用现有鉴权/授权中间件（与项目一致）
   - [ ] 全链路遵循现有错误处理与日志规范（若项目有统一响应格式，则沿用）

3. 响应契约（Mock）

   - [ ] 返回 HTTP 200，`Content-Type: application/json`
   - [ ] 响应体含字段 `shops: Array<{ shopId: string; shopName: string; pendingCount: number }>`
   - [ ] 字段命名、大小写、数据类型与上述“最低通信契约”严格一致

4. 质量与可维护性

   - [ ] 单元测试：对 service 与 controller 进行测试，覆盖率达项目基线（≥ 85%）
   - [ ] 集成测试：使用 supertest（或项目现有方案）验证 `GET /api/mercari/shops-overview` 200 与响应结构
   - [ ] 通过现有 Linter/Formatter（ESLint/Prettier 等）与类型检查（若为 TS）

5. 文档
   - [ ] 在 `docs/` 或现有 API 文档处新增/更新 Mercari 概览接口说明，包含：路径、鉴权、请求示例、响应示例与字段释义
   - [ ] 说明后续会以真实数据替换，但保证响应同构

## Subtasks

1. 文件与路由接线

   - [ ] 创建 `src/api/mercari/mercari.service.(ts|js)`，导出 `getShopsOverview()` 返回硬编码数组
   - [ ] 创建 `src/api/mercari/mercari.controller.(ts|js)`，调用 service 并返回 JSON
   - [ ] 创建 `src/api/mercari/mercari.router.(ts|js)`，注册 `GET /shops-overview`
   - [ ] 在主路由聚合文件中 `app.use('/api/mercari', mercariRouter)`（或等效方式）

2. 中间件与错误处理

   - [ ] 为路由应用现有鉴权中间件（如 `requireAuth`）
   - [ ] 保持与项目一致的错误处理与日志记录

3. 测试

   - [ ] 单测（service）：断言返回数组结构、字段类型正确
   - [ ] 单测（controller）：断言状态码与响应形状
   - [ ] 集成测试：supertest 发起 `GET /api/mercari/shops-overview` 断言 200 与契约匹配

4. 文档与示例

   - [ ] 在 `docs/API/mercari.md`（或现有 API 文档集合）新增条目“GET /api/mercari/shops-overview（Mock）”
   - [ ] 给出请求与响应示例，说明用途、鉴权、限流（若有）

5. 验收与示范
   - [ ] 本地运行后端，手动 curl：`curl -H "Authorization: Bearer <token>" http://localhost:<port>/api/mercari/shops-overview`
   - [ ] 截图/粘贴示例响应到 PR 或故事 Wrap Up

## Testing Requirements:

- 单元测试覆盖率 ≥ 85%（新增文件）
- 集成测试覆盖 happy-path 与鉴权失败场景
- 校验响应字段类型、命名与顺序（若前端严格依赖）
- Lint 与类型检查必须通过；CI 需绿灯

## Notes

- 本故事不触达外部网络与数据库；仅返回硬编码数据，确保可预测性与前端并行开发
- 后续替换为真实实现时，必须保持响应同构（字段、大小写、可选性）
- 若项目有统一响应包装（如 `{ code, data }`），在本故事中保持一致并更新前端契约说明
- 建议 Mock 数据包含 ≥2 家店铺，至少一条 `pendingCount = 0` 用于前端空态分支

## Story Wrap Up (To be filled in AFTER agent execution):

- **Agent Model Used:** `<Agent Model Name/Version>`
- **Agent Credit or Cost:** `<Cost/Credits Consumed>`
- **Date/Time Completed:** `<Timestamp>`
- **Commit Hash:** `<Git Commit Hash of resulting code>`
- **Change Log**
  - 新增 `src/api/mercari/mercari.{router,controller,service}`
  - 路由挂载 `/api/mercari`，实现 `GET /shops-overview`（Mock）
  - 新增/更新 API 文档 `docs/API/mercari.md`
  - 添加单元与集成测试，CI 通过
