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
