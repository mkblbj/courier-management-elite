# 快递类别和快递类型 API 文档

本文档详细说明了快递类别与快递类型 API 的使用方法，包括请求参数、响应格式等。

## 快递类别 API (Courier Categories)

快递类别用于对快递类型进行分组管理，取代原有的层级结构（父子关系）模式。

### 1. 获取所有快递类别

#### 请求

```
GET /api/courier-categories
```

#### 查询参数

| 参数   | 类型   | 必需 | 描述                                 |
| ------ | ------ | ---- | ------------------------------------ |
| sort   | string | 否   | 排序字段，默认为`sort_order`         |
| order  | string | 否   | 排序方向，`ASC`或`DESC`，默认为`ASC` |
| search | string | 否   | 按名称搜索                           |

#### 成功响应

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

#### 请求

```
GET /api/courier-categories/:id
```

#### 路径参数

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类别 ID |

#### 成功响应

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

#### 请求

```
POST /api/courier-categories
```

#### 请求体

| 参数       | 类型   | 必需 | 描述                   |
| ---------- | ------ | ---- | ---------------------- |
| name       | string | 是   | 类别名称，最大长度 100 |
| sort_order | number | 否   | 排序值，默认为 0       |

#### 成功响应

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

#### 请求

```
PUT /api/courier-categories/:id
```

#### 路径参数

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类别 ID |

#### 请求体

| 参数       | 类型   | 必需 | 描述                   |
| ---------- | ------ | ---- | ---------------------- |
| name       | string | 否   | 类别名称，最大长度 100 |
| sort_order | number | 否   | 排序值                 |

#### 成功响应

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

**注意**: 如果有快递类型关联到此类别，删除将失败。必须先移除关联的快递类型，或将它们转移到其他类别。

#### 请求

```
DELETE /api/courier-categories/:id
```

#### 路径参数

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类别 ID |

#### 成功响应

```json
{
  "code": 0,
  "message": "删除成功"
}
```

### 6. 更新快递类别排序

#### 请求

```
POST /api/courier-categories/sort
```

或

```
POST /api/courier-categories/reorder
```

#### 请求体

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

#### 成功响应

```json
{
  "code": 0,
  "message": "排序更新成功"
}
```

### 7. 获取类别统计信息

#### 请求

```
GET /api/courier-categories/:id/stats
```

#### 路径参数

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类别 ID |

#### 查询参数

| 参数       | 类型   | 必需 | 描述                      |
| ---------- | ------ | ---- | ------------------------- |
| start_date | string | 否   | 开始日期，格式 YYYY-MM-DD |
| end_date   | string | 否   | 结束日期，格式 YYYY-MM-DD |
| shop_id    | number | 否   | 店铺 ID                   |

#### 成功响应

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

## 快递类型 API (Couriers)

### 1. 获取所有快递类型

#### 请求

```
GET /api/couriers
```

#### 查询参数

| 参数        | 类型   | 必需 | 描述                                           |
| ----------- | ------ | ---- | ---------------------------------------------- |
| status      | string | 否   | 筛选状态，`active`、`inactive`或不提供（全部） |
| sort        | string | 否   | 排序字段，默认为`sort_order`                   |
| order       | string | 否   | 排序方向，`ASC`或`DESC`，默认为`ASC`           |
| search      | string | 否   | 按名称、代码或备注搜索                         |
| category_id | number | 否   | 按类别筛选                                     |

#### 成功响应

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

#### 请求

```
GET /api/couriers/category/:categoryId
```

#### 路径参数

| 参数       | 类型   | 描述        |
| ---------- | ------ | ----------- |
| categoryId | number | 快递类别 ID |

#### 成功响应

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

#### 请求

```
GET /api/couriers/:id
```

#### 路径参数

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类型 ID |

#### 成功响应

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

#### 请求

```
POST /api/couriers
```

#### 请求体

| 参数        | 类型    | 必需 | 描述                   |
| ----------- | ------- | ---- | ---------------------- |
| name        | string  | 是   | 类型名称，最大长度 100 |
| code        | string  | 否   | 类型代码，最大长度 50  |
| remark      | string  | 否   | 备注                   |
| is_active   | boolean | 否   | 是否启用，默认为 true  |
| sort_order  | number  | 否   | 排序值，默认为 0       |
| category_id | number  | 否   | 类别 ID                |

#### 成功响应

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

#### 请求

```
PUT /api/couriers/:id
```

#### 路径参数

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类型 ID |

#### 请求体

| 参数        | 类型    | 必需 | 描述                   |
| ----------- | ------- | ---- | ---------------------- |
| name        | string  | 否   | 类型名称，最大长度 100 |
| code        | string  | 否   | 类型代码，最大长度 50  |
| remark      | string  | 否   | 备注                   |
| is_active   | boolean | 否   | 是否启用               |
| sort_order  | number  | 否   | 排序值                 |
| category_id | number  | 否   | 类别 ID                |

#### 成功响应

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

#### 请求

```
DELETE /api/couriers/:id
```

#### 路径参数

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类型 ID |

#### 成功响应

```json
{
  "code": 0,
  "message": "删除成功"
}
```

### 7. 切换快递类型状态

#### 请求

```
PUT /api/couriers/:id/toggle
```

#### 路径参数

| 参数 | 类型   | 描述        |
| ---- | ------ | ----------- |
| id   | number | 快递类型 ID |

#### 成功响应

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

#### 请求

```
POST /api/couriers/sort
```

或

```
POST /api/couriers/reorder
```

#### 请求体

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

#### 成功响应

```json
{
  "code": 0,
  "message": "排序更新成功"
}
```
