# 快递管理系统技术栈文档

本文档详细描述了快递管理系统使用的技术栈、版本要求和开发环境配置。

## 1. 环境要求

项目开发和运行需要以下环境：

- **Node.js**: >= 22.2.0
- **MySQL**: >= 8.4.0
- **npm** 或 **pnpm**: 最新稳定版

## 2. 前端技术栈

### 2.1 核心框架和库

| 技术/库    | 版本      | 用途                             |
| ---------- | --------- | -------------------------------- |
| React      | >= 19.0.0 | 用户界面库                       |
| Next.js    | 15.2.4    | React 框架，用于服务端渲染和路由 |
| TypeScript | >= 5.0.0  | 静态类型检查                     |

### 2.2 UI 组件和样式

| 技术/库      | 版本       | 用途                  |
| ------------ | ---------- | --------------------- |
| Radix UI     | 多个组件库 | 无样式 UI 组件库      |
| Shadcn UI    | -          | 基于 Radix 的组件系统 |
| Tailwind CSS | 3.4.17     | 实用优先的 CSS 框架   |
| Lucide React | 0.454.0    | 图标库                |

### 2.3 状态管理和数据获取

| 技术/库         | 版本   | 用途             |
| --------------- | ------ | ---------------- |
| Zustand         | 最新版 | 轻量级状态管理库 |
| React Hook Form | 7.54.1 | 表单状态管理     |
| Zod             | 3.24.1 | 数据验证         |

### 2.4 工具库

| 技术/库  | 版本   | 用途       |
| -------- | ------ | ---------- |
| date-fns | 4.1.0  | 日期处理   |
| Recharts | 2.15.0 | 图表库     |
| dnd-kit  | 最新版 | 拖拽功能   |
| Sonner   | 1.7.1  | 通知提示库 |

## 3. 后端技术栈

### 3.1 核心框架和库

| 技术/库 | 版本      | 用途              |
| ------- | --------- | ----------------- |
| Node.js | >= 22.2.0 | JavaScript 运行时 |
| Express | 4.18.2    | Web 应用框架      |
| mysql2  | 3.6.0     | MySQL 驱动        |

### 3.2 中间件和工具

| 技术/库           | 版本   | 用途                 |
| ----------------- | ------ | -------------------- |
| cors              | 2.8.5  | 跨域资源共享         |
| express-validator | 7.0.1  | 请求数据验证         |
| dotenv            | 16.3.1 | 环境变量管理         |
| nodemon           | 3.0.1  | 开发时自动重启服务器 |

## 4. 数据库

### 4.1 MySQL 配置

- **版本**: >= 8.4.0
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci

### 4.2 主要数据表

- **courier**: 快递类型信息
- **shipping**: 发货记录

## 5. 开发环境设置

### 5.1 前端开发环境

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install
# 或
pnpm install

# 启动开发服务器
npm run dev
# 或
pnpm dev
```

### 5.2 后端开发环境

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 环境变量配置
cp .env.example .env
# 编辑.env文件设置数据库连接信息

# 运行数据库迁移
npm run migrate

# 启动开发服务器
npm run dev
```

## 6. 构建和部署

### 6.1 前端构建

```bash
cd frontend
npm run build
# 或
pnpm build
```

### 6.2 后端构建和启动

```bash
cd backend
npm start
```

## 7. 版本控制和依赖管理

- 使用 Git 进行版本控制
- 前端使用 package.json 或 pnpm-lock.yaml 锁定依赖版本
- 后端使用 package-lock.json 锁定依赖版本

## 8. 开发工具推荐

- **VS Code**: 推荐的代码编辑器
- **Extensions**:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin (Volar)
  - JavaScript and TypeScript Nightly
  - MySQL 管理工具
