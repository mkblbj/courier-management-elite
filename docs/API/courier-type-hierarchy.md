# 母子快递类型 API

本文档描述快递类型的母子关系 API 端点，用于前端集成和使用。

## 获取快递类型层级结构

获取所有母类型及其关联的子类型，以及子类型数量统计。

**请求**:

```
GET /api/couriers/hierarchy
```

**响应**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "ゆうパケット",
      "code": "YU_PACKET",
      "parent_id": null,
      "children": [
        {
          "id": 3,
          "name": "ゆうパケット (1CM)",
          "code": "YU_PACKET_1CM",
          "parent_id": 1
        },
        {
          "id": 4,
          "name": "ゆうパケット (2CM)",
          "code": "YU_PACKET_2CM",
          "parent_id": 1
        }
      ],
      "totalCount": 15
    },
    {
      "id": 2,
      "name": "ゆうメール",
      "code": "YU_MAIL",
      "parent_id": null,
      "children": [],
      "totalCount": 0
    }
  ]
}
```

## 获取特定母类型的子类型

获取指定母类型 ID 的所有子类型和统计数据。

**请求**:

```
GET /api/couriers/:parentId/children
```

**参数**:

- `parentId`: 母类型 ID (必须)

**响应**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "parentType": {
      "id": 1,
      "name": "ゆうパケット",
      "code": "YU_PACKET",
      "parent_id": null
    },
    "childTypes": [
      {
        "id": 3,
        "name": "ゆうパケット (1CM)",
        "code": "YU_PACKET_1CM",
        "parent_id": 1
      },
      {
        "id": 4,
        "name": "ゆうパケット (2CM)",
        "code": "YU_PACKET_2CM",
        "parent_id": 1
      }
    ],
    "totalCount": 15
  }
}
```

## 创建快递类型 (母类型或子类型)

创建新的快递类型。如果包含 parent_id 字段，则创建为子类型，否则创建为母类型。

**请求**:

```
POST /api/couriers
```

**请求体**:

```json
{
  "name": "ゆうパケット (3CM)",
  "code": "YU_PACKET_3CM",
  "parent_id": 1,
  "remark": "最大厚度3CM"
}
```

**响应**:

```json
{
  "code": 0,
  "message": "添加成功",
  "data": {
    "id": 5,
    "name": "ゆうパケット (3CM)",
    "code": "YU_PACKET_3CM",
    "parent_id": 1,
    "remark": "最大厚度3CM",
    "is_active": 1,
    "sort_order": 0,
    "created_at": "2023-08-15T12:34:56Z",
    "updated_at": "2023-08-15T12:34:56Z"
  }
}
```

## 更新快递类型

更新现有快递类型的信息。注意：不允许修改 parent_id，以防止数据一致性问题。

**请求**:

```
PUT /api/couriers/:id
```

**请求体**:

```json
{
  "name": "ゆうパケット (修改后)",
  "code": "YU_PACKET_UPDATED",
  "remark": "已更新的备注"
}
```

**响应**:

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 3,
    "name": "ゆうパケット (修改后)",
    "code": "YU_PACKET_UPDATED",
    "parent_id": 1,
    "remark": "已更新的备注",
    "is_active": 1,
    "sort_order": 0,
    "created_at": "2023-08-15T10:00:00Z",
    "updated_at": "2023-08-15T14:30:45Z"
  }
}
```

## 删除快递类型

删除指定的快递类型。如果是母类型且有子类型，会返回错误。

**请求**:

```
DELETE /api/couriers/:id
```

**响应 (成功)**:

```json
{
  "code": 0,
  "message": "删除成功"
}
```

**响应 (有子类型的母类型)**:

```json
{
  "code": 400,
  "message": "不能删除有子类型的母类型"
}
```

## 错误处理

所有 API 端点遵循统一的错误响应格式：

```json
{
  "code": 400, // 错误代码
  "message": "错误信息"
}
```

常见错误代码：

- 400: 请求数据无效或操作不允许
- 404: 请求的资源不存在
- 500: 服务器内部错误

## 前端集成示例

### React Hooks 示例

```tsx
// useCourierTypeHierarchy.ts
import { useState, useEffect } from "react";
import axios from "axios";

interface CourierType {
  id: number;
  name: string;
  code: string;
  parent_id: number | null;
}

interface CourierTypeHierarchyItem extends CourierType {
  children: CourierType[];
  totalCount: number;
}

export function useCourierTypeHierarchy() {
  const [hierarchy, setHierarchy] = useState<CourierTypeHierarchyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/couriers/hierarchy");
        if (response.data.code === 0) {
          setHierarchy(response.data.data);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError("获取快递类型层级结构失败");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHierarchy();
  }, []);

  return { hierarchy, loading, error };
}
```

## 发货记录母子类型汇总 API

本节描述发货记录 API 对快递类型母子关系的支持，以及数据汇总功能。

### 获取发货记录（包含母子类型层级）

获取发货记录列表，同时支持母子类型数据汇总。

**请求**:

```
GET /api/shipping/hierarchy
```

**查询参数**:

| 参数名           | 类型    | 必需 | 描述                                                                    |
| ---------------- | ------- | ---- | ----------------------------------------------------------------------- |
| includeHierarchy | boolean | 否   | 是否包含层级汇总数据，true 表示返回带层级的数据，false 表示返回普通列表 |
| date             | string  | 否   | 筛选特定日期的记录，格式为 YYYY-MM-DD                                   |
| date_from        | string  | 否   | 起始日期，格式为 YYYY-MM-DD                                             |
| date_to          | string  | 否   | 结束日期，格式为 YYYY-MM-DD                                             |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "ゆうパケット",
      "parent_id": null,
      "children": [
        {
          "id": 3,
          "name": "ゆうパケット (1CM)",
          "parent_id": 1
        }
      ],
      "shipping": {
        "own": [
          {
            "id": 1,
            "courier_id": 1,
            "courier_name": "ゆうパケット",
            "quantity": 10,
            "date": "2023-07-15"
          }
        ],
        "children": [
          {
            "id": 2,
            "courier_id": 3,
            "courier_name": "ゆうパケット (1CM)",
            "quantity": 5,
            "date": "2023-07-15"
          }
        ],
        "total": [
          {
            "id": 1,
            "courier_id": 1,
            "courier_name": "ゆうパケット",
            "quantity": 10,
            "date": "2023-07-15"
          },
          {
            "id": 2,
            "courier_id": 3,
            "courier_name": "ゆうパケット (1CM)",
            "quantity": 5,
            "date": "2023-07-15"
          }
        ]
      }
    }
    // 更多母类型记录...
  ]
}
```

### 获取特定母类型的发货统计

获取指定母类型 ID 的发货统计数据，包括其自身和子类型的发货记录。

**请求**:

```
GET /api/shipping/stats/parent/:id
```

**URL 参数**:

| 参数名 | 类型    | 必需 | 描述      |
| ------ | ------- | ---- | --------- |
| id     | integer | 是   | 母类型 ID |

**查询参数**:

| 参数名    | 类型   | 必需 | 描述                                  |
| --------- | ------ | ---- | ------------------------------------- |
| date      | string | 否   | 筛选特定日期的记录，格式为 YYYY-MM-DD |
| date_from | string | 否   | 起始日期，格式为 YYYY-MM-DD           |
| date_to   | string | 否   | 结束日期，格式为 YYYY-MM-DD           |

**响应示例**:

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "courierType": {
      "id": 1,
      "name": "ゆうパケット",
      "parent_id": null
    },
    "children": [
      {
        "id": 3,
        "name": "ゆうパケット (1CM)",
        "parent_id": 1
      },
      {
        "id": 4,
        "name": "ゆうパケット (2CM)",
        "parent_id": 1
      }
    ],
    "shipping": {
      "own": [
        {
          "id": 1,
          "courier_id": 1,
          "courier_name": "ゆうパケット",
          "quantity": 10,
          "date": "2023-07-15"
        }
      ],
      "children": [
        {
          "id": 2,
          "courier_id": 3,
          "courier_name": "ゆうパケット (1CM)",
          "quantity": 5,
          "date": "2023-07-15"
        },
        {
          "id": 3,
          "courier_id": 4,
          "courier_name": "ゆうパケット (2CM)",
          "quantity": 8,
          "date": "2023-07-15"
        }
      ],
      "total": [
        {
          "id": 1,
          "courier_id": 1,
          "courier_name": "ゆうパケット",
          "quantity": 10,
          "date": "2023-07-15"
        },
        {
          "id": 2,
          "courier_id": 3,
          "courier_name": "ゆうパケット (1CM)",
          "quantity": 5,
          "date": "2023-07-15"
        },
        {
          "id": 3,
          "courier_id": 4,
          "courier_name": "ゆうパケット (2CM)",
          "quantity": 8,
          "date": "2023-07-15"
        }
      ]
    }
  }
}
```
