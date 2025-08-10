# Story 1.3: 实现后端获取 Mercari 店铺真实“未处理订单”数量

## Story

**As a** 后端开发者  
**I want** 将 `/api/mercari/shops-overview` 从 Mock 改为真实数据来源（逐店调用 Mercari Shops API 统计未处理订单数）  
**so that** 前端仪表盘能够展示准确的“未处理订单”数量。

## Status

Ready for Development

## Context

- 依据 PRD（docs/mercari/prd.md 1.3）与架构文档（docs/mercari/architecture-mercari.md）。
- Mercari 仅提供“API Personal Access Token (PAT)”用于访问其 API。
  - PAT 必须按店铺维度存储在数据库中，并采用强加密保存；不得在 .env 中硬编码或明文存放。
  - 后端调用 Mercari API 时使用 `Authorization: Bearer <PAT>` 头。
- 要求：
  - 从数据库读取各店铺的加密 PAT（以及可显示的 `mercari_shop_name`）。
  - 在后端解密 PAT，并为每个店铺调用 Mercari Shops API，统计“未处理/待发货”订单数量（参考官方 API 文档的状态筛选与分页规则）。
  - 将统计结果汇总并返回，响应结构与 1.1 同构，确保前端零改动。
- 安全：PAT 仅在后端解密使用，不得下发前端或出现在日志/错误消息中。
- 健壮性：单店失败不影响其他店铺；需要清晰的降级策略与错误标注（内部日志记录）。

最小响应契约（与 1.1 同构）：

```json
{
  "shops": [
    { "shopId": "shop_1", "shopName": "Shop A", "pendingCount": 5 },
    { "shopId": "shop_2", "shopName": "Shop B", "pendingCount": 0 }
  ]
}
```

## Estimation

Story Points: 5

## Acceptance Criteria

1. 数据库与配置

   - [ ] 为既有 `shops` 表新增字段（若不存在）：
     - [ ] `mercari_access_token` TEXT（加密存储，PAT，不得明文）
     - [ ] `mercari_shop_name` VARCHAR(255)（显示用，允许为空）
     - [ ] `last_synced_at` DATETIME（可为空，用于追踪同步时间）
   - [ ] 新增迁移脚本（位于 `backend/src/db/migrations/`），支持回滚
   - [ ] `.env` 仅允许通用配置，严禁存放任何店铺的 PAT：
     - [ ] `MERCARI_ENC_KEY`（32 字节 Base64/Hex，用于 AES-256-GCM 加解密）
     - [ ] `MERCARI_BASE_URL`（可选：自定义网关/代理）
     - [ ] `MERCARI_TIMEOUT_MS`（默认 10000）
     - [ ] `MERCARI_CONCURRENCY`（默认 3）

2. 加解密与安全

   - [ ] 新增/复用 `backend/src/utils/crypto.js`：实现 `encrypt(value) / decrypt(value)`（AES-256-GCM）
   - [ ] 日志/错误输出严禁打印明文 PAT 或解密后的值；必要时仅打印掩码（后 4 位）。

3. Mercari 服务实现（参考官方 API 文档）

   - [ ] 新增 `backend/src/services/mercari.service.js`：
     - [ ] `fetchPendingCountForShop({ mercari_access_token, mercari_shop_name }): Promise<number>`
       - 使用 `Authorization: Bearer <PAT>` 调用订单列表 API，按官方状态筛选“未处理/待发货”订单；如需分页则遍历聚合。
     - [ ] `fetchShopsOverview(): Promise<{ shops: { shopId, shopName, pendingCount }[] }>`
       - 读取启用店铺（`shops.is_active=1`）且存在 `mercari_access_token` 的店铺
       - 解密 PAT，按并发上限调用统计数量
       - 对单店失败进行隔离（记 0），内部记录错误，不中断整体
       - 对 HTTP 错误与超时采用指数退避重试（最多 2 次）

4. 控制器与路由

   - [ ] 更新 `backend/src/controllers/MercariController.js#getShopsOverview` 调用真实 `mercari.service`
   - [ ] 响应包装 `{ code, message, data }` 不变，`data` 字段遵循契约（与 1.1 同构）

5. 测试

   - [ ] 单元测试：
     - [ ] `crypto` 工具加/解密正常
     - [ ] `mercari.service` 在成功、失败、超时、重试等场景下行为正确（HTTP 调用使用 `nock` 或等效方式 mock），并验证 `Authorization: Bearer <PAT>` 头
   - [ ] 集成测试：
     - [ ] `GET /api/mercari/shops-overview` 返回 200 与契约字段
     - [ ] 注入若干店铺（含一个缺失/错误 PAT 的场景），验证其他店铺不受影响

6. 性能与稳定性

   - [ ] 对并发做上限控制（默认 3，可通过 env 调整）
   - [ ] 每次请求设置超时（默认 10s）
   - [ ] 可选：在服务层对结果添加短期缓存（例如 30s）以减少外部压力（说明缓存失效策略）

7. 文档与运维
   - [ ] `docs/mercari/` 新增/更新：
     - [ ] PAT 的加密与存储要求、轮换策略与过期处理（401 需刷新 PAT）
     - [ ] `.env` 配置项说明（不含 PAT）
     - [ ] 错误处理与降级策略
   - [ ] 在 `docs/api/mercari.md`（或等效文档）更新 `/shops-overview` 为“真实数据”说明与错误语义

## Subtasks

1. 数据库迁移

   - [ ] 在 `backend/src/db/migrations/` 新增迁移文件：添加 `mercari_access_token`、`mercari_shop_name`、`last_synced_at` 并支持回滚

2. 加解密工具

   - [ ] 新建/复用 `backend/src/utils/crypto.js`，实现 AES-256-GCM `encrypt/decrypt`

3. Mercari API 客户端

   - [ ] 在 `backend/src/services/mercari.service.js` 实现：
     - [ ] 读取启用店铺并过滤存在 PAT 的记录
     - [ ] 解密 PAT，按店铺调用订单 API 统计“未处理/待发货”数量（含分页聚合）
     - [ ] 汇总为 `{ shops: [...] }` 返回

4. 控制器接线

   - [ ] 修改 `MercariController#getShopsOverview`：从 service 获取真实数据并返回

5. 测试

   - [ ] `jest` 单测（crypto、service）与集成测试（路由），覆盖率 ≥ 项目基线（≥85%）

6. 配置与文档
   - [ ] `.env.example` 增加通用配置项（不包含 PAT）
   - [ ] 文档更新（PAT 加密、并发与重试、错误策略、401 处理与轮换）

## Testing Requirements

- 单元测试覆盖率 ≥ 85%
- service 在以下场景下应返回合理结果：
  - 正常：多店铺均返回正确的 `pendingCount`
  - 单店失败：整体返回 200，失败店铺 `pendingCount`=0；日志中记录错误
  - 重试：首次失败、重试成功；多次失败最终记为失败
  - 超时：按超时策略处理并计为失败
  - 401 未授权：识别为 PAT 失效，记失败并记录需轮换
- 集成测试：
  - `GET /api/mercari/shops-overview` 返回 `{ code: 0, data: { shops: [...] } }`
  - 至少 1 家 `pendingCount=0` 用于前端空态分支

## Notes

- 参考 Mercari 官方 API 文档中订单查询端点与状态枚举，确定“未处理/待发货”状态筛选参数；若需分页，遍历累计；注意速率限制（429）与退避策略。
- 建议使用 axios 统一设置超时、重试；必要时加断路器与短期缓存。
- PAT 生命周期与轮换：建议在文档中说明轮换流程；当服务检测到 401/403 时给出内部告警提示。

## Story Wrap Up (To be filled in AFTER agent execution)

- **Agent Model Used:** `<Agent Model Name/Version>`
- **Agent Credit or Cost:** `<Cost/Credits Consumed>`
- **Date/Time Completed:** `<Timestamp>`
- **Commit Hash:** `<Git Commit Hash of resulting code>`
- **Change Log**
  - 新增迁移脚本与 `.env` 通用配置项（无 PAT）
  - 新增 `utils/crypto.js` 与 `services/mercari.service.js`
  - 修改 `MercariController#getShopsOverview` 使用真实数据
  - 新增/更新 API 文档与使用说明（PAT 加密/轮换）
  - 增加单元/集成测试
