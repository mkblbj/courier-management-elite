# 环境变量配置指南

本文档详细说明了系统中使用的所有环境变量，以及它们的配置方法和用途。

## 前端环境变量

前端应用使用以下环境变量进行配置。创建`.env.local`（本地开发）或`.env`（生产环境）文件，并包含以下配置：

### API 连接配置

```bash
# API基础URL配置
# 直接访问后端API的URL（当禁用代理时使用）
NEXT_PUBLIC_API_BASE_URL=http://your-api-server:3000

# 内部API URL配置（用于代理模式，可以访问非公开网络）
# 服务器端访问的内部API URL，不会暴露给客户端
INTERNAL_API_URL=http://backend:3000

# 是否启用API代理，解决混合内容问题
# 设置为'true'以启用代理，任何其他值或不设置则禁用代理
NEXT_PUBLIC_USE_API_PROXY=true
```

### 安全与开发配置

```bash
# 允许的开发源配置（用于开发环境的跨域请求）
# 格式为逗号分隔的域名或IP列表
# 例如: localhost,example.com,192.168.1.100
ALLOWED_ORIGINS=localhost,your-domain.com

# 调试模式开关
# 设置为'true'启用详细日志，生产环境应设为'false'
NEXT_PUBLIC_DEBUG=false
```

## 环境变量说明

### `NEXT_PUBLIC_API_BASE_URL`

- **用途**：配置前端直接访问后端 API 的基础 URL
- **格式**：完整的 URL，包括协议（http/https）
- **示例**：`http://api.example.com` 或 `https://api.courier-service.com`
- **注意**：如果启用了代理模式，此 URL 仅作为备用

### `INTERNAL_API_URL`

- **用途**：配置内部（服务器端）API 访问地址，用于代理模式
- **格式**：完整的 URL，通常是内部服务网络地址
- **示例**：`http://backend:3000` 或 `http://192.168.1.100:3000`
- **注意**：此变量仅在服务器端使用，不会暴露给浏览器

### `NEXT_PUBLIC_USE_API_PROXY`

- **用途**：控制是否启用 API 代理功能
- **值**：
  - `true`：启用代理，解决 HTTPS 前端访问 HTTP API 的混合内容问题
  - 其他值或不设置：禁用代理，直接访问 API

### `ALLOWED_ORIGINS`

- **用途**：配置 Next.js 开发服务器允许的跨域请求源
- **格式**：逗号分隔的域名或 IP 列表
- **示例**：`localhost,courier-admin.local,dev.example.com`
- **默认值**：如果不设置，默认为`['localhost', '.local', 'host.docker.internal']`

### `NEXT_PUBLIC_DEBUG`

- **用途**：控制是否启用详细的调试日志
- **值**：
  - `true`：启用详细日志
  - `false`：禁用详细日志（推荐用于生产环境）

## 环境变量在代码中的使用

在 Next.js 配置文件`next.config.mjs`中：

```javascript
experimental: {
  // 使用环境变量配置或默认使用更通用的配置
  allowedDevOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['localhost', '.local', 'host.docker.internal'],
},
```

在 API 代理文件中：

```javascript
// 优先使用INTERNAL_API_URL，如果未设置则尝试使用NEXT_PUBLIC_API_BASE_URL
let apiUrl =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
```

## Docker 环境配置

当使用 Docker 部署时，可以在`docker-compose.yml`文件中设置环境变量：

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  environment:
    NEXT_PUBLIC_API_BASE_URL: ${NEXT_PUBLIC_API_BASE_URL:-http://backend:3000}
    INTERNAL_API_URL: ${INTERNAL_API_URL:-http://backend:3000}
    NEXT_PUBLIC_USE_API_PROXY: ${NEXT_PUBLIC_USE_API_PROXY:-true}
    ALLOWED_ORIGINS: ${ALLOWED_ORIGINS:-localhost,courier-service.com}
```

## 最佳实践

1. 永远不要在代码中硬编码 IP 地址或域名
2. 对于不同环境（开发、测试、生产），使用不同的环境变量配置
3. 敏感信息只使用非`NEXT_PUBLIC_`前缀的环境变量，避免暴露给客户端
4. 在生产环境中禁用调试日志
5. 在版本控制系统中包含`.env.example`文件，但不要包含实际的`.env`文件
