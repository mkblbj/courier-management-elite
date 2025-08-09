# Mercari 工具 API 文档（占位）

- 基础路径：`/api/mercari`
- 版本：v1（Mock 契约）
- 鉴权：应与现有系统保持一致（Authorization 头等）。当前项目未发现统一鉴权中间件，后续接入后本端点将默认受保护。

## 1) GET /api/mercari/shops-overview

返回所有已配置店铺的“未处理订单数”概览（当前为 Mock 数据，后续替换为真实数据，响应同构）。

- 方法：GET
- 鉴权：建议 `Authorization: Bearer <token>`（占位）
- 响应格式：统一包装 `{ code, message, data }`

示例请求（curl）

```bash
curl -s \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  http://localhost:<PORT>/api/mercari/shops-overview
```

示例响应（200）

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

错误响应（500）

```json
{
  "code": 500,
  "message": "获取 Mercari 店铺概览失败"
}
```

### 字段说明

- `data.shops[].shopId`：店铺唯一标识（字符串）
- `data.shops[].shopName`：店铺名称（字符串）
- `data.shops[].pendingCount`：未处理订单数量（整数）

---

## 后续端点（规划占位）

以下接口将在后续故事实现，响应将与 PRD/架构文档保持同构：

- GET `/api/mercari/shops/:shopId/orders`

  - 描述：返回指定店铺的所有“未处理”订单详情列表（真实数据）
  - 鉴权：与系统一致

- POST `/api/mercari/process-orders`
  - 描述：对勾选订单执行生成 Click Post CSV 或打印面单等动作
  - 请求体：`{ shopId: string, orderIds: string[], action: "generate_csv" | "generate_slips" }`
  - 响应：
    - generate_csv: `{ downloadUrl: string }`
    - generate_slips: `{ pageUrl: string }`

注：密钥解密与外部 API 调用均在后端执行，绝不在前端暴露。
