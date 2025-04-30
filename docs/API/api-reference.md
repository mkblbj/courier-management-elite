# 快递管理系统 API 参考文档

本文档提供快递管理系统后端 API 的详细说明，包括各个端点的请求方法、URL、参数和响应格式。

## API 基础信息

- **基础 URL**: `http://localhost:3000/api` (开发环境)
- **响应格式**: 所有 API 响应均使用统一的 JSON 格式:
  ```json
  {
    "code": 0, // 0表示成功，非0表示错误
    "message": "", // 提示信息
    "data": {} // 响应数据
  }
  ```

## 1. 快递类型 API

### 1.1 获取所有快递类型

获取系统中所有的快递类型信息，支持筛选活跃状态的快递类型。

**请求方法**: GET  
**URL**: `/couriers`

**查询参数**:

| 参数名      | 类型    | 必需 | 描述                         |
| ----------- | ------- | ---- | ---------------------------- |
| active_only | boolean | 否   | 是否只返回活跃状态的快递类型 |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "顺丰速运",
      "code": "SF",
      "remark": "国内快递类型",
      "is_active": 1,
      "sort_order": 10,
      "created_at": "2023-08-01T08:00:00.000Z",
      "updated_at": "2023-08-01T08:00:00.000Z"
    }
    // 更多快递类型...
  ]
}
```

### 1.2 获取单个快递类型

根据 ID 获取特定快递类型的详细信息。

**请求方法**: GET  
**URL**: `/couriers/:id`

**URL 参数**:

| 参数名 | 类型    | 必需 | 描述        |
| ------ | ------- | ---- | ----------- |
| id     | integer | 是   | 快递类型 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "顺丰速运",
    "code": "SF",
    "remark": "国内快递类型",
    "is_active": 1,
    "sort_order": 10,
    "created_at": "2023-08-01T08:00:00.000Z",
    "updated_at": "2023-08-01T08:00:00.000Z"
  }
}
```

### 1.3 创建快递类型

创建新的快递类型记录。

**请求方法**: POST  
**URL**: `/couriers`

**请求体**:

| 字段名    | 类型    | 必需 | 描述         |
| --------- | ------- | ---- | ------------ |
| name      | string  | 是   | 快递类型名称 |
| code      | string  | 是   | 快递类型代码 |
| remark    | string  | 否   | 备注信息     |
| is_active | boolean | 是   | 是否活跃     |

**请求示例**:

```json
{
  "name": "中通快递",
  "code": "ZTO",
  "remark": "国内快递类型",
  "is_active": true
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": 2,
    "name": "中通快递",
    "code": "ZTO",
    "remark": "国内快递类型",
    "is_active": 1,
    "sort_order": 20,
    "created_at": "2023-08-02T09:00:00.000Z",
    "updated_at": "2023-08-02T09:00:00.000Z"
  }
}
```

### 1.4 更新快递类型

更新现有快递类型的信息。

**请求方法**: PUT  
**URL**: `/couriers/:id`

**URL 参数**:

| 参数名 | 类型    | 必需 | 描述        |
| ------ | ------- | ---- | ----------- |
| id     | integer | 是   | 快递类型 ID |

**请求体**:

| 字段名    | 类型    | 必需 | 描述         |
| --------- | ------- | ---- | ------------ |
| name      | string  | 是   | 快递类型名称 |
| code      | string  | 是   | 快递类型代码 |
| remark    | string  | 否   | 备注信息     |
| is_active | boolean | 是   | 是否活跃     |

**请求示例**:

```json
{
  "name": "中通快递",
  "code": "ZTO",
  "remark": "更新后的备注",
  "is_active": false
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 2,
    "name": "中通快递",
    "code": "ZTO",
    "remark": "更新后的备注",
    "is_active": 0,
    "sort_order": 20,
    "created_at": "2023-08-02T09:00:00.000Z",
    "updated_at": "2023-08-02T10:00:00.000Z"
  }
}
```

### 1.5 删除快递类型

删除特定的快递类型记录。

**请求方法**: DELETE  
**URL**: `/couriers/:id`

**URL 参数**:

| 参数名 | 类型    | 必需 | 描述        |
| ------ | ------- | ---- | ----------- |
| id     | integer | 是   | 快递类型 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

### 1.6 切换快递类型状态

切换快递类型的活跃状态。

**请求方法**: PUT  
**URL**: `/couriers/:id/toggle`

**URL 参数**:

| 参数名 | 类型    | 必需 | 描述        |
| ------ | ------- | ---- | ----------- |
| id     | integer | 是   | 快递类型 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "状态切换成功",
  "data": {
    "id": 2,
    "is_active": 1
  }
}
```

### 1.7 更新快递类型排序

批量更新快递类型的排序顺序。

**请求方法**: POST  
**URL**: `/couriers/sort`

**请求体**:

| 字段名             | 类型    | 必需 | 描述        |
| ------------------ | ------- | ---- | ----------- |
| items              | array   | 是   | 排序项数组  |
| items[].id         | integer | 是   | 快递类型 ID |
| items[].sort_order | integer | 是   | 新的排序值  |

**请求示例**:

```json
{
  "items": [
    { "id": 1, "sort_order": 20 },
    { "id": 2, "sort_order": 10 }
  ]
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "排序更新成功",
  "data": null
}
```

## 2. 发货记录 API

### 2.1 获取发货记录列表

获取系统中的发货记录，支持分页、筛选和排序。

**请求方法**: GET  
**URL**: `/shipping`

**查询参数**:

| 参数名     | 类型    | 必需 | 描述                             |
| ---------- | ------- | ---- | -------------------------------- |
| page       | integer | 否   | 页码，默认 1                     |
| page_size  | integer | 否   | 每页记录数，默认 20              |
| courier_id | integer | 否   | 筛选特定快递类型的记录           |
| start_date | string  | 否   | 开始日期，格式 YYYY-MM-DD        |
| end_date   | string  | 否   | 结束日期，格式 YYYY-MM-DD        |
| search     | string  | 否   | 搜索关键词，匹配收件人或手机号   |
| sort_by    | string  | 否   | 排序字段，默认 created_at        |
| sort_dir   | string  | 否   | 排序方向，asc 或 desc，默认 desc |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "total": 100,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "courier_id": 1,
        "courier_name": "顺丰速运",
        "tracking_number": "SF1234567890",
        "recipient_name": "张三",
        "recipient_phone": "13800138000",
        "recipient_address": "北京市朝阳区xx街xx号",
        "item_description": "文件",
        "shipping_date": "2023-08-03",
        "remark": "加急",
        "created_at": "2023-08-03T08:00:00.000Z",
        "updated_at": "2023-08-03T08:00:00.000Z"
      }
      // 更多发货记录...
    ]
  }
}
```

### 2.2 获取单个发货记录

根据 ID 获取特定发货记录的详细信息。

**请求方法**: GET  
**URL**: `/shipping/:id`

**URL 参数**:

| 参数名 | 类型    | 必需 | 描述        |
| ------ | ------- | ---- | ----------- |
| id     | integer | 是   | 发货记录 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "courier_id": 1,
    "courier_name": "顺丰速运",
    "tracking_number": "SF1234567890",
    "recipient_name": "张三",
    "recipient_phone": "13800138000",
    "recipient_address": "北京市朝阳区xx街xx号",
    "item_description": "文件",
    "shipping_date": "2023-08-03",
    "remark": "加急",
    "created_at": "2023-08-03T08:00:00.000Z",
    "updated_at": "2023-08-03T08:00:00.000Z"
  }
}
```

### 2.3 创建发货记录

创建新的发货记录。

**请求方法**: POST  
**URL**: `/shipping`

**请求体**:

| 字段名            | 类型    | 必需 | 描述                      |
| ----------------- | ------- | ---- | ------------------------- |
| courier_id        | integer | 是   | 快递类型 ID               |
| tracking_number   | string  | 是   | 快递单号                  |
| recipient_name    | string  | 是   | 收件人姓名                |
| recipient_phone   | string  | 是   | 收件人电话                |
| recipient_address | string  | 是   | 收件人地址                |
| item_description  | string  | 否   | 物品描述                  |
| shipping_date     | string  | 是   | 发货日期，格式 YYYY-MM-DD |
| remark            | string  | 否   | 备注信息                  |

**请求示例**:

```json
{
  "courier_id": 1,
  "tracking_number": "SF9876543210",
  "recipient_name": "李四",
  "recipient_phone": "13900139000",
  "recipient_address": "上海市浦东新区xx路xx号",
  "item_description": "电子产品",
  "shipping_date": "2023-08-04",
  "remark": "易碎品"
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": 2,
    "courier_id": 1,
    "tracking_number": "SF9876543210",
    "recipient_name": "李四",
    "recipient_phone": "13900139000",
    "recipient_address": "上海市浦东新区xx路xx号",
    "item_description": "电子产品",
    "shipping_date": "2023-08-04",
    "remark": "易碎品",
    "created_at": "2023-08-04T09:00:00.000Z",
    "updated_at": "2023-08-04T09:00:00.000Z"
  }
}
```

### 2.4 更新发货记录

更新现有的发货记录信息。

**请求方法**: PUT  
**URL**: `/shipping/:id`

**URL 参数**:

| 参数名 | 类型    | 必需 | 描述        |
| ------ | ------- | ---- | ----------- |
| id     | integer | 是   | 发货记录 ID |

**请求体**:
与创建发货记录相同，所有字段均为可选，仅更新提供的字段。

**响应示例**:

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 2,
    "courier_id": 1,
    "tracking_number": "SF9876543210",
    "recipient_name": "李四",
    "recipient_phone": "13900139000",
    "recipient_address": "上海市浦东新区xx路xx号",
    "item_description": "电子产品（更新后）",
    "shipping_date": "2023-08-04",
    "remark": "易碎品，小心轻放",
    "created_at": "2023-08-04T09:00:00.000Z",
    "updated_at": "2023-08-04T10:00:00.000Z"
  }
}
```

### 2.5 删除发货记录

删除特定的发货记录。

**请求方法**: DELETE  
**URL**: `/shipping/:id`

**URL 参数**:

| 参数名 | 类型    | 必需 | 描述        |
| ------ | ------- | ---- | ----------- |
| id     | integer | 是   | 发货记录 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

### 2.6 批量添加发货记录

批量创建多条发货记录。

**请求方法**: POST  
**URL**: `/shipping/batch`

**请求体**:

| 字段名 | 类型  | 必需 | 描述         |
| ------ | ----- | ---- | ------------ |
| items  | array | 是   | 发货记录数组 |

数组中的每个对象结构与创建单条发货记录相同。

**请求示例**:

```json
{
  "items": [
    {
      "courier_id": 1,
      "tracking_number": "SF1111111111",
      "recipient_name": "王五",
      "recipient_phone": "13700137000",
      "recipient_address": "广州市天河区xx路xx号",
      "item_description": "服装",
      "shipping_date": "2023-08-05",
      "remark": ""
    },
    {
      "courier_id": 2,
      "tracking_number": "ZTO2222222222",
      "recipient_name": "赵六",
      "recipient_phone": "13600136000",
      "recipient_address": "深圳市南山区xx街xx号",
      "item_description": "图书",
      "shipping_date": "2023-08-05",
      "remark": ""
    }
  ]
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "批量添加成功",
  "data": {
    "success_count": 2,
    "failed_count": 0,
    "total_count": 2
  }
}
```

## 3. 错误处理

所有 API 在遇到错误时都会返回适当的 HTTP 状态码，并在响应体中包含错误信息：

```json
{
  "code": 400,
  "message": "请求参数错误",
  "data": [
    {
      "value": "",
      "msg": "快递单号不能为空",
      "param": "tracking_number",
      "location": "body"
    }
  ]
}
```

常见的错误代码：

- 400: 请求参数错误
- 404: 资源不存在
- 500: 服务器内部错误

## 4. 认证与授权

当前版本的 API 不要求认证。后续版本可能会添加基于 JWT 的认证机制。
