# 数据库迁移说明

本项目使用自定义的简单数据库迁移系统，用于管理数据库结构变更。

## 迁移文件说明

1. `src/db/migrations.js` - 主迁移文件，包含创建所有表和初始数据的完整迁移
2. `src/db/add_unique_constraint_migration.js` - 单独的迁移文件，专门用于添加shipping_records表的唯一约束

## 如何执行迁移

### 新环境完整初始化

对于新环境的完整初始化（创建所有表和初始数据），请执行：

```bash
# 在项目根目录下执行
npm run migrate
```

### 仅添加唯一约束

如果只需要为现有的`shipping_records`表添加唯一约束（每个快递类型每天只能有一条记录），请执行：

```bash
# 在项目根目录下执行
npm run migrate:add-unique-constraint
```

## 约束说明

添加的约束确保：
1. 每个快递类型（courier_id）在每一天（date）只能有一条记录
2. 尝试添加重复记录时会返回数据库错误，前端会显示适当的错误消息

## 故障排除

如遇到数据库连接错误：

1. 确认MySQL服务正在运行
2. 检查`src/config.json`中的数据库连接配置是否正确
3. 确保数据库用户具有ALTER TABLE权限

如果出现错误"Can't connect to local MySQL server through socket '/var/run/mysqld/mysqld.sock'"，可尝试：

```bash
# 使用TCP/IP连接而非socket
export DB_HOST=127.0.0.1
npm run migrate:add-unique-constraint
```

### MySQL语法兼容性问题

迁移脚本已优化以支持多种MySQL版本。如果遇到语法错误，请注意：

1. 某些MySQL版本不支持`IF NOT EXISTS`与`ADD CONSTRAINT`一起使用
2. 当前的迁移脚本会先检查约束是否存在，然后再添加，避免语法错误
3. 已移除CHECK约束，仅保留UNIQUE约束，以提高兼容性
4. 如果迁移日志显示"唯一约束已存在，跳过添加"，说明约束已成功添加，无需担心

## 迁移开发

如需添加新的迁移，建议：

1. 在`migrations.js`中添加新的迁移函数
2. 对于可能需要单独执行的重要迁移，创建独立的迁移文件
3. 在`package.json`中添加对应的npm脚本命令 