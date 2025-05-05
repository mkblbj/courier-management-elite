# 母子快递类型管理功能

## 功能概述

该功能允许系统管理带有母子关系的快递类型，主要包括：

1. 创建母类型和子类型
2. 在子类型中引用母类型
3. 获取母类型及其所有子类型
4. 统计子类型数量
5. 管理母子类型关系

## 数据库结构

已在`couriers`表中添加`parent_id`字段，用于建立快递类型之间的母子关系：

```sql
ALTER TABLE couriers
ADD COLUMN parent_id INT NULL,
ADD CONSTRAINT fk_courier_parent
FOREIGN KEY (parent_id) REFERENCES couriers(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;
```

## API 接口

### 获取所有快递类型

```
GET /api/couriers
```

### 获取带有层级关系的快递类型

```
GET /api/couriers/hierarchy
```

响应示例：

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "母类型1",
      "code": "MU1",
      "children": [
        {
          "id": 3,
          "name": "子类型1",
          "code": "ZI1",
          "parent_id": 1
        }
      ],
      "childrenCount": 1
    }
  ]
}
```

### 获取所有母类型

```
GET /api/couriers/parents
```

### 获取指定母类型的子类型

```
GET /api/couriers/children/:parentId
```

### 创建快递类型

```
POST /api/couriers
```

请求体示例(创建母类型)：

```json
{
  "name": "新母类型",
  "code": "XMU"
}
```

请求体示例(创建子类型)：

```json
{
  "name": "新子类型",
  "code": "XZI",
  "parent_id": 1
}
```

### 更新快递类型的母子关系

```
PATCH /api/couriers/:id/parent
```

请求体示例：

```json
{
  "parent_id": 2 // 设置为null则移至顶级
}
```

## 使用注意事项

1. 不能删除有子类型的母类型，必须先删除或移动所有子类型
2. 不能创建循环引用的母子关系
3. 快递类型不能作为自己的父类型

## 安装与部署

1. 执行数据库迁移脚本更新数据库结构：

```bash
node backend/src/db/migrations/index.js
```

2. 启动服务器：

```bash
node backend/src/index.js
```
