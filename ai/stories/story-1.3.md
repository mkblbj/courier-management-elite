# 母子快递类型管理 - Epic 1：后端实现 - 故事 3：发货记录 API 更新

## 状态: 已完成

## 简介

本故事实现发货记录与母子快递类型的集成功能，使发货记录 API 能够支持母子类型数据的汇总统计。母快递类型的发货记录将包含自身直接记录的数据和所有子类型发货记录的数据之和，为前端提供完整的统计功能。

## 验收标准

1. 发货记录 API 能正确汇总母类型的数据（自身记录 + 子类型记录）
2. 可以查询特定母类型的发货统计数据，包括自身记录和子类型记录
3. 发货记录查询支持层级和汇总选项
4. 所有 API 端点有适当的错误处理
5. 集成测试通过

## 子任务

### 子任务 1: 更新发货记录模型

- 更新发货记录模型以支持母子类型数据汇总
- 实现子类型发货记录查询功能
- 实现统计计算逻辑

**具体实现例子:**

```javascript
// backend/src/models/shippingModel.js
const db = require("../configs/db");

// 获取发货记录列表（支持母子类型数据汇总）
exports.getShippingRecords = async (options = {}) => {
  try {
    const { includeHierarchy = false, ...filterOptions } = options;

    // 基本查询
    const query = `
      SELECT s.*, ct.name as courier_type_name, ct.parent_id
      FROM shipping s
      JOIN courier_types ct ON s.courier_type_id = ct.id
      WHERE 1=1
    `;

    // 添加过滤条件
    // ... 根据filterOptions添加WHERE条件 ...

    const [records] = await db.execute(query);

    // 如果需要包含层级关系和汇总统计
    if (includeHierarchy) {
      // 获取所有母类型
      const [parentTypes] = await db.execute(`
        SELECT * FROM courier_types
        WHERE parent_id IS NULL
      `);

      // 为每个母类型计算自身和子类型的发货记录总和
      const results = await Promise.all(
        parentTypes.map(async (parent) => {
          // 获取所有子类型
          const [children] = await db.execute(
            `
          SELECT id FROM courier_types
          WHERE parent_id = ?
        `,
            [parent.id]
          );

          const childIds = children.map((child) => child.id);

          // 获取子类型的发货记录
          let childrenRecords = [];
          if (childIds.length > 0) {
            const placeholders = childIds.map(() => "?").join(",");
            [childrenRecords] = await db.execute(
              `
            SELECT * FROM shipping
            WHERE courier_type_id IN (${placeholders})
          `,
              childIds
            );
          }

          // 获取母类型自身的发货记录
          const [parentRecords] = await db.execute(
            `
          SELECT * FROM shipping
          WHERE courier_type_id = ?
        `,
            [parent.id]
          );

          // 合并统计数据
          return {
            ...parent,
            shipping: {
              own: parentRecords,
              children: childrenRecords,
              total: [...parentRecords, ...childrenRecords],
            },
          };
        })
      );

      return results;
    }

    return records;
  } catch (error) {
    console.error("获取发货记录失败:", error);
    throw error;
  }
};

// 根据类型ID获取发货记录
exports.getByTypeId = async (typeId) => {
  try {
    const [records] = await db.execute(
      `SELECT * FROM shipping WHERE courier_type_id = ?`,
      [typeId]
    );
    return records;
  } catch (error) {
    console.error(`获取类型ID ${typeId} 的发货记录失败:`, error);
    throw error;
  }
};

// 根据多个类型ID获取发货记录
exports.getByTypeIds = async (typeIds) => {
  try {
    if (!typeIds.length) return [];

    const placeholders = typeIds.map(() => "?").join(",");
    const [records] = await db.execute(
      `SELECT * FROM shipping WHERE courier_type_id IN (${placeholders})`,
      typeIds
    );
    return records;
  } catch (error) {
    console.error(`获取多个类型的发货记录失败:`, error);
    throw error;
  }
};

// 其他发货记录相关方法
// ...
```

### 子任务 2: 创建发货记录控制器方法

- 实现获取发货记录的控制器方法（支持层级查询）
- 实现获取母类型发货统计的控制器方法
- 添加适当的错误处理和验证

**具体实现例子:**

```javascript
// backend/src/controllers/shippingController.js
const Shipping = require("../models/shippingModel");
const CourierType = require("../models/courierTypeModel");
const { validationResult } = require("express-validator");

// 获取发货记录列表
exports.getShippingRecords = async (req, res) => {
  try {
    const { includeHierarchy, ...filters } = req.query;

    const records = await Shipping.getShippingRecords({
      includeHierarchy: includeHierarchy === "true",
      ...filters,
    });

    res.status(200).json(records);
  } catch (error) {
    console.error("获取发货记录失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 获取特定母类型的发货统计
exports.getParentTypeShippingStats = async (req, res) => {
  try {
    const { id } = req.params;

    // 验证是否为母类型
    const courierType = await CourierType.findById(id);
    if (!courierType) {
      return res.status(404).json({ message: "快递类型不存在" });
    }

    if (courierType.parent_id !== null) {
      return res.status(400).json({ message: "只能查询母类型的统计数据" });
    }

    // 获取子类型
    const children = await CourierType.getChildren(id);
    const childIds = children.map((child) => child.id);

    // 获取母类型自身的发货记录
    const ownRecords = await Shipping.getByTypeId(id);

    // 获取子类型的发货记录
    const childrenRecords = await Shipping.getByTypeIds(childIds);

    // 合并统计
    const stats = {
      courierType,
      children,
      shipping: {
        own: ownRecords,
        children: childrenRecords,
        total: [...ownRecords, ...childrenRecords],
      },
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("获取统计数据失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 其他发货记录相关方法
// ...
```

### 子任务 3: 创建发货记录路由

- 定义获取发货记录的路由（支持层级查询）
- 定义获取母类型发货统计的路由
- 添加请求验证中间件

**具体实现例子:**

```javascript
// backend/src/routes/shippingRoutes.js
const express = require("express");
const router = express.Router();
const { param, query } = require("express-validator");
const shippingController = require("../controllers/shippingController");

// 获取发货记录列表（支持层级和汇总）
router.get(
  "/shipping",
  [
    query("includeHierarchy")
      .optional()
      .isBoolean()
      .withMessage("includeHierarchy必须是布尔值"),
  ],
  shippingController.getShippingRecords
);

// 获取特定母类型的发货统计
router.get(
  "/shipping/stats/parent/:id",
  param("id").isInt().withMessage("ID必须是整数"),
  shippingController.getParentTypeShippingStats
);

// 其他路由...

module.exports = router;
```

### 子任务 4: 集成到应用程序

- 将路由集成到 Express 应用程序中
- 确保正确处理 JSON 请求体

**具体实现例子:**

```javascript
// backend/src/index.js
const express = require("express");
const cors = require("cors");
const courierTypeRoutes = require("./routes/courierTypeRoutes");
const shippingRoutes = require("./routes/shippingRoutes");
// 其他路由导入...

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use("/api", courierTypeRoutes);
app.use("/api", shippingRoutes);
// 其他路由...

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "服务器错误" });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;
```

### 子任务 5: 编写集成测试

- 测试发货记录 API 端点的功能
- 验证母子类型数据汇总功能
- 验证错误处理

**具体实现例子:**

```javascript
// backend/src/tests/integration/shippingRoutes.test.js
const request = require("supertest");
const app = require("../../index");
const Shipping = require("../../models/shippingModel");
const CourierType = require("../../models/courierTypeModel");

// 模拟模型
jest.mock("../../models/shippingModel");
jest.mock("../../models/courierTypeModel");

describe("发货记录API端点", () => {
  // 获取发货记录测试
  test("GET /api/shipping应返回发货记录列表", async () => {
    const mockRecords = [
      { id: 1, courier_type_id: 1, tracking_number: "123456" },
      { id: 2, courier_type_id: 3, tracking_number: "789012" },
    ];

    Shipping.getShippingRecords.mockResolvedValue(mockRecords);

    const response = await request(app)
      .get("/api/shipping")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toEqual(mockRecords);
  });

  // 测试包含层级和汇总的查询
  test("GET /api/shipping?includeHierarchy=true应返回带层级和汇总的数据", async () => {
    const mockParent = { id: 1, name: "母类型", parent_id: null };
    const mockChildren = [{ id: 3, name: "子类型", parent_id: 1 }];
    const mockParentRecords = [
      { id: 1, courier_type_id: 1, tracking_number: "123456" },
    ];
    const mockChildrenRecords = [
      { id: 2, courier_type_id: 3, tracking_number: "789012" },
    ];

    const mockResult = [
      {
        ...mockParent,
        shipping: {
          own: mockParentRecords,
          children: mockChildrenRecords,
          total: [...mockParentRecords, ...mockChildrenRecords],
        },
      },
    ];

    Shipping.getShippingRecords.mockResolvedValue(mockResult);

    const response = await request(app)
      .get("/api/shipping?includeHierarchy=true")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toEqual(mockResult);
    expect(Shipping.getShippingRecords).toHaveBeenCalledWith({
      includeHierarchy: true,
    });
  });

  // 测试获取母类型发货统计
  test("GET /api/shipping/stats/parent/:id应返回母类型统计数据", async () => {
    const parentId = "1";
    const mockParent = { id: 1, name: "母类型", parent_id: null };
    const mockChildren = [{ id: 3, name: "子类型", parent_id: 1 }];
    const mockParentRecords = [
      { id: 1, courier_type_id: 1, tracking_number: "123456" },
    ];
    const mockChildrenRecords = [
      { id: 2, courier_type_id: 3, tracking_number: "789012" },
    ];

    CourierType.findById.mockResolvedValue(mockParent);
    CourierType.getChildren.mockResolvedValue(mockChildren);
    Shipping.getByTypeId.mockResolvedValue(mockParentRecords);
    Shipping.getByTypeIds.mockResolvedValue(mockChildrenRecords);

    const response = await request(app)
      .get(`/api/shipping/stats/parent/${parentId}`)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toEqual({
      courierType: mockParent,
      children: mockChildren,
      shipping: {
        own: mockParentRecords,
        children: mockChildrenRecords,
        total: [...mockParentRecords, ...mockChildrenRecords],
      },
    });
  });

  // 测试查询非母类型的错误处理
  test("查询非母类型的统计数据应返回400错误", async () => {
    const childId = "3";
    const mockChild = { id: 3, name: "子类型", parent_id: 1 };

    CourierType.findById.mockResolvedValue(mockChild);

    const response = await request(app)
      .get(`/api/shipping/stats/parent/${childId}`)
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body.message).toBe("只能查询母类型的统计数据");
  });
});
```

## API 文档

### 获取发货记录（包含母子类型汇总）

**GET /api/shipping?includeHierarchy=true**

返回发货记录列表，当 includeHierarchy=true 时，返回带母子类型层级关系和汇总统计的数据。

**请求参数:**

- includeHierarchy: boolean (可选) - 是否包含层级关系和汇总统计

**响应格式例子:**

```json
[
  {
    "id": 1,
    "name": "ゆうパケット",
    "parent_id": null,
    "shipping": {
      "own": [
        {
          "id": 1,
          "courier_type_id": 1,
          "tracking_number": "123456",
          "shipping_date": "2023-05-15"
        }
      ],
      "children": [
        {
          "id": 2,
          "courier_type_id": 3,
          "tracking_number": "789012",
          "shipping_date": "2023-05-16"
        }
      ],
      "total": [
        {
          "id": 1,
          "courier_type_id": 1,
          "tracking_number": "123456",
          "shipping_date": "2023-05-15"
        },
        {
          "id": 2,
          "courier_type_id": 3,
          "tracking_number": "789012",
          "shipping_date": "2023-05-16"
        }
      ]
    }
  }
]
```

### 获取母类型发货统计

**GET /api/shipping/stats/parent/:id**

获取特定母类型的发货统计数据，包括自身记录和子类型记录。

**路径参数:**

- id: number - 母类型 ID

**响应格式例子:**

```json
{
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
        "courier_type_id": 1,
        "tracking_number": "123456",
        "shipping_date": "2023-05-15"
      }
    ],
    "children": [
      {
        "id": 2,
        "courier_type_id": 3,
        "tracking_number": "789012",
        "shipping_date": "2023-05-16"
      }
    ],
    "total": [
      {
        "id": 1,
        "courier_type_id": 1,
        "tracking_number": "123456",
        "shipping_date": "2023-05-15"
      },
      {
        "id": 2,
        "courier_type_id": 3,
        "tracking_number": "789012",
        "shipping_date": "2023-05-16"
      }
    ]
  }
}
```

## 技术备注

1. 使用 express-validator 进行请求数据验证
2. 发货记录中，母类型数据包含自身直接记录和所有子类型记录的数据之和
3. 确保查询接口性能，避免过多的数据库查询
4. 返回统一的错误格式，便于前端处理
5. 集成测试使用 supertest 模拟 HTTP 请求
