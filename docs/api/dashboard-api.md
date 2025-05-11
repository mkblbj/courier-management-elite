# 仪表盘 API 文档

本文档详细描述了仪表盘相关的 API 接口，这些接口主要用于获取店铺出力的聚合数据和预测数据，用于在仪表盘页面展示。

## 基本信息

- 基础路径: `/api/dashboard`
- 响应格式: JSON
- 状态码:
  - `200` 成功
  - `400` 请求参数错误
  - `500` 服务器内部错误

## 通用响应格式

所有 API 响应遵循以下格式:

```json
{
  "code": 0,       // 0表示成功，非0表示错误
  "message": "描述信息",
  "data": { ... }  // 数据主体，错误时可能为null
}
```

## API 接口列表

### 1. 获取今日店铺出力概览

获取今日店铺出力数据的聚合信息。

- **URL**: `/shop-outputs/today`
- **方法**: `GET`
- **查询参数**:
  - `category_id` (可选): 店铺类别 ID，用于筛选特定类别的店铺出力数据

#### 请求示例

```http
GET /api/dashboard/shop-outputs/today?category_id=1
```

#### 响应示例

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "date": "2023-06-01",
    "total_quantity": 285,
    "shops_count": 5,
    "active_shops_count": 3,
    "coverage_rate": 60.0,
    "couriers_data": [
      {
        "courier_id": 1,
        "courier_name": "顺丰速运",
        "total_quantity": 150,
        "shops_count": 2
      },
      {
        "courier_id": 2,
        "courier_name": "京东快递",
        "total_quantity": 85,
        "shops_count": 2
      },
      {
        "courier_id": 3,
        "courier_name": "圆通速递",
        "total_quantity": 50,
        "shops_count": 1
      }
    ],
    "categories_data": [
      {
        "category_id": 1,
        "category_name": "淘宝",
        "total_quantity": 175,
        "shops": [
          {
            "shop_id": 1,
            "shop_name": "淘宝店1",
            "has_data": true,
            "total_quantity": 100
          },
          {
            "shop_id": 2,
            "shop_name": "淘宝店2",
            "has_data": true,
            "total_quantity": 75
          }
        ]
      },
      {
        "category_id": 2,
        "category_name": "京东",
        "total_quantity": 110,
        "shops": [
          {
            "shop_id": 3,
            "shop_name": "京东店",
            "has_data": true,
            "total_quantity": 110
          }
        ]
      },
      {
        "category_id": 3,
        "category_name": "拼多多",
        "total_quantity": 0,
        "shops": [
          {
            "shop_id": 4,
            "shop_name": "拼多多店1",
            "has_data": false,
            "total_quantity": 0
          },
          {
            "shop_id": 5,
            "shop_name": "拼多多店2",
            "has_data": false,
            "total_quantity": 0
          }
        ]
      }
    ],
    "shops_data": [
      {
        "shop_id": 1,
        "shop_name": "淘宝店1",
        "category_id": 1,
        "category_name": "淘宝",
        "has_data": true,
        "total_quantity": 100
      },
      {
        "shop_id": 3,
        "shop_name": "京东店",
        "category_id": 2,
        "category_name": "京东",
        "has_data": true,
        "total_quantity": 110
      },
      {
        "shop_id": 2,
        "shop_name": "淘宝店2",
        "category_id": 1,
        "category_name": "淘宝",
        "has_data": true,
        "total_quantity": 75
      },
      {
        "shop_id": 4,
        "shop_name": "拼多多店1",
        "category_id": 3,
        "category_name": "拼多多",
        "has_data": false,
        "total_quantity": 0
      },
      {
        "shop_id": 5,
        "shop_name": "拼多多店2",
        "category_id": 3,
        "category_name": "拼多多",
        "has_data": false,
        "total_quantity": 0
      }
    ]
  }
}
```

#### 响应字段说明

| 字段名                           | 类型    | 描述                       |
| -------------------------------- | ------- | -------------------------- |
| date                             | string  | 数据日期 (YYYY-MM-DD 格式) |
| total_quantity                   | number  | 总出力量                   |
| shops_count                      | number  | 店铺总数                   |
| active_shops_count               | number  | 有出力记录的店铺数量       |
| coverage_rate                    | number  | 店铺覆盖率 (百分比)        |
| couriers_data                    | array   | 按快递类型分组的统计       |
| couriers_data[].courier_id       | number  | 快递类型 ID                |
| couriers_data[].courier_name     | string  | 快递类型名称               |
| couriers_data[].total_quantity   | number  | 该快递类型的总出力量       |
| couriers_data[].shops_count      | number  | 使用该快递类型的店铺数量   |
| categories_data                  | array   | 按店铺类别分组的统计       |
| categories_data[].category_id    | number  | 类别 ID                    |
| categories_data[].category_name  | string  | 类别名称                   |
| categories_data[].total_quantity | number  | 该类别的总出力量           |
| categories_data[].shops          | array   | 该类别下的店铺数据         |
| shops_data                       | array   | 所有店铺的出力数据         |
| shops_data[].shop_id             | number  | 店铺 ID                    |
| shops_data[].shop_name           | string  | 店铺名称                   |
| shops_data[].category_id         | number  | 类别 ID                    |
| shops_data[].category_name       | string  | 类别名称                   |
| shops_data[].has_data            | boolean | 是否有出力数据             |
| shops_data[].total_quantity      | number  | 店铺总出力量               |

### 2. 获取明日店铺出力预测

获取明日店铺出力数据的预测信息。

- **URL**: `/shop-outputs/tomorrow`
- **方法**: `GET`
- **查询参数**:
  - `category_id` (可选): 店铺类别 ID，用于筛选特定类别的店铺出力数据

#### 请求示例

```http
GET /api/dashboard/shop-outputs/tomorrow?category_id=1
```

#### 响应示例

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "date": "2023-06-02",
    "total_predicted_quantity": 320,
    "shops_count": 5,
    "predicted_shops_count": 3,
    "coverage_rate": 60.0,
    "couriers_data": [
      {
        "courier_id": 1,
        "courier_name": "顺丰速运",
        "total_quantity": 180,
        "shops_count": 3
      },
      {
        "courier_id": 2,
        "courier_name": "京东快递",
        "total_quantity": 90,
        "shops_count": 2
      },
      {
        "courier_id": 3,
        "courier_name": "圆通速递",
        "total_quantity": 50,
        "shops_count": 1
      }
    ],
    "categories_data": [
      {
        "category_id": 1,
        "category_name": "淘宝",
        "total_quantity": 200,
        "shops": [
          {
            "shop_id": 1,
            "shop_name": "淘宝店1",
            "category_id": 1,
            "category_name": "淘宝",
            "total_quantity": 120,
            "couriers": [
              {
                "courier_id": 1,
                "courier_name": "顺丰速运",
                "predicted_quantity": 70
              },
              {
                "courier_id": 2,
                "courier_name": "京东快递",
                "predicted_quantity": 50
              }
            ]
          },
          {
            "shop_id": 2,
            "shop_name": "淘宝店2",
            "category_id": 1,
            "category_name": "淘宝",
            "total_quantity": 80,
            "couriers": [
              {
                "courier_id": 1,
                "courier_name": "顺丰速运",
                "predicted_quantity": 50
              },
              {
                "courier_id": 3,
                "courier_name": "圆通速递",
                "predicted_quantity": 30
              }
            ]
          }
        ]
      },
      {
        "category_id": 2,
        "category_name": "京东",
        "total_quantity": 120,
        "shops": [
          {
            "shop_id": 3,
            "shop_name": "京东店",
            "category_id": 2,
            "category_name": "京东",
            "total_quantity": 120,
            "couriers": [
              {
                "courier_id": 1,
                "courier_name": "顺丰速运",
                "predicted_quantity": 60
              },
              {
                "courier_id": 2,
                "courier_name": "京东快递",
                "predicted_quantity": 40
              },
              {
                "courier_id": 3,
                "courier_name": "圆通速递",
                "predicted_quantity": 20
              }
            ]
          }
        ]
      }
    ],
    "shops_data": [
      {
        "shop_id": 1,
        "shop_name": "淘宝店1",
        "category_id": 1,
        "category_name": "淘宝",
        "total_quantity": 120,
        "couriers": [
          {
            "courier_id": 1,
            "courier_name": "顺丰速运",
            "predicted_quantity": 70
          },
          {
            "courier_id": 2,
            "courier_name": "京东快递",
            "predicted_quantity": 50
          }
        ]
      },
      {
        "shop_id": 3,
        "shop_name": "京东店",
        "category_id": 2,
        "category_name": "京东",
        "total_quantity": 120,
        "couriers": [
          {
            "courier_id": 1,
            "courier_name": "顺丰速运",
            "predicted_quantity": 60
          },
          {
            "courier_id": 2,
            "courier_name": "京东快递",
            "predicted_quantity": 40
          },
          {
            "courier_id": 3,
            "courier_name": "圆通速递",
            "predicted_quantity": 20
          }
        ]
      },
      {
        "shop_id": 2,
        "shop_name": "淘宝店2",
        "category_id": 1,
        "category_name": "淘宝",
        "total_quantity": 80,
        "couriers": [
          {
            "courier_id": 1,
            "courier_name": "顺丰速运",
            "predicted_quantity": 50
          },
          {
            "courier_id": 3,
            "courier_name": "圆通速递",
            "predicted_quantity": 30
          }
        ]
      }
    ],
    "raw_predictions": [
      {
        "shop_id": 1,
        "shop_name": "淘宝店1",
        "courier_id": 1,
        "courier_name": "顺丰速运",
        "predicted_quantity": 70,
        "days_count": 1
      },
      {
        "shop_id": 1,
        "shop_name": "淘宝店1",
        "courier_id": 2,
        "courier_name": "京东快递",
        "predicted_quantity": 50,
        "days_count": 1
      },
      {
        "shop_id": 2,
        "shop_name": "淘宝店2",
        "courier_id": 1,
        "courier_name": "顺丰速运",
        "predicted_quantity": 50,
        "days_count": 1
      },
      {
        "shop_id": 2,
        "shop_name": "淘宝店2",
        "courier_id": 3,
        "courier_name": "圆通速递",
        "predicted_quantity": 30,
        "days_count": 1
      },
      {
        "shop_id": 3,
        "shop_name": "京东店",
        "courier_id": 1,
        "courier_name": "顺丰速运",
        "predicted_quantity": 60,
        "days_count": 1
      },
      {
        "shop_id": 3,
        "shop_name": "京东店",
        "courier_id": 2,
        "courier_name": "京东快递",
        "predicted_quantity": 40,
        "days_count": 1
      },
      {
        "shop_id": 3,
        "shop_name": "京东店",
        "courier_id": 3,
        "courier_name": "圆通速递",
        "predicted_quantity": 20,
        "days_count": 1
      }
    ]
  }
}
```

#### 响应字段说明

| 字段名                   | 类型   | 描述                       |
| ------------------------ | ------ | -------------------------- |
| date                     | string | 预测日期 (YYYY-MM-DD 格式) |
| total_predicted_quantity | number | 总预测出力量               |
| shops_count              | number | 店铺总数                   |
| predicted_shops_count    | number | 有预测数据的店铺数量       |
| coverage_rate            | number | 店铺覆盖率 (百分比)        |
| couriers_data            | array  | 按快递类型分组的预测统计   |
| categories_data          | array  | 按店铺类别分组的预测统计   |
| shops_data               | array  | 所有店铺的预测出力数据     |
| shops_data[].couriers    | array  | 店铺使用的快递类型及预测量 |
| raw_predictions          | array  | 原始预测数据列表           |

### 3. 清除仪表盘数据缓存

清除仪表盘数据的缓存，适用于手动更新数据后需要立即刷新缓存的场景。

- **URL**: `/cache/clear`
- **方法**: `POST`

#### 请求示例

```http
POST /api/dashboard/cache/clear
```

#### 响应示例

```json
{
  "code": 0,
  "message": "缓存清除成功"
}
```

## 性能与缓存说明

1. 所有仪表盘 API 默认有 60 秒的缓存时间，以提高系统性能。
2. 缓存键基于请求参数（如 category_id）构建，不同参数组合有独立的缓存。
3. 当添加或修改出力数据后，如需立即看到新数据，可以调用缓存清除 API。
4. 所有 API 的响应时间目标控制在 200ms 以内。

## 错误处理

所有 API 在发生错误时将返回适当的 HTTP 状态码和错误信息：

```json
{
  "code": 500,
  "message": "获取数据失败",
  "error": "错误详情（仅开发环境可见）"
}
```

## 注意事项

1. 今日出力数据仅包含已录入系统的当日记录。
2. 明日出力预测数据基于系统中明确录入的预测记录。
3. API 使用适当的缓存机制减轻服务器负担，可能存在最长 1 分钟的数据延迟。
