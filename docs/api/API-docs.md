# 快递管理系统 API 文档

本文档提供快递管理系统所有 API 的详细说明，包括请求方法、URL 路径、参数和响应格式。

## 目录

1. [API 基础信息](#api基础信息)
2. [快递类别 API](#快递类别api)
3. [快递类型 API](#快递类型api)
4. [发货记录 API](#发货记录api)
5. [店铺类别 API](#店铺类别api)
6. [店铺 API](#店铺api)
7. [店铺出力 API](#店铺出力api)
8. [统计分析 API](#统计分析api)
9. [仪表盘 API](#仪表盘api)
10. [错误处理](#错误处理)
11. [后台管理 API](#后台管理-api)

## API 基础信息

- **基础 URL**: `http://localhost:3000` (开发环境)（前端环境文件`.env.development` 或 `.env.production` 中的 NEXT_PUBLIC_API_BASE_URL）
- **响应格式**: 所有 API 响应均使用统一的 JSON 格式:
  ```json
  {
    "code": 0, // 0表示成功，非0表示错误
    "message": "", // 提示信息
    "data": {} // 响应数据
  }
  ```

## 快递类别 API

快递类别用于对快递类型进行分组管理。

### 1. 获取所有快递类别

获取系统中所有的快递类别信息。

**请求方法**: GET  
**URL**: `/api/courier-categories`

**查询参数**:

| 参数   | 类型   | 必需 | 描述                                 |
| ------ | ------ | ---- | ------------------------------------ |
| sort   | string | 否   | 排序字段，默认为`sort_order`         |
| order  | string | 否   | 排序方向，`ASC`或`DESC`，默认为`ASC` |
| search | string | 否   | 按名称搜索                           |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "普通快递",
      "sort_order": 1,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z"
    }
    // ...
  ]
}
```

### 2. 获取单个快递类别

根据 ID 获取特定快递类别的详细信息。

**请求方法**: GET  
**URL**: `/api/courier-categories/:id`

**路径参数**:

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类别 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "普通快递",
    "sort_order": 1,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

### 3. 创建快递类别

创建新的快递类别。

**请求方法**: POST  
**URL**: `/api/courier-categories`

**请求体**:

| 参数       | 类型   | 必需 | 描述                   |
| ---------- | ------ | ---- | ---------------------- |
| name       | string | 是   | 类别名称，最大长度 100 |
| sort_order | number | 否   | 排序值，默认为 0       |

**响应示例**:

```json
{
  "code": 0,
  "message": "添加成功",
  "data": {
    "id": 1,
    "name": "普通快递",
    "sort_order": 1,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

### 4. 更新快递类别

更新现有快递类别的信息。

**请求方法**: PUT  
**URL**: `/api/courier-categories/:id`

**路径参数**:

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类别 ID |

**请求体**:

| 参数       | 类型   | 必需 | 描述                   |
| ---------- | ------ | ---- | ---------------------- |
| name       | string | 否   | 类别名称，最大长度 100 |
| sort_order | number | 否   | 排序值                 |

**响应示例**:

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 1,
    "name": "普通快递",
    "sort_order": 2,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

### 5. 删除快递类别

删除特定的快递类别。

**注意**: 如果有快递类型关联到此类别，删除将失败。必须先移除关联的快递类型，或将它们转移到其他类别。

**请求方法**: DELETE  
**URL**: `/api/courier-categories/:id`

**路径参数**:

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类别 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "删除成功"
}
```

### 6. 更新快递类别排序

批量更新快递类别的排序顺序。

**请求方法**: POST  
**URL**: `/api/courier-categories/sort`

**请求体**:

| 参数  | 类型  | 必需 | 描述       |
| ----- | ----- | ---- | ---------- |
| items | array | 是   | 排序项数组 |

每个排序项的格式:

```json
{
  "id": 1,
  "sort_order": 2
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "排序更新成功"
}
```

### 7. 获取类别统计信息

获取特定快递类别的出力数据统计信息。

**请求方法**: GET  
**URL**: `/api/courier-categories/:id/stats`

**路径参数**:

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类别 ID |

**查询参数**:

| 参数       | 类型   | 必需 | 描述                      |
| ---------- | ------ | ---- | ------------------------- |
| start_date | string | 否   | 开始日期，格式 YYYY-MM-DD |
| end_date   | string | 否   | 结束日期，格式 YYYY-MM-DD |
| shop_id    | number | 否   | 筛选特定店铺              |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "category_id": 1,
    "category_name": "普通快递",
    "total_quantity": 1000
  }
}
```

### 8. 获取发货数据按类别统计信息

获取发货记录按快递类别的统计数据。

**请求方法**: GET  
**URL**: `/api/shipping/stats/categories`

**查询参数**:

| 参数        | 类型   | 必需 | 描述                         |
| ----------- | ------ | ---- | ---------------------------- |
| date        | string | 否   | 指定日期，格式 YYYY-MM-DD    |
| date_from   | string | 否   | 开始日期，格式 YYYY-MM-DD    |
| date_to     | string | 否   | 结束日期，格式 YYYY-MM-DD    |
| category_id | number | 否   | 筛选特定类别 ID              |
| year        | number | 否   | 筛选年份                     |
| month       | number | 否   | 筛选月份（与 year 配合使用） |
| quarter     | number | 否   | 筛选季度（与 year 配合使用） |
| week        | number | 否   | 筛选周数（与 year 配合使用） |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "by_category": [
      {
        "category_id": 1,
        "category_name": "ゆうパケット",
        "total": "25",
        "record_count": 5
      },
      {
        "category_id": 2,
        "category_name": "特快专递",
        "total": "2",
        "record_count": 1
      }
    ],
    "total": {
      "total": "33",
      "days_count": 5,
      "record_count": 7
    }
  }
}
```

## 快递类型 API

快递类型用于对快递进行详细分类。

### 1. 获取所有快递类型

获取系统中所有的快递类型信息，支持筛选和排序。

**请求方法**: GET  
**URL**: `/api/couriers`

**查询参数**:

| 参数        | 类型   | 必需 | 描述                                           |
| ----------- | ------ | ---- | ---------------------------------------------- |
| status      | string | 否   | 筛选状态，`active`、`inactive`或不提供（全部） |
| sort        | string | 否   | 排序字段，默认为`sort_order`                   |
| order       | string | 否   | 排序方向，`ASC`或`DESC`，默认为`ASC`           |
| search      | string | 否   | 按名称、代码或备注搜索                         |
| category_id | number | 否   | 按类别筛选                                     |

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
      "remark": null,
      "is_active": 1,
      "sort_order": 1,
      "category_id": 1,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "category_name": "普通快递"
    }
    // ...
  ]
}
```

### 2. 获取特定类别的所有快递类型

获取特定类别下的所有快递类型。

**请求方法**: GET  
**URL**: `/api/couriers/category/:categoryId`

**路径参数**:

| 参数       | 类型   | 描述        |
| ---------- | ------ | ----------- |
| categoryId | number | 快递类别 ID |

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
      "remark": null,
      "is_active": 1,
      "sort_order": 1,
      "category_id": 1,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "category_name": "普通快递"
    }
    // ...
  ]
}
```

### 3. 获取单个快递类型详情

根据 ID 获取特定快递类型的详细信息。

**请求方法**: GET  
**URL**: `/api/couriers/:id`

**路径参数**:

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类型 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "顺丰速运",
    "code": "SF",
    "remark": null,
    "is_active": 1,
    "sort_order": 1,
    "category_id": 1,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z",
    "category_name": "普通快递"
  }
}
```

### 4. 创建快递类型

创建新的快递类型记录。

**请求方法**: POST  
**URL**: `/api/couriers`

**请求体**:

| 参数        | 类型    | 必需 | 描述                   |
| ----------- | ------- | ---- | ---------------------- |
| name        | string  | 是   | 类型名称，最大长度 100 |
| code        | string  | 否   | 类型代码，最大长度 50  |
| remark      | string  | 否   | 备注                   |
| is_active   | boolean | 否   | 是否启用，默认为 true  |
| sort_order  | number  | 否   | 排序值，默认为 0       |
| category_id | number  | 否   | 类别 ID                |

**响应示例**:

```json
{
  "code": 0,
  "message": "添加成功",
  "data": {
    "id": 1,
    "name": "顺丰速运",
    "code": "SF",
    "remark": null,
    "is_active": 1,
    "sort_order": 1,
    "category_id": 1,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z",
    "category_name": "普通快递"
  }
}
```

### 5. 更新快递类型

更新现有快递类型的信息。

**请求方法**: PUT  
**URL**: `/api/couriers/:id`

**路径参数**:

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类型 ID |

**请求体**:

| 参数        | 类型    | 必需 | 描述                   |
| ----------- | ------- | ---- | ---------------------- |
| name        | string  | 否   | 类型名称，最大长度 100 |
| code        | string  | 否   | 类型代码，最大长度 50  |
| remark      | string  | 否   | 备注                   |
| is_active   | boolean | 否   | 是否启用               |
| sort_order  | number  | 否   | 排序值                 |
| category_id | number  | 否   | 类别 ID                |

**响应示例**:

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 1,
    "name": "顺丰速运",
    "code": "SF",
    "remark": "修改后的备注",
    "is_active": 1,
    "sort_order": 2,
    "category_id": 2,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z",
    "category_name": "特快速递"
  }
}
```

### 6. 删除快递类型

删除特定的快递类型记录。

**请求方法**: DELETE  
**URL**: `/api/couriers/:id`

**路径参数**:

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类型 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "删除成功"
}
```

### 7. 切换快递类型状态

切换快递类型的启用/禁用状态。

**请求方法**: PUT  
**URL**: `/api/couriers/:id/toggle`

**路径参数**:

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类型 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "状态已更新",
  "data": {
    "id": 1,
    "is_active": 0
  }
}
```

### 8. 更新快递类型排序

批量更新快递类型的排序顺序。

**请求方法**: POST  
**URL**: `/api/couriers/sort`

**请求体**:

| 参数  | 类型  | 必需 | 描述       |
| ----- | ----- | ---- | ---------- |
| items | array | 是   | 排序项数组 |

每个排序项的格式:

```json
{
  "id": 1,
  "sort_order": 2
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "排序更新成功"
}
```

## 发货记录 API

发货记录用于记录快递的发货信息。

### 1. 获取发货记录列表

获取系统中的发货记录，支持分页、筛选和排序。

**请求方法**: GET  
**URL**: `/api/shipping`

**查询参数**:

| 参数       | 类型    | 必需 | 描述                             |
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

### 2. 获取单个发货记录

根据 ID 获取特定发货记录的详细信息。

**请求方法**: GET  
**URL**: `/api/shipping/:id`

**路径参数**:

| 参数 | 类型    | 必需 | 描述        |
| ---- | ------- | ---- | ----------- |
| id   | integer | 是   | 发货记录 ID |

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

### 3. 创建发货记录

创建新的发货记录。

**请求方法**: POST  
**URL**: `/api/shipping`

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

### 4. 更新发货记录

更新现有的发货记录信息。

**请求方法**: PUT  
**URL**: `/api/shipping/:id`

**路径参数**:

| 参数 | 类型    | 必需 | 描述        |
| ---- | ------- | ---- | ----------- |
| id   | integer | 是   | 发货记录 ID |

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

### 5. 删除发货记录

删除特定的发货记录。

**请求方法**: DELETE  
**URL**: `/api/shipping/:id`

**路径参数**:

| 参数 | 类型    | 必需 | 描述        |
| ---- | ------- | ---- | ----------- |
| id   | integer | 是   | 发货记录 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "删除成功"
}
```

### 6. 批量添加发货记录

批量创建多条发货记录。

**请求方法**: POST  
**URL**: `/api/shipping/batch`

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

## 店铺类别 API

店铺类别用于对店铺进行分类管理。

### 1. 获取店铺类别列表

获取系统中所有的店铺类别。

**请求方法**: GET  
**URL**: `/api/shop-categories`

**查询参数**:

| 参数   | 类型   | 必需 | 描述                                 |
| ------ | ------ | ---- | ------------------------------------ |
| sort   | string | 否   | 排序字段，默认为`sort_order`         |
| order  | string | 否   | 排序方向，`ASC`或`DESC`，默认为`ASC` |
| search | string | 否   | 按名称搜索                           |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "电商平台",
      "sort_order": 1,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "实体门店",
      "sort_order": 2,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z"
    }
    // 更多店铺类别...
  ]
}
```

### 2. 获取单个店铺类别详情

根据 ID 获取特定店铺类别的详细信息。

**请求方法**: GET  
**URL**: `/api/shop-categories/:id`

**路径参数**:

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 店铺类别 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "电商平台",
    "sort_order": 1,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

### 3. 创建店铺类别

创建新的店铺类别。

**请求方法**: POST  
**URL**: `/api/shop-categories`

**请求体**:

| 参数       | 类型   | 必需 | 描述                   |
| ---------- | ------ | ---- | ---------------------- |
| name       | string | 是   | 类别名称，最大长度 100 |
| sort_order | number | 否   | 排序值，默认为 0       |

**响应示例**:

```json
{
  "code": 0,
  "message": "添加成功",
  "data": {
    "id": 3,
    "name": "海外商店",
    "sort_order": 3,
    "created_at": "2023-08-01T08:00:00.000Z",
    "updated_at": "2023-08-01T08:00:00.000Z"
  }
}
```

### 4. 更新店铺类别

更新现有店铺类别的信息。

**请求方法**: PUT  
**URL**: `/api/shop-categories/:id`

**路径参数**:

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 店铺类别 ID |

**请求体**:

| 参数       | 类型   | 必需 | 描述                   |
| ---------- | ------ | ---- | ---------------------- |
| name       | string | 否   | 类别名称，最大长度 100 |
| sort_order | number | 否   | 排序值                 |

**响应示例**:

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 3,
    "name": "海外专营店",
    "sort_order": 3,
    "created_at": "2023-08-01T08:00:00.000Z",
    "updated_at": "2023-08-01T09:00:00.000Z"
  }
}
```

### 5. 删除店铺类别

删除特定的店铺类别。

**注意**: 如果有店铺关联到此类别，删除将失败。必须先移除关联的店铺，或将它们转移到其他类别。

**请求方法**: DELETE  
**URL**: `/api/shop-categories/:id`

**路径参数**:

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 店铺类别 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "删除成功"
}
```

### 6. 更新店铺类别排序

批量更新店铺类别的排序顺序。

**请求方法**: POST  
**URL**: `/api/shop-categories/sort`

**请求体**:

| 参数  | 类型  | 必需 | 描述       |
| ----- | ----- | ---- | ---------- |
| items | array | 是   | 排序项数组 |

每个排序项的格式:

```json
{
  "id": 1,
  "sort_order": 2
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "排序更新成功"
}
```

## 店铺 API

店铺用于管理快递店铺的信息。

### 1. 获取店铺列表

获取系统中所有的店铺信息。

**请求方法**: GET  
**URL**: `/api/shops`

**查询参数**:

| 参数        | 类型   | 必需 | 描述                                           |
| ----------- | ------ | ---- | ---------------------------------------------- |
| status      | string | 否   | 筛选状态，`active`、`inactive`或不提供（全部） |
| sort        | string | 否   | 排序字段，默认为`sort_order`                   |
| order       | string | 否   | 排序方向，`ASC`或`DESC`，默认为`ASC`           |
| search      | string | 否   | 按名称或备注搜索                               |
| category_id | number | 否   | 按类别筛选                                     |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "东京旗舰店",
      "code": "TYO001",
      "remark": "东京地区主要店铺",
      "is_active": 1,
      "sort_order": 1,
      "category_id": 1,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "category_name": "电商平台"
    },
    {
      "id": 2,
      "name": "大阪分店",
      "code": "OSA001",
      "remark": "关西地区分店",
      "is_active": 1,
      "sort_order": 2,
      "category_id": 2,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "category_name": "实体门店"
    }
    // 更多店铺...
  ]
}
```

### 2. 获取单个店铺详情

根据 ID 获取特定店铺的详细信息。

**请求方法**: GET  
**URL**: `/api/shops/:id`

**路径参数**:

| 参数 | 类型   | 描述    |
| ---- | ------ | ------- |
| id   | number | 店铺 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "东京旗舰店",
    "code": "TYO001",
    "remark": "东京地区主要店铺",
    "is_active": 1,
    "sort_order": 1,
    "category_id": 1,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z",
    "category_name": "电商平台"
  }
}
```

### 3. 创建店铺

创建新的店铺。

**请求方法**: POST  
**URL**: `/api/shops`

**请求体**:

| 参数        | 类型    | 必需 | 描述                   |
| ----------- | ------- | ---- | ---------------------- |
| name        | string  | 是   | 店铺名称，最大长度 100 |
| code        | string  | 否   | 店铺代码，最大长度 50  |
| remark      | string  | 否   | 备注                   |
| is_active   | boolean | 否   | 是否启用，默认为 true  |
| sort_order  | number  | 否   | 排序值，默认为 0       |
| category_id | number  | 否   | 类别 ID                |

**响应示例**:

```json
{
  "code": 0,
  "message": "添加成功",
  "data": {
    "id": 3,
    "name": "名古屋分店",
    "code": "NGY001",
    "remark": "中部地区分店",
    "is_active": 1,
    "sort_order": 3,
    "category_id": 2,
    "created_at": "2023-08-01T08:00:00.000Z",
    "updated_at": "2023-08-01T08:00:00.000Z",
    "category_name": "实体门店"
  }
}
```

### 4. 更新店铺

更新现有店铺的信息。

**请求方法**: PUT  
**URL**: `/api/shops/:id`

**路径参数**:

| 参数 | 类型   | 描述    |
| ---- | ------ | ------- |
| id   | number | 店铺 ID |

**请求体**:

| 参数        | 类型    | 必需 | 描述                   |
| ----------- | ------- | ---- | ---------------------- |
| name        | string  | 否   | 店铺名称，最大长度 100 |
| code        | string  | 否   | 店铺代码，最大长度 50  |
| remark      | string  | 否   | 备注                   |
| is_active   | boolean | 否   | 是否启用               |
| sort_order  | number  | 否   | 排序值                 |
| category_id | number  | 否   | 类别 ID                |

**响应示例**:

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 3,
    "name": "名古屋中心店",
    "code": "NGY001",
    "remark": "中部地区主要店铺",
    "is_active": 1,
    "sort_order": 3,
    "category_id": 2,
    "created_at": "2023-08-01T08:00:00.000Z",
    "updated_at": "2023-08-01T09:00:00.000Z",
    "category_name": "实体门店"
  }
}
```

### 5. 删除店铺

删除特定的店铺。

**请求方法**: DELETE  
**URL**: `/api/shops/:id`

**路径参数**:

| 参数 | 类型   | 描述    |
| ---- | ------ | ------- |
| id   | number | 店铺 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "删除成功"
}
```

### 6. 切换店铺状态

切换店铺的启用/禁用状态。

**请求方法**: POST  
**URL**: `/api/shops/:id/toggle`

**路径参数**:

| 参数 | 类型   | 描述    |
| ---- | ------ | ------- |
| id   | number | 店铺 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "状态已更新",
  "data": {
    "id": 3,
    "is_active": 0
  }
}
```

### 7. 更新店铺排序

批量更新店铺的排序顺序。

**请求方法**: POST  
**URL**: `/api/shops/sort`

**请求体**:

| 参数  | 类型  | 必需 | 描述       |
| ----- | ----- | ---- | ---------- |
| items | array | 是   | 排序项数组 |

每个排序项的格式:

```json
{
  "id": 1,
  "sort_order": 2
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "排序更新成功"
}
```

## 店铺出力 API

店铺出力用于记录店铺的出力数据。

### 1. 获取出力数据列表

获取店铺的出力数据，支持分页、筛选和排序。

**请求方法**: GET  
**URL**: `/api/shop-outputs`

**查询参数**:

| 参数       | 类型    | 必需 | 描述                             |
| ---------- | ------- | ---- | -------------------------------- |
| page       | integer | 否   | 页码，默认 1                     |
| page_size  | integer | 否   | 每页记录数，默认 20              |
| shop_id    | integer | 否   | 筛选特定店铺的记录               |
| courier_id | integer | 否   | 筛选特定快递类型的记录           |
| start_date | string  | 否   | 开始日期，格式 YYYY-MM-DD        |
| end_date   | string  | 否   | 结束日期，格式 YYYY-MM-DD        |
| sort_by    | string  | 否   | 排序字段，默认 date              |
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
        "shop_id": 1,
        "shop_name": "东京旗舰店",
        "courier_id": 1,
        "courier_name": "顺丰速运",
        "date": "2023-08-01",
        "quantity": 25,
        "remark": "电商促销日",
        "created_at": "2023-08-01T17:00:00.000Z",
        "updated_at": "2023-08-01T17:00:00.000Z"
      }
      // 更多出力记录...
    ]
  }
}
```

### 2. 获取最近录入数据

获取系统中最近录入的出力数据记录。

**请求方法**: GET  
**URL**: `/api/shop-outputs/recent`

**查询参数**:

| 参数  | 类型    | 必需 | 描述                  |
| ----- | ------- | ---- | --------------------- |
| limit | integer | 否   | 返回记录数，默认为 10 |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 100,
      "shop_id": 2,
      "shop_name": "大阪分店",
      "courier_id": 1,
      "courier_name": "顺丰速运",
      "date": "2023-08-01",
      "quantity": 15,
      "remark": "",
      "created_at": "2023-08-01T17:30:00.000Z",
      "updated_at": "2023-08-01T17:30:00.000Z"
    }
    // 更多最近记录...
  ]
}
```

### 3. 获取今日出力数据

获取今日的店铺出力数据。

**请求方法**: GET  
**URL**: `/api/shop-outputs/today`

**查询参数**:

| 参数    | 类型    | 必需 | 描述               |
| ------- | ------- | ---- | ------------------ |
| shop_id | integer | 否   | 筛选特定店铺的记录 |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 105,
      "shop_id": 1,
      "shop_name": "东京旗舰店",
      "courier_id": 2,
      "courier_name": "中通快递",
      "date": "2023-08-05",
      "quantity": 30,
      "remark": "今日特别处理",
      "created_at": "2023-08-05T10:00:00.000Z",
      "updated_at": "2023-08-05T10:00:00.000Z"
    }
    // 更多今日记录...
  ]
}
```

### 4. 获取单条出力记录

根据 ID 获取特定出力记录的详细信息。

**请求方法**: GET  
**URL**: `/api/shop-outputs/:id`

**路径参数**:

| 参数 | 类型    | 必需 | 描述        |
| ---- | ------- | ---- | ----------- |
| id   | integer | 是   | 出力记录 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "shop_id": 1,
    "shop_name": "东京旗舰店",
    "courier_id": 1,
    "courier_name": "顺丰速运",
    "date": "2023-08-01",
    "quantity": 25,
    "remark": "电商促销日",
    "created_at": "2023-08-01T17:00:00.000Z",
    "updated_at": "2023-08-01T17:00:00.000Z"
  }
}
```

### 5. 创建出力记录

创建新的店铺出力记录。

**请求方法**: POST  
**URL**: `/api/shop-outputs`

**请求体**:

| 字段名     | 类型    | 必需 | 描述                      |
| ---------- | ------- | ---- | ------------------------- |
| shop_id    | integer | 是   | 店铺 ID                   |
| courier_id | integer | 是   | 快递类型 ID               |
| date       | string  | 是   | 出力日期，格式 YYYY-MM-DD |
| quantity   | integer | 是   | 出力数量                  |
| remark     | string  | 否   | 备注信息                  |

**请求示例**:

```json
{
  "shop_id": 3,
  "courier_id": 2,
  "date": "2023-08-05",
  "quantity": 20,
  "remark": "周末促销"
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": 106,
    "shop_id": 3,
    "shop_name": "名古屋分店",
    "courier_id": 2,
    "courier_name": "中通快递",
    "date": "2023-08-05",
    "quantity": 20,
    "remark": "周末促销",
    "created_at": "2023-08-05T10:30:00.000Z",
    "updated_at": "2023-08-05T10:30:00.000Z"
  }
}
```

### 6. 更新出力记录

更新现有的出力记录信息。

**请求方法**: PUT  
**URL**: `/api/shop-outputs/:id`

**路径参数**:

| 参数 | 类型    | 必需 | 描述        |
| ---- | ------- | ---- | ----------- |
| id   | integer | 是   | 出力记录 ID |

**请求体**:
与创建出力记录相同，所有字段均为可选，仅更新提供的字段。

**响应示例**:

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 106,
    "shop_id": 3,
    "shop_name": "名古屋分店",
    "courier_id": 2,
    "courier_name": "中通快递",
    "date": "2023-08-05",
    "quantity": 25,
    "remark": "周末特别促销",
    "created_at": "2023-08-05T10:30:00.000Z",
    "updated_at": "2023-08-05T11:00:00.000Z"
  }
}
```

### 7. 删除出力记录

删除特定的出力记录。

**请求方法**: DELETE  
**URL**: `/api/shop-outputs/:id`

**路径参数**:

| 参数 | 类型    | 必需 | 描述        |
| ---- | ------- | ---- | ----------- |
| id   | integer | 是   | 出力记录 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "删除成功"
}
```

## 统计分析 API

统计分析用于生成各种统计分析报告。

### 1. 按店铺统计出力数据

获取按店铺分组的出力数据统计。

**请求方法**: GET  
**URL**: `/api/stats/shop-outputs/shops`

**查询参数**:

| 参数       | 类型   | 必需 | 描述                      |
| ---------- | ------ | ---- | ------------------------- |
| start_date | string | 否   | 开始日期，格式 YYYY-MM-DD |
| end_date   | string | 否   | 结束日期，格式 YYYY-MM-DD |
| shop_id    | number | 否   | 筛选特定店铺              |
| courier_id | number | 否   | 筛选特定快递类型          |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "by_shop": [
      {
        "shop_id": 1,
        "shop_name": "东京旗舰店",
        "total_quantity": 500,
        "percentage": 50
      },
      {
        "shop_id": 2,
        "shop_name": "大阪分店",
        "total_quantity": 300,
        "percentage": 30
      },
      {
        "shop_id": 3,
        "shop_name": "名古屋分店",
        "total_quantity": 200,
        "percentage": 20
      }
    ],
    "total": {
      "total_quantity": 1000,
      "shop_count": 3
    }
  }
}
```

### 2. 按快递类型统计出力数据

获取按快递类型分组的出力数据统计。

**请求方法**: GET  
**URL**: `/api/stats/shop-outputs/couriers`

**查询参数**:

| 参数       | 类型   | 必需 | 描述                      |
| ---------- | ------ | ---- | ------------------------- |
| start_date | string | 否   | 开始日期，格式 YYYY-MM-DD |
| end_date   | string | 否   | 结束日期，格式 YYYY-MM-DD |
| shop_id    | number | 否   | 筛选特定店铺              |
| courier_id | number | 否   | 筛选特定快递类型          |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "by_courier": [
      {
        "courier_id": 1,
        "courier_name": "顺丰速运",
        "total_quantity": 600,
        "percentage": 60
      },
      {
        "courier_id": 2,
        "courier_name": "中通快递",
        "total_quantity": 400,
        "percentage": 40
      }
    ],
    "total": {
      "total_quantity": 1000,
      "courier_count": 2
    }
  }
}
```

### 3. 按日期统计出力数据

获取按日期分组的出力数据统计。

**请求方法**: GET  
**URL**: `/api/stats/shop-outputs/dates`

**查询参数**:

| 参数       | 类型   | 必需 | 描述                                   |
| ---------- | ------ | ---- | -------------------------------------- |
| start_date | string | 否   | 开始日期，格式 YYYY-MM-DD              |
| end_date   | string | 否   | 结束日期，格式 YYYY-MM-DD              |
| shop_id    | number | 否   | 筛选特定店铺                           |
| courier_id | number | 否   | 筛选特定快递类型                       |
| group_by   | string | 否   | 分组方式：day(默认)、week、month、year |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "by_date": [
      {
        "date": "2023-08-01",
        "total_quantity": 300,
        "percentage": 30
      },
      {
        "date": "2023-08-02",
        "total_quantity": 350,
        "percentage": 35
      },
      {
        "date": "2023-08-03",
        "total_quantity": 350,
        "percentage": 35
      }
    ],
    "total": {
      "total_quantity": 1000,
      "date_count": 3
    }
  }
}
```

### 4. 按类别统计出力数据

获取按店铺类别分组的出力数据统计。API 会同时返回同比和环比变化数据。

**请求方法**: GET  
**URL**: `/api/stats/shop-outputs/categories`

**查询参数**:

| 参数       | 类型   | 必需 | 描述                      |
| ---------- | ------ | ---- | ------------------------- |
| date_from  | string | 否   | 开始日期，格式 YYYY-MM-DD |
| date_to    | string | 否   | 结束日期，格式 YYYY-MM-DD |
| courier_id | number | 否   | 筛选特定快递类型          |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "category_id": 1,
      "category_name": "乐天",
      "total_quantity": 689,
      "shops_count": 5,
      "days_count": 12,
      "mom_change_rate": 72.25,
      "mom_change_type": "increase",
      "yoy_change_rate": -1.57,
      "yoy_change_type": "decrease"
    },
    {
      "category_id": 2,
      "category_name": "亚马逊",
      "total_quantity": 372,
      "shops_count": 5,
      "days_count": 9,
      "mom_change_rate": 100,
      "mom_change_type": "increase",
      "yoy_change_rate": 100,
      "yoy_change_type": "increase"
    }
  ]
}
```

**响应字段说明**:

| 字段            | 类型   | 描述                                                                  |
| --------------- | ------ | --------------------------------------------------------------------- |
| category_id     | number | 类别 ID                                                               |
| category_name   | string | 类别名称                                                              |
| total_quantity  | number | 总出力量                                                              |
| shops_count     | number | 该类别下的店铺数量                                                    |
| days_count      | number | 统计周期内的天数                                                      |
| mom_change_rate | number | 环比变化率(百分比)，环比指与上一个相同时间段相比                      |
| mom_change_type | string | 环比变化类型：'increase'(增加)、'decrease'(减少)或'unchanged'(无变化) |
| yoy_change_rate | number | 同比变化率(百分比)，同比指与去年同期相比                              |
| yoy_change_type | string | 同比变化类型：'increase'(增加)、'decrease'(减少)或'unchanged'(无变化) |

### 5. 获取总计数据

获取出力数据的总计统计信息。

**请求方法**: GET  
**URL**: `/api/stats/shop-outputs/total`

**查询参数**:

| 参数       | 类型   | 必需 | 描述                      |
| ---------- | ------ | ---- | ------------------------- |
| start_date | string | 否   | 开始日期，格式 YYYY-MM-DD |
| end_date   | string | 否   | 结束日期，格式 YYYY-MM-DD |
| shop_id    | number | 否   | 筛选特定店铺              |
| courier_id | number | 否   | 筛选特定快递类型          |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "total_quantity": 1000,
    "shop_count": 3,
    "courier_count": 2,
    "date_count": 3,
    "average_per_day": 333.33,
    "average_per_shop": 333.33,
    "top_shop": {
      "shop_id": 1,
      "shop_name": "东京旗舰店",
      "total_quantity": 500
    },
    "top_courier": {
      "courier_id": 1,
      "courier_name": "顺丰速运",
      "total_quantity": 600
    }
  }
}
```

## 仪表盘 API

仪表盘用于展示快递管理系统的关键指标。

### 1. 获取今日出力概览

获取今日各店铺的出力概览信息。

**请求方法**: GET  
**URL**: `/api/dashboard/shop-outputs/today`

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "date": "2023-08-05",
    "total_quantity": 150,
    "shop_count": 3,
    "courier_count": 2,
    "comparison_with_yesterday": {
      "difference": 20,
      "percentage": 15.38
    },
    "by_shop": [
      {
        "shop_id": 1,
        "shop_name": "东京旗舰店",
        "total_quantity": 70,
        "percentage": 46.67
      },
      {
        "shop_id": 2,
        "shop_name": "大阪分店",
        "total_quantity": 50,
        "percentage": 33.33
      },
      {
        "shop_id": 3,
        "shop_name": "名古屋分店",
        "total_quantity": 30,
        "percentage": 20.0
      }
    ]
  }
}
```

### 2. 获取明日出力预测

获取对明日出力数据的预测。

**请求方法**: GET  
**URL**: `/api/dashboard/shop-outputs/tomorrow`

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "date": "2023-08-06",
    "predicted_total": 160,
    "confidence_level": "medium",
    "historical_basis": "last_7_days_average",
    "by_shop": [
      {
        "shop_id": 1,
        "shop_name": "东京旗舰店",
        "predicted_quantity": 75,
        "percentage": 46.88
      },
      {
        "shop_id": 2,
        "shop_name": "大阪分店",
        "predicted_quantity": 53,
        "percentage": 33.12
      },
      {
        "shop_id": 3,
        "shop_name": "名古屋分店",
        "predicted_quantity": 32,
        "percentage": 20.0
      }
    ]
  }
}
```

## 错误处理

当 API 请求失败时，系统会返回相应的错误信息。错误响应的格式如下：

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

### 常见错误代码

| 代码 | 描述                                 |
| ---- | ------------------------------------ |
| 400  | 请求参数错误/格式不正确              |
| 401  | 未授权(可能添加于后续版本的认证系统) |
| 403  | 禁止访问                             |
| 404  | 资源不存在                           |
| 409  | 资源冲突(例如，资源已存在或无法删除) |
| 500  | 服务器内部错误                       |

### 返回的错误信息

对于验证错误，系统会返回详细的验证失败信息，包括：

- **value**: 提交的值
- **msg**: 错误消息
- **param**: 发生错误的参数名
- **location**: 参数位置（例如：body, query, params 等）

对于其他类型的错误，系统会提供描述性的错误消息，帮助用户理解问题所在并采取相应的纠正措施。

## 后台管理 API

后台管理功能用于系统管理员管理通知和监控系统性能。

### 1. 通知模板管理

#### 1.1 获取通知模板列表

**请求方法**: GET  
**URL**: `/api/admin/notification-templates`

**查询参数**:

| 参数     | 类型    | 必需 | 描述                      |
| -------- | ------- | ---- | ------------------------- |
| page     | integer | 否   | 页码，默认 1              |
| per_page | integer | 否   | 每页记录数，默认 20       |
| status   | string  | 否   | 状态筛选：active/inactive |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "total": 10,
    "page": 1,
    "per_page": 20,
    "items": [
      {
        "id": 1,
        "name": "系统更新通知",
        "title": "系统升级公告",
        "content": "<p>系统将于今晚进行升级...</p>",
        "style_id": 1,
        "style_name": "现代卡片风格",
        "media_urls": ["https://example.com/image1.jpg"],
        "links": [{ "text": "查看详情", "url": "https://example.com" }],
        "is_active": true,
        "created_at": "2023-08-01T10:00:00.000Z",
        "updated_at": "2023-08-01T10:00:00.000Z"
      }
    ]
  }
}
```

#### 1.2 创建通知模板

**请求方法**: POST  
**URL**: `/api/admin/notification-templates`

**请求体**:

| 参数       | 类型    | 必需 | 描述                  |
| ---------- | ------- | ---- | --------------------- |
| name       | string  | 是   | 模板名称              |
| title      | string  | 是   | 通知标题              |
| content    | string  | 是   | 通知内容（HTML 格式） |
| style_id   | integer | 是   | 样式 ID               |
| media_urls | array   | 否   | 媒体文件 URL 数组     |
| links      | array   | 否   | 链接数组              |
| is_active  | boolean | 否   | 是否启用，默认 true   |

#### 1.3 更新通知模板

**请求方法**: PUT  
**URL**: `/api/admin/notification-templates/:id`

#### 1.4 删除通知模板

**请求方法**: DELETE  
**URL**: `/api/admin/notification-templates/:id`

#### 1.5 预览通知模板

**请求方法**: POST  
**URL**: `/api/admin/notification-templates/preview`

**请求体**:

| 参数     | 类型    | 必需 | 描述                  |
| -------- | ------- | ---- | --------------------- |
| title    | string  | 是   | 通知标题              |
| content  | string  | 是   | 通知内容（HTML 格式） |
| style_id | integer | 是   | 样式 ID               |

### 2. 通知样式管理

#### 2.1 获取通知样式列表

**请求方法**: GET  
**URL**: `/api/admin/notification-styles`

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "现代卡片风格",
      "config": {
        "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "borderRadius": "12px",
        "animation": "slideInDown",
        "iconStyle": "modern"
      },
      "preview_image": "https://example.com/preview1.jpg"
    }
  ]
}
```

### 3. 文件上传

#### 3.1 上传媒体文件

**请求方法**: POST  
**URL**: `/api/admin/upload`

**请求体**: FormData

| 参数 | 类型   | 必需 | 描述                         |
| ---- | ------ | ---- | ---------------------------- |
| file | file   | 是   | 文件（支持图片、GIF 等格式） |
| type | string | 否   | 文件类型：image/gif/video    |

**响应示例**:

```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "url": "https://example.com/uploads/image123.jpg",
    "filename": "image123.jpg",
    "size": 1024000,
    "type": "image/jpeg"
  }
}
```

### 4. 性能监控

#### 4.1 获取性能指标

**请求方法**: GET  
**URL**: `/api/admin/performance/metrics`

**查询参数**:

| 参数        | 类型   | 必需 | 描述                                          |
| ----------- | ------ | ---- | --------------------------------------------- |
| metric_type | string | 否   | 指标类型：cpu/memory/response_time/error_rate |
| start_time  | string | 否   | 开始时间，格式 YYYY-MM-DD HH:mm:ss            |
| end_time    | string | 否   | 结束时间，格式 YYYY-MM-DD HH:mm:ss            |
| interval    | string | 否   | 时间间隔：1m/5m/1h/1d                         |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "metrics": [
      {
        "timestamp": "2023-08-01T10:00:00.000Z",
        "cpu_usage": 45.2,
        "memory_usage": 68.5,
        "response_time": 120,
        "error_rate": 0.1
      }
    ],
    "summary": {
      "avg_cpu": 42.1,
      "avg_memory": 65.3,
      "avg_response_time": 115,
      "total_requests": 10000,
      "total_errors": 10
    }
  }
}
```

#### 4.2 获取系统状态

**请求方法**: GET  
**URL**: `/api/admin/performance/status`

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "status": "healthy",
    "uptime": 86400,
    "version": "1.0.0",
    "database_status": "connected",
    "redis_status": "connected",
    "last_backup": "2023-08-01T02:00:00.000Z"
  }
}
```
