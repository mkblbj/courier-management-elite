# Story 1.2: 创建 Mercari 工具的前端仪表盘页面

## Story

**As a** 前端开发者  
**I want** 创建一个新页面 `/mercari-tool` 展示所有已配置的 Mercari 店铺及其未处理订单数（调用故事 1.1 的 Mock 接口）  
**so that** 用户可以在统一入口查看店铺概览并跳转到店铺详情页。

## Status

Ready for Development

## Context

- 依据 PRD（docs/mercari/prd.md 1.2），本故事依赖后端契约：`GET /api/mercari/shops-overview`（已在故事 1.1 提供 Mock，后续替换为真实实现）。
- 前端框架为 Next.js App Router，路由应放置在 `frontend/app/mercari-tool/page.tsx`。
- 统一通过前端 API 服务封装访问后端。参考现有 `frontend/services/*` 模式，新建 `frontend/services/mercari-api.ts`。
- 首次落地需包含加载态、错误态、空态，确保后续后端替换为真数据时“零改动”。

最小数据契约（同构）：

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "shops": [
      { "shopId": "shop_1", "shopName": "Shop A", "pendingCount": 5 },
      { "shopId": "shop_2", "shopName": "Shop B", "pendingCount": 0 }
    ]
  }
}
```

## Estimation

Story Points: 2

## Acceptance Criteria

1. 路由与页面

   - [ ] 新增路由 `/mercari-tool`，页面文件为 `frontend/app/mercari-tool/page.tsx`
   - [ ] 页面标题显示“Mercari 店铺仪表盘”（或等价文案）

2. 数据拉取与展示

   - [ ] 页面加载时请求 `GET /api/mercari/shops-overview`
   - [ ] 成功时展示店铺列表：`shopName` 与 `pendingCount`
   - [ ] `pendingCount` 显示为醒目徽标/Badge（0 显示灰/弱化，>0 显示强调色）
   - [ ] 空列表时显示空态占位（含“暂无店铺/暂无数据”文案）

3. 交互与导航

   - [ ] 点击某条店铺行可跳转到 `/mercari-tool/[shopId]`（后续故事实现详情页）
   - [ ] 列表支持基础的可访问性（可键盘聚焦、回车触发导航）

4. 加载与错误处理

   - [ ] 请求中显示骨架屏/Spinner
   - [ ] 请求失败显示错误卡片，包含“重试”按钮

5. 代码组织与类型
   - [ ] 新建 `frontend/services/mercari-api.ts` 封装请求，复用 `getBaseApiUrl`/`fetchWithErrorHandling`
   - [ ] 新建 `frontend/types/mercari.ts`（或放到 `frontend/types/`）定义 `MercariShopOverview` 类型
   - [ ] 组件内保持类型安全（TS）

## Subtasks

1. 服务层

   - [ ] 新建 `frontend/services/mercari-api.ts`
     - 导出 `getShopsOverview(): Promise<{ shops: MercariShopOverview[] }>`
     - 使用现有 `getBaseApiUrl()` 组装 URL：`/api/mercari/shops-overview`
     - 通过 `fetchWithErrorHandling` 处理 `{ code, message, data }` 包装

2. 类型

   - [ ] 新建 `frontend/types/mercari.ts`
     - `export interface MercariShopOverview { shopId: string; shopName: string; pendingCount: number }`

3. 页面组件

   - [ ] 新建 `frontend/app/mercari-tool/page.tsx`
     - 首屏加载触发 `getShopsOverview`
     - 渲染列表卡片（使用 shadcn/ui Button/Card/Badge 等现有依赖）
     - 支持加载中/错误/空态
     - 为每个店铺行绑定 `router.push('/mercari-tool/' + shopId)`

4. UI 细节

   - [ ] 列表项：左侧店铺名，右侧未处理数量徽标；可选右侧箭头图标
   - [ ] 将零数量弱化；正数高亮
   - [ ] 页面留出后续操作按钮（同步订单等）的占位区域（禁用态）

5. 文档
   - [ ] 在 `docs/mercari/` 更新/追加一段“前端仪表盘页面（/mercari-tool）”说明，含数据来源与导航逻辑（占位）

## Testing Requirements

- 组件测试（建议）：
  - [ ] 渲染加载态与错误态用例
  - [ ] 成功拉取后渲染店铺列表用例
  - [ ] 点击店铺行触发 `router.push` 的用例
- E2E（可选，若有 Playwright/Cypress）：
  - [ ] 访问 `/mercari-tool` 能看到 Mock 数据渲染

> 说明：本仓库当前未见前端测试配置，如暂不具备条件，可在后续任务补齐。

## Notes

- 统一通过前端代理或直连由 `getBaseApiUrl()` 控制，无需在组件内关心代理细节。
- 遵循现有 UI 与代码风格；尽量使用已引入的 shadcn/ui 组件。
- 预留“同步订单”“生成 CSV”“打印面单”按钮区域但保持禁用，这些在后续故事激活。
- 对于国际化与多语言展示，先以中文/英文占位文案实现，后续统一接入 i18n。

## Story Wrap Up (To be filled in AFTER agent execution)

- **Agent Model Used:** `<Agent Model Name/Version>`
- **Agent Credit or Cost:** `<Cost/Credits Consumed>`
- **Date/Time Completed:** `<Timestamp>`
- **Commit Hash:** `<Git Commit Hash of resulting code>`
- **Change Log**
  - 新增 `frontend/app/mercari-tool/page.tsx`
  - 新增 `frontend/services/mercari-api.ts`
  - 新增 `frontend/types/mercari.ts`
  - 更新 `docs/mercari/` 增加页面说明
