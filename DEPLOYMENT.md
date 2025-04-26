# 快递管理系统部署指南

本文档提供了快递管理系统的自动化部署指南，支持两种部署方式：Docker 容器化部署和传统部署。两种方式都支持自动初始化数据库，无需手动执行数据库迁移。

## 环境要求

- Node.js 16+ (如果非 Docker 方式部署)
- MySQL 8.0+ (如果非 Docker 方式部署)
- Docker & Docker Compose (如果使用 Docker 部署)

## Docker 方式部署（推荐）

Docker 方式是最简单的部署方式，系统会自动创建数据库、表结构，并填充初始数据。

### 步骤 1：准备环境变量

1. 在项目根目录创建`.env`文件
2. 复制以下内容并根据需要修改：

```
# 应用环境
NODE_ENV=production

# 数据库配置
DB_HOST=mysql
DB_PORT=3306
DB_USER=courier_user
DB_PASSWORD=your_secure_password
DB_NAME=courier_db

# MySQL root密码
MYSQL_ROOT_PASSWORD=your_root_password

# 前端API基础URL - 如果前端和后端部署在同一服务器上使用默认值
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 步骤 2：启动服务

在项目根目录执行：

```bash
docker-compose up -d
```

系统会自动完成以下操作：

1. 构建后端和前端镜像
2. 启动 MySQL 数据库
3. 等待数据库就绪
4. 启动后端应用，自动创建数据库和表结构
5. 启动前端应用

### 步骤 3：验证部署

- 后端 API 地址：http://your-server-ip:3000/api
- 前端地址：http://your-server-ip/

## 传统方式部署

如果需要在已有的服务器环境中部署，可以使用传统方式。

### 步骤 1：准备 MySQL 数据库

确保 MySQL 服务器已经运行，并记录连接信息（主机、端口、用户名、密码）。
注意：**不需要**手动创建数据库，应用会自动创建。

### 步骤 2：配置后端

1. 进入后端目录：`cd backend`
2. 创建`.env`文件，并配置以下内容：

```
NODE_ENV=production
PORT=3000
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=courier_db
```

3. 安装依赖：`npm install`

### 步骤 3：启动后端

```bash
cd backend
npm start
```

在首次启动时，系统会：

1. 检查数据库是否存在，如不存在则创建
2. 创建表结构
3. 添加初始数据（如果表是空的）

### 步骤 4：配置和启动前端

1. 进入前端目录：`cd frontend`
2. 创建`.env.local`文件：

```
NEXT_PUBLIC_API_BASE_URL=http://your_backend_url:3000
```

3. 执行构建和启动：

```bash
npm install
npm run build
npm start
```

## 数据库更新和迁移

系统设计为自动处理数据库迁移，当代码更新时：

1. 停止当前运行的服务
2. 更新代码
3. 重新启动服务

应用会自动检测数据库结构变更并应用更新，无需手动运行迁移脚本。

## 故障排除

### 数据库连接问题

如果遇到数据库连接问题：

1. 检查`.env`文件中的数据库配置是否正确
2. 确认 MySQL 服务是否正常运行
3. 检查 MySQL 用户是否有足够权限创建数据库和表

错误日志将输出到控制台，可以通过以下命令查看 Docker 容器的日志：

```bash
docker logs courier-backend
```

### 数据库自动创建失败

如果数据库自动创建失败，您可以手动创建数据库，然后重启应用：

```sql
CREATE DATABASE IF NOT EXISTS courier_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

之后，应用会自动创建表结构和初始数据。

## 备份和还原

### 数据库备份

```bash
docker exec courier-mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" courier_db' > backup.sql
```

### 数据库还原

```bash
cat backup.sql | docker exec -i courier-mysql sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" courier_db'
```

## 单独部署后端

如果您只需要部署后端 API 服务：

```bash
docker-compose up -d mysql backend
```

这将仅启动 MySQL 和后端服务，不启动前端服务。
