项目名称: Mercari Shops 订单处理与面单打印工具
版本: 1.0

日期: 2025 年 8 月 9 日

作者: Winston (架构师)

1. 简介与目标
   本文档旨在为在现有系统 (courier.uoworld.co.jp/) 中集成一个多店铺 Mercari 订单处理工具提供全面的架构设计。该工具的核心目标是自动化订单同步、Click Post CSV 文件生成和自定义发货面单的打印流程，以提升运营效率和准确性。

这是一个“棕地”(Brownfield)增强项目，所有设计都优先考虑与现有系统的无缝集成、安全性和可扩展性。

2. 现有系统分析
   前端: 基于 React 和 TypeScript 的单页应用 (SPA)，使用 Vite 构建，并采用 Tailwind CSS 进行样式设计。

后端: 基于 Node.js 的 API 服务。

数据库: 现有数据库中已包含一个管理店铺的表，其中含有 shop_id 和 shop_name 字段。

3. 集成策略与数据流
   新功能将作为现有系统的内嵌模块，采用前后端分离的“安全代理”模式。

数据流:

前端 (React) 发出操作请求 (例如，同步指定店铺的订单)。

后端 (Node.js) 接收请求，从数据库中获取对应店铺的已加密 API 密钥。

后端 解密密钥后，安全地调用 Mercari Shops API。

后端 对返回的数据进行处理，生成所需的文件（CSV 和面单）。

后端 将成功状态和文件链接返回给 前端。

前端 更新 UI，用户可下载或打印文件。

核心原则: 用户的 Mercari API 密钥等敏感信息，绝不暴露于前端浏览器中。

4. 技术栈校准
   遵循现有技术: 新功能将完全使用现有的技术栈（React, TypeScript, Node.js）进行开发。

新增库: 经您同意，后端将引入以下轻量级库以提高效率和稳定性：

HTTP 客户端 (如 axios): 用于稳定地调用 Mercari API。

CSV 生成库 (如 csv-stringify): 用于精确生成 Click Post 所需的 CSV 文件。

5. 数据模型与数据库变更
   采用“有状态”模式: 为了支持多店铺管理，我们将在数据库中存储 API 配置。

数据库表变更: 针对您现有的店铺管理表，建议新增以下字段：

mercari_api_key (类型: TEXT 或 VARCHAR): 必须以加密形式存储。

mercari_shop_name (类型: VARCHAR): 用于在 UI 上显示店铺名。

last_synced_at (类型: DATETIME, 可选): 用于记录上次同步时间，便于追踪。

6. 组件与 API 架构
   后端模块:

MercariRouter: 定义 GET /api/mercari/shops-overview 和 POST /api/mercari/process-orders 两个核心路由。

MercariController: 处理来自路由的请求。

MercariService: 实现所有核心业务逻辑（调用 API、处理数据等）。

前端组件:

ShopsDashboardPage.tsx: 仪表盘页面 (/mercari-tool)，展示所有店铺及其未处理订单数。

SingleShopPage.tsx: 单店铺详情页 (/mercari-tool/:shopId)，包含操作按钮。

mercariApiService.ts: 封装所有与后端 API 的通信。

API 端点设计:

GET /api/mercari/shops-overview: 获取所有店铺及其未处理订单数，用于驱动仪表盘页面。

POST /api/mercari/process-orders: 针对指定店铺执行订单处理。请求体需包含 { "shopId": "..." }。

7. 源码树集成 (文件结构)
   新文件将模块化地添加入您现有的项目中，以保持结构清晰。

后端 (Node.js): 在 /src/api/ 目录下新增 /mercari 文件夹，包含 router, controller, service 三个文件。

前端 (React): 在 /src/pages/ 目录下新增 /mercari 文件夹，包含两个页面组件；在 /src/services/ 目录下新增 mercariApiService.ts 文件。

8. 关键安全要求
   API 密钥加密: 存入数据库的 mercari_api_key 必须使用强加密算法（如 AES-256）进行加密。

访问控制: 新增的后端 API 端点必须受到与您现有系统相同的用户认证和授权保护，确保只有登录的授权用户才能访问。
