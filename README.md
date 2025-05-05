# 快递管理系统 (Courier Management System)

![快递管理系统](https://img.shields.io/badge/状态-开发中-brightgreen)

一个现代化的快递管理系统，用于记录、统计和管理各类快递的发货数据。系统支持多种快递类型管理、数据筛选、单条与批量录入等功能，界面简洁直观，操作便捷高效。

## 📋 功能特点

- **快递类型管理**：添加、编辑、激活/停用各种快递类型
- **发货数据录入**：支持单条录入和批量录入两种模式
- **灵活的数据筛选**：按日期范围、快递类型等多种条件筛选数据
- **数据可视化**：直观展示发货数据统计和趋势
- **响应式设计**：完美适配桌面端和移动端设备
- **实时更新**：数据变更实时反映在界面上

## 🛠️ 技术栈

### 前端

- **Next.js** - React 框架，用于构建用户界面
- **TypeScript** - 提供类型安全的 JavaScript 超集
- **Tailwind CSS** - 高度可定制的 CSS 框架
- **shadcn/ui** - 基于 Radix UI 的高质量组件库
- **React Hook Form** - 表单处理和验证
- **date-fns** - 日期处理工具库
- **Zod** - TypeScript 优先的验证库

### 后端

- **Node.js** - JavaScript 运行环境
- **Express** - Web 应用框架
- **MySQL** - 关系型数据库
- **TypeORM** - ORM 库，用于数据库操作
- **JWT** - 用户认证

## 📁 项目结构

```
courier-backend/
├── frontend/             # 前端代码
│   ├── app/              # Next.js页面和路由
│   ├── components/       # 通用组件
│   ├── hooks/            # 自定义React钩子
│   ├── lib/              # 工具函数和配置
│   └── services/         # API服务
├── backend/              # 后端代码
│   ├── controllers/      # 控制器
│   ├── models/           # 数据模型
│   ├── routes/           # API路由
│   ├── services/         # 业务逻辑
│   └── utils/            # 工具函数
└── docs/                 # 文档
```

## 🚀 快速开始

### 前置要求

- Node.js (v16+)
- MySQL (v8+)
- npm 或 yarn

### 安装步骤

1. 克隆项目

```bash
git clone https://github.com/yourusername/courier-backend.git
cd courier-backend
```

2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

3. 配置环境变量

复制`.env.example`文件为`.env`并根据您的环境进行配置

```bash
cp .env.example .env
```

4. 启动开发服务器

```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务（在新终端中）
cd frontend
npm run dev
```

5. 访问应用

前端：http://localhost:3000
后端 API：http://localhost:5000/api

## 📖 使用指南

### 快递类型管理

1. 进入"快递类型管理"页面
2. 可以添加新的快递类型，设置名称、代码和是否激活
3. 可以编辑或删除现有快递类型
4. 可以更改快递类型的排序

### 发货数据录入

1. 进入"发货数据录入"页面
2. 选择单条录入或批量录入模式
3. 填写相应信息并提交
4. 数据将显示在"最近录入记录"表格中

### 数据筛选

1. 在"最近录入记录"表格上方使用日期范围选择器和快递类型选择器
2. 可以按日期范围、快递类型等条件筛选数据
3. 筛选结果实时更新在表格中

## 📞 问题和支持

如有任何问题或需要支持，请提交 issue 或联系项目维护者。

## 🔒 许可证

[MIT License](LICENSE)
