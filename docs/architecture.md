# 快递管理系统架构文档

## 1. 系统概述

快递管理系统是一个用于管理快递公司和发货记录的全栈应用程序。系统分为前端和后端两部分，前端提供用户友好的界面用于数据管理，后端提供API服务支持数据的增删改查操作。

## 2. 技术栈

### 2.1 前端技术栈

- **核心框架**: React (>= 19)
- **构建工具**: Next.js 15.2.4
- **UI库**: 
  - Radix UI (各种组件)
  - Shadcn UI (基于Radix的组件系统)
  - Tailwind CSS (样式)
- **状态管理**: 
  - Zustand
  - React Hook Form (表单管理)
- **类型系统**: TypeScript (>= 5)
- **工具库**:
  - date-fns (日期处理)
  - zod (数据验证)
  - recharts (图表)
  - dnd-kit (拖拽功能)
  - sonner (通知)

### 2.2 后端技术栈

- **运行环境**: Node.js (>= 22.2)
- **Web框架**: Express.js (4.18.2)
- **数据库**: MySQL (>= 8.4)
- **ORM/数据库驱动**: mysql2 (3.6.0)
- **中间件**:
  - cors (跨域资源共享)
  - express-validator (请求验证)
  - dotenv (环境变量管理)
- **开发工具**: nodemon (热重载)

## 3. 系统架构

### 3.1 前端架构

前端采用基于React和Next.js的现代客户端架构，使用TypeScript确保类型安全。

#### 3.1.1 目录结构

- `app/`: Next.js 应用路由和页面
  - `courier-types/`: 快递类型相关页面
  - `shipping-data/`: 发货数据相关页面
  - `layout.tsx`: 应用布局
  - `page.tsx`: 首页
- `components/`: React组件
  - `ui/`: 基础UI组件
  - 业务组件（如`courier-type-management.tsx`）
- `hooks/`: 自定义React钩子
  - `use-courier-types.ts`: 快递类型数据管理
  - `use-shipping-data.ts`: 发货数据管理
- `services/`: API服务层
  - `api.ts`: 通用API服务
  - `shipping-api.ts`: 发货相关API服务
- `lib/`: 通用工具函数
- `styles/`: 样式文件
- `public/`: 静态资源
- `types/`: TypeScript类型定义

#### 3.1.2 状态管理

前端使用以下方式管理状态：

1. **Zustand**: 用于全局状态管理，如环境配置等
2. **React Query/SWR**: 用于API数据获取和缓存
3. **React Hook Form**: 表单状态管理
4. **自定义Hooks**: 封装特定功能的状态逻辑

### 3.2 后端架构

后端采用基于Express.js的RESTful API架构，使用MySQL作为数据存储。

#### 3.2.1 目录结构

- `src/`: 源代码
  - `controllers/`: 控制器
  - `models/`: 数据模型
  - `routes/`: 路由定义
    - `courierRoutes.js`: 快递公司相关路由
    - `shippingRoutes.js`: 发货记录相关路由
  - `middlewares/`: 中间件
  - `db/`: 数据库连接和迁移
  - `utils/`: 工具函数
  - `config.json`: 配置文件
  - `index.js`: 应用入口

#### 3.2.2 API结构

后端API采用RESTful设计原则，主要分为两组：

1. **快递公司API** (`/api/couriers`)
   - 获取、创建、更新、删除快递公司信息
   - 修改快递公司状态与排序

2. **发货记录API** (`/api/shipping`)
   - 获取、创建、更新、删除发货记录
   - 支持批量添加操作
   - 提供筛选与排序功能

### 3.3 数据流动

1. 用户通过前端界面交互
2. 前端组件调用自定义钩子函数
3. 钩子函数调用服务层的API函数
4. API函数发送HTTP请求到后端
5. 后端路由分发请求到相应控制器
6. 控制器处理业务逻辑，调用模型进行数据操作
7. 返回处理结果给前端
8. 前端更新状态，重新渲染组件展示结果

## 4. 部署架构

- 前端：部署在Vercel平台
- 后端：可部署在Node.js支持的服务器环境
- 数据库：MySQL服务器

## 5. 安全性考虑

1. 使用CORS保护API不受未授权的跨域请求
2. 请求验证确保输入数据的合法性
3. 错误处理中间件统一管理错误响应

## 6. 扩展性考虑

1. 模块化设计便于添加新功能
2. 服务层抽象使API调用与UI解耦
3. 环境配置系统支持多环境部署 