# 店铺出力管理 API 参考文档

本文档提供店铺出力管理系统后端 API 的详细说明，包括各个端点的请求方法、URL、参数和响应格式。

## API 基础信息

- **基础 URL**: `` (开发环境)
- **响应格式**: 所有 API 响应均使用统一的 JSON 格式:
  ```json
  {
    "code": 0, // 0表示成功，非0表示错误
    "message": "", // 提示信息
    "data": {} // 响应数据
  }
  ```

## 1. 店铺 API

### 1.1 获取店铺列表

获取系统中所有的店铺信息，支持筛选活跃状态的店铺。

**请求方法**: GET  
**URL**: `/shops`

**查询参数**:

| 参数名    | 类型    | 必需 | 描述                      |
| --------- | ------- | ---- | ------------------------- |
| is_active | boolean | 否   | 是否只返回活跃状态的店铺  |
| sort      | string  | 否   | 排序字段，默认 sort_order |
| order     | string  | 否   | 排序方向，DESC 或 ASC     |
| search    | string  | 否   | 店铺名称搜索关键词        |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "测试店铺1",
      "is_active": 1,
      "sort_order": 5,
      "remark": "这是测试店铺1的备注",
      "created_at": "2023-08-01T08:00:00.000Z",
      "updated_at": "2023-08-01T08:00:00.000Z"
    }
    // 更多店铺...
  ]
}
```

### 1.2 获取单个店铺

根据 ID 获取特定店铺的详细信息。

**请求方法**: GET  
**URL**: `/shops/:id`

**URL 参数**:

| 参数名 | 类型    | 必需 | 描述    |
| ------ | ------- | ---- | ------- |
| id     | integer | 是   | 店铺 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "测试店铺1",
    "is_active": 1,
    "sort_order": 5,
    "remark": "这是测试店铺1的备注",
    "created_at": "2023-08-01T08:00:00.000Z",
    "updated_at": "2023-08-01T08:00:00.000Z"
  }
}
```

### 1.3 创建店铺

创建新的店铺记录。

**请求方法**: POST  
**URL**: `/shops`

**请求体**:

| 字段名     | 类型    | 必需 | 描述     |
| ---------- | ------- | ---- | -------- |
| name       | string  | 是   | 店铺名称 |
| is_active  | boolean | 是   | 是否启用 |
| sort_order | integer | 否   | 排序顺序 |
| remark     | string  | 否   | 备注信息 |

**请求示例**:

```json
{
  "name": "测试创建的店铺",
  "is_active": true,
  "sort_order": 10,
  "remark": "通过API创建的测试店铺"
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "添加成功",
  "data": {
    "id": 6,
    "name": "测试创建的店铺",
    "is_active": 1,
    "sort_order": 10,
    "remark": "通过API创建的测试店铺",
    "created_at": "2023-08-02T09:00:00.000Z",
    "updated_at": "2023-08-02T09:00:00.000Z"
  }
}
```

### 1.4 更新店铺

更新现有店铺的信息。

**请求方法**: PUT  
**URL**: `/shops/:id`

**URL 参数**:

| 参数名 | 类型    | 必需 | 描述    |
| ------ | ------- | ---- | ------- |
| id     | integer | 是   | 店铺 ID |

**请求体**:

| 字段名     | 类型    | 必需 | 描述     |
| ---------- | ------- | ---- | -------- |
| name       | string  | 否   | 店铺名称 |
| is_active  | boolean | 否   | 是否启用 |
| sort_order | integer | 否   | 排序顺序 |
| remark     | string  | 否   | 备注信息 |

**请求示例**:

```json
{
  "name": "已更新的测试店铺",
  "remark": "这个店铺已通过API更新"
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 6,
    "name": "已更新的测试店铺",
    "is_active": 1,
    "sort_order": 10,
    "remark": "这个店铺已通过API更新",
    "created_at": "2023-08-02T09:00:00.000Z",
    "updated_at": "2023-08-02T10:00:00.000Z"
  }
}
```

### 1.5 删除店铺

删除特定的店铺记录。

**请求方法**: DELETE  
**URL**: `/shops/:id`

**URL 参数**:

| 参数名 | 类型    | 必需 | 描述    |
| ------ | ------- | ---- | ------- |
| id     | integer | 是   | 店铺 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "删除成功"
}
```

### 1.6 切换店铺状态

切换店铺的活跃状态。

**请求方法**: POST  
**URL**: `/shops/:id/toggle`

**URL 参数**:

| 参数名 | 类型    | 必需 | 描述    |
| ------ | ------- | ---- | ------- |
| id     | integer | 是   | 店铺 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "状态已切换",
  "data": {
    "id": 6,
    "is_active": 0,
    "name": "测试店铺"
  }
}
```

### 1.7 更新店铺排序

批量更新多个店铺的排序顺序。

**请求方法**: POST  
**URL**: `/shops/sort`

**请求体**:

包含店铺 ID 和排序顺序的数组：

```json
[
  {
    "id": 1,
    "sort_order": 5
  },
  {
    "id": 2,
    "sort_order": 4
  }
]
```

**响应示例**:

```json
{
  "code": 0,
  "message": "排序更新成功"
}
```

## 2. 店铺出力 API

### 2.1 获取出力数据列表

获取系统中所有的店铺出力数据，支持多种筛选条件。

**请求方法**: GET  
**URL**: `/shop-outputs`

**查询参数**:

| 参数名     | 类型    | 必需 | 描述                       |
| ---------- | ------- | ---- | -------------------------- |
| shop_id    | integer | 否   | 按店铺 ID 筛选             |
| courier_id | integer | 否   | 按快递类型 ID 筛选         |
| date_from  | string  | 否   | 开始日期 (YYYY-MM-DD)      |
| date_to    | string  | 否   | 结束日期 (YYYY-MM-DD)      |
| sort       | string  | 否   | 排序字段，默认 output_date |
| order      | string  | 否   | 排序方向，默认 DESC        |
| search     | string  | 否   | 搜索关键词                 |
| limit      | integer | 否   | 每页记录数                 |
| offset     | integer | 否   | 分页偏移量                 |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "shop_id": 1,
      "courier_id": 1,
      "output_date": "2023-08-01",
      "quantity": 50,
      "notes": "今日测试数据",
      "created_at": "2023-08-01T08:00:00.000Z",
      "updated_at": "2023-08-01T08:00:00.000Z",
      "shop_name": "测试店铺1",
      "courier_name": "顺丰速运"
    }
    // 更多出力数据...
  ]
}
```

### 2.2 获取单条出力记录

根据 ID 获取特定出力记录的详细信息。

**请求方法**: GET  
**URL**: `/shop-outputs/:id`

**URL 参数**:

| 参数名 | 类型    | 必需 | 描述        |
| ------ | ------- | ---- | ----------- |
| id     | integer | 是   | 出力记录 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "shop_id": 1,
    "courier_id": 1,
    "output_date": "2023-08-01",
    "quantity": 50,
    "notes": "今日测试数据",
    "created_at": "2023-08-01T08:00:00.000Z",
    "updated_at": "2023-08-01T08:00:00.000Z",
    "shop_name": "测试店铺1",
    "courier_name": "顺丰速运"
  }
}
```

### 2.3 创建出力记录

创建新的店铺出力记录。

**请求方法**: POST  
**URL**: `/shop-outputs`

**请求体**:

| 字段名      | 类型    | 必需 | 描述                  |
| ----------- | ------- | ---- | --------------------- |
| shop_id     | integer | 是   | 店铺 ID               |
| courier_id  | integer | 是   | 快递类型 ID           |
| output_date | string  | 是   | 出力日期 (YYYY-MM-DD) |
| quantity    | integer | 是   | 出力数量              |
| notes       | string  | 否   | 备注信息              |

**请求示例**:

```json
{
  "shop_id": 1,
  "courier_id": 1,
  "output_date": "2023-08-05",
  "quantity": 99,
  "notes": "通过API创建的测试出力数据"
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "添加成功",
  "data": {
    "id": 17,
    "shop_id": 1,
    "courier_id": 1,
    "output_date": "2023-08-05",
    "quantity": 99,
    "notes": "通过API创建的测试出力数据",
    "created_at": "2023-08-05T10:00:00.000Z",
    "updated_at": "2023-08-05T10:00:00.000Z",
    "shop_name": "测试店铺1",
    "courier_name": "顺丰速运"
  }
}
```

### 2.4 更新出力记录

更新现有出力记录的信息。

**请求方法**: PUT  
**URL**: `/shop-outputs/:id`

**URL 参数**:

| 参数名 | 类型    | 必需 | 描述        |
| ------ | ------- | ---- | ----------- |
| id     | integer | 是   | 出力记录 ID |

**请求体**:

| 字段名      | 类型    | 必需 | 描述                  |
| ----------- | ------- | ---- | --------------------- |
| shop_id     | integer | 是   | 店铺 ID               |
| courier_id  | integer | 是   | 快递类型 ID           |
| output_date | string  | 是   | 出力日期 (YYYY-MM-DD) |
| quantity    | integer | 是   | 出力数量              |
| notes       | string  | 否   | 备注信息              |

**请求示例**:

```json
{
  "shop_id": 1,
  "courier_id": 1,
  "output_date": "2023-08-05",
  "quantity": 88,
  "notes": "已通过API更新的测试出力数据"
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 17,
    "shop_id": 1,
    "courier_id": 1,
    "output_date": "2023-08-05",
    "quantity": 88,
    "notes": "已通过API更新的测试出力数据",
    "created_at": "2023-08-05T10:00:00.000Z",
    "updated_at": "2023-08-05T11:00:00.000Z",
    "shop_name": "测试店铺1",
    "courier_name": "顺丰速运"
  }
}
```

### 2.5 删除出力记录

删除特定的出力记录。

**请求方法**: DELETE  
**URL**: `/shop-outputs/:id`

**URL 参数**:

| 参数名 | 类型    | 必需 | 描述        |
| ------ | ------- | ---- | ----------- |
| id     | integer | 是   | 出力记录 ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "删除成功"
}
```

### 2.6 获取当日出力数据

获取当前日期的所有出力数据。

**请求方法**: GET  
**URL**: `/shop-outputs/recent`

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "shop_id": 1,
      "courier_id": 1,
      "output_date": "2023-08-05",
      "quantity": 50,
      "notes": "今日测试数据",
      "created_at": "2023-08-05T08:00:00.000Z",
      "updated_at": "2023-08-05T08:00:00.000Z",
      "shop_name": "测试店铺1",
      "courier_name": "顺丰速运"
    }
    // 更多当日数据...
  ]
}
```

### 2.7 获取今日出力数据

获取今天的所有出力数据。

**请求方法**: GET  
**URL**: `/shop-outputs/today`

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "shop_id": 1,
      "courier_id": 1,
      "output_date": "2023-08-05",
      "quantity": 50,
      "notes": "今日测试数据",
      "created_at": "2023-08-05T08:00:00.000Z",
      "updated_at": "2023-08-05T08:00:00.000Z",
      "shop_name": "测试店铺1",
      "courier_name": "顺丰速运"
    }
    // 更多今日数据...
  ]
}
```

## 3. 统计分析 API

### 3.1 按店铺统计

获取按店铺分组的出力数据统计。

**请求方法**: GET  
**URL**: `/stats/shop-outputs/shops`

**查询参数**:

| 参数名    | 类型   | 必需 | 描述                  |
| --------- | ------ | ---- | --------------------- |
| date_from | string | 否   | 开始日期 (YYYY-MM-DD) |
| date_to   | string | 否   | 结束日期 (YYYY-MM-DD) |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "shop_id": 1,
      "shop_name": "测试店铺1",
      "total_quantity": 100,
      "days_count": 2
    },
    {
      "shop_id": 2,
      "shop_name": "测试店铺2",
      "total_quantity": 70,
      "days_count": 2
    }
    // 更多店铺统计...
  ]
}
```

### 3.2 按快递类型统计

获取按快递类型分组的出力数据统计。

**请求方法**: GET  
**URL**: `/stats/shop-outputs/couriers`

**查询参数**:

| 参数名    | 类型   | 必需 | 描述                  |
| --------- | ------ | ---- | --------------------- |
| date_from | string | 否   | 开始日期 (YYYY-MM-DD) |
| date_to   | string | 否   | 结束日期 (YYYY-MM-DD) |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "courier_id": 1,
      "courier_name": "顺丰速运",
      "total_quantity": 155,
      "shops_count": 3
    },
    {
      "courier_id": 2,
      "courier_name": "圆通快递",
      "total_quantity": 125,
      "shops_count": 2
    }
    // 更多快递类型统计...
  ]
}
```

### 3.3 按日期统计

获取按日期分组的出力数据统计。

**请求方法**: GET  
**URL**: `/stats/shop-outputs/dates`

**查询参数**:

| 参数名    | 类型   | 必需 | 描述                  |
| --------- | ------ | ---- | --------------------- |
| date_from | string | 否   | 开始日期 (YYYY-MM-DD) |
| date_to   | string | 否   | 结束日期 (YYYY-MM-DD) |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "output_date": "2023-08-05",
      "total_quantity": 280,
      "shops_count": 4,
      "couriers_count": 2
    },
    {
      "output_date": "2023-08-04",
      "total_quantity": 180,
      "shops_count": 3,
      "couriers_count": 2
    }
    // 更多日期统计...
  ]
}
```

### 3.4 获取总计数据

获取指定日期范围内的出力数据总计。

**请求方法**: GET  
**URL**: `/stats/shop-outputs/total`

**查询参数**:

| 参数名    | 类型   | 必需 | 描述                  |
| --------- | ------ | ---- | --------------------- |
| date_from | string | 否   | 开始日期 (YYYY-MM-DD) |
| date_to   | string | 否   | 结束日期 (YYYY-MM-DD) |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "total_quantity": 460,
    "average_daily": 230,
    "days_count": 2,
    "shops_count": 4,
    "couriers_count": 2
  }
}
```

## 4. 仪表盘 API

### 4.1 获取今日出力概览

获取今日的出力数据概览。

**请求方法**: GET  
**URL**: `/dashboard/shop-outputs/today`

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "date": "2023-08-05",
    "total_quantity": 280,
    "shops_count": 5,
    "active_shops_count": 4,
    "coverage_rate": 80,
    "couriers_data": [
      {
        "courier_id": 1,
        "courier_name": "顺丰速运",
        "total_quantity": 155,
        "shops_count": 3
      },
      {
        "courier_id": 2,
        "courier_name": "圆通快递",
        "total_quantity": 125,
        "shops_count": 2
      }
    ],
    "shops_data": [
      {
        "shop_id": 1,
        "shop_name": "测试店铺1",
        "has_data": true,
        "total_quantity": 80
      },
      {
        "shop_id": 2,
        "shop_name": "测试店铺2",
        "has_data": true,
        "total_quantity": 70
      }
      // 更多店铺数据...
    ]
  }
}
```

### 4.2 获取明日出力数据

获取明日的出力数据。

**请求方法**: GET  
**URL**: `/dashboard/shop-outputs/tomorrow`

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "date": "2023-08-06",
    "total_predicted_quantity": 50,
    "shops_count": 4,
    "predicted_shops_count": 1,
    "coverage_rate": 25,
    "couriers_data": [
      {
        "courier_id": 1,
        "courier_name": "顺丰速运",
        "total_quantity": 50,
        "shops_count": 1
      }
    ],
    "shops_data": [
      {
        "shop_id": 1,
        "shop_name": "测试店铺1",
        "total_quantity": 50,
        "couriers": [
          {
            "courier_id": 1,
            "courier_name": "顺丰速运",
            "predicted_quantity": 50
          }
        ]
      }
    ],
    "raw_predictions": [
      {
        "shop_id": 1,
        "shop_name": "测试店铺1",
        "courier_id": 1,
        "courier_name": "顺丰速运",
        "predicted_quantity": 50,
        "days_count": 1
      }
    ]
  }
}
```
