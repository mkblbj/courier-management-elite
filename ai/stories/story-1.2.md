# 母子快递类型管理 - Epic 1：后端实现 - 故事 2：API 端点实现

## 状态: 已完成

## 简介

本故事实现快递类型的母子关系 API 端点，包括获取层级结构、创建子类型、更新和删除子类型等功能，为前端提供必要的数据接口。

## 验收标准

1. API 端点能正确获取快递类型层级结构
2. 可以通过 API 创建子类型
3. 可以更新子类型信息
4. 可以删除子类型（但不能直接删除有子类型的母类型）
5. 所有 API 端点有适当的错误处理
6. 集成测试通过

## 子任务

### 子任务 1: 创建 API 控制器方法

- 实现获取类型层级结构的控制器方法
- 实现创建、更新和删除子类型的控制器方法
- 添加适当的错误处理和验证

**具体实现例子:**

```javascript
// backend/src/controllers/courierTypeController.js
const CourierType = require("../models/courierTypeModel");
const { validationResult } = require("express-validator");

// 获取快递类型层级结构
exports.getTypeHierarchy = async (req, res) => {
  try {
    const typeHierarchy = await CourierType.getTypeHierarchy();
    res.status(200).json(typeHierarchy);
  } catch (error) {
    console.error("获取类型层级结构失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 创建快递类型(可以是母类型或子类型)
exports.createCourierType = async (req, res) => {
  try {
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, parent_id, count = 0, ...otherData } = req.body;

    // 如果是子类型，验证母类型存在
    if (parent_id) {
      const parentType = await CourierType.findById(parent_id);
      if (!parentType) {
        return res.status(404).json({ message: "母类型不存在" });
      }
    }

    const newType = await CourierType.create({
      name,
      parent_id,
      count,
      ...otherData,
    });

    res.status(201).json(newType);
  } catch (error) {
    console.error("创建快递类型失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 获取特定快递类型的详情(包括子类型)
exports.getCourierTypeDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const courierType = await CourierType.findById(id);
    if (!courierType) {
      return res.status(404).json({ message: "快递类型不存在" });
    }

    // 如果是母类型，获取子类型和总和
    if (courierType.parent_id === null) {
      const children = await CourierType.getChildren(id);
      const childrenSum = await CourierType.getChildrenSum(id);

      return res.status(200).json({
        ...courierType,
        children,
        totalCount: childrenSum,
      });
    }

    // 如果是子类型，获取其母类型信息
    if (courierType.parent_id) {
      const parentType = await CourierType.findById(courierType.parent_id);
      return res.status(200).json({
        ...courierType,
        parentType,
      });
    }

    res.status(200).json(courierType);
  } catch (error) {
    console.error("获取快递类型详情失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 更新快递类型
exports.updateCourierType = async (req, res) => {
  try {
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, count, ...otherData } = req.body;

    // 检查类型是否存在
    const courierType = await CourierType.findById(id);
    if (!courierType) {
      return res.status(404).json({ message: "快递类型不存在" });
    }

    // 更新类型
    const updatedType = await CourierType.update(id, {
      name,
      count,
      ...otherData,
    });

    res.status(200).json(updatedType);
  } catch (error) {
    console.error("更新快递类型失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
};

// 删除快递类型
exports.deleteCourierType = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查类型是否存在
    const courierType = await CourierType.findById(id);
    if (!courierType) {
      return res.status(404).json({ message: "快递类型不存在" });
    }

    try {
      await CourierType.delete(id);
      res.status(200).json({ message: "快递类型删除成功" });
    } catch (error) {
      // 处理删除有子类型的母类型的情况
      if (error.message === "不能删除有子类型的母类型") {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error("删除快递类型失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
};
```

### 子任务 2: 创建 API 路由

- 定义获取层级结构的路由
- 定义创建、更新和删除子类型的路由
- 添加请求验证中间件

**具体实现例子:**

```javascript
// backend/src/routes/courierTypeRoutes.js
const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const courierTypeController = require("../controllers/courierTypeController");

// 获取所有快递类型（层级结构）
router.get("/courier-types/hierarchy", courierTypeController.getTypeHierarchy);

// 获取特定快递类型详情
router.get(
  "/courier-types/:id",
  param("id").isInt().withMessage("ID必须是整数"),
  courierTypeController.getCourierTypeDetails
);

// 创建快递类型
router.post(
  "/courier-types",
  [
    body("name").notEmpty().withMessage("名称不能为空"),
    body("parent_id").optional().isInt().withMessage("父类型ID必须是整数"),
    body("count").optional().isInt().withMessage("数量必须是整数"),
  ],
  courierTypeController.createCourierType
);

// 更新快递类型
router.put(
  "/courier-types/:id",
  [
    param("id").isInt().withMessage("ID必须是整数"),
    body("name").optional().notEmpty().withMessage("名称不能为空"),
    body("count").optional().isInt().withMessage("数量必须是整数"),
  ],
  courierTypeController.updateCourierType
);

// 删除快递类型
router.delete(
  "/courier-types/:id",
  param("id").isInt().withMessage("ID必须是整数"),
  courierTypeController.deleteCourierType
);

module.exports = router;
```

### 子任务 3: 集成到应用程序

- 将路由集成到 Express 应用程序中
- 确保正确处理 JSON 请求体

**具体实现例子:**

```javascript
// backend/src/index.js
const express = require("express");
const cors = require("cors");
const courierTypeRoutes = require("./routes/courierTypeRoutes");
// 其他路由导入...

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use("/api", courierTypeRoutes);
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

### 子任务 4: 编写集成测试

- 测试 API 端点的功能
- 验证响应状态码和数据格式

**具体实现例子:**

```javascript
// backend/src/tests/integration/courierTypeRoutes.test.js
const request = require("supertest");
const app = require("../../index");
const CourierType = require("../../models/courierTypeModel");

// 模拟CourierType模型
jest.mock("../../models/courierTypeModel");

describe("快递类型API端点", () => {
  // 获取层级结构测试
  test("GET /api/courier-types/hierarchy应返回层级结构", async () => {
    const mockHierarchy = [
      {
        id: 1,
        name: "母类型1",
        parent_id: null,
        children: [{ id: 3, name: "子类型1", parent_id: 1 }],
        totalCount: 10,
      },
    ];

    CourierType.getTypeHierarchy.mockResolvedValue(mockHierarchy);

    const response = await request(app)
      .get("/api/courier-types/hierarchy")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toEqual(mockHierarchy);
  });

  // 创建类型测试
  test("POST /api/courier-types应创建新类型", async () => {
    const newType = {
      name: "测试类型",
      parent_id: 1,
      count: 5,
    };

    const mockCreatedType = {
      id: 10,
      ...newType,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    };

    CourierType.findById.mockResolvedValue({ id: 1, name: "母类型" });
    CourierType.create.mockResolvedValue(mockCreatedType);

    const response = await request(app)
      .post("/api/courier-types")
      .send(newType)
      .expect("Content-Type", /json/)
      .expect(201);

    expect(response.body).toEqual(mockCreatedType);
  });

  // 更新类型测试
  test("PUT /api/courier-types/:id应更新类型", async () => {
    const updatedData = {
      name: "更新的类型名",
      count: 15,
    };

    const mockType = {
      id: 5,
      name: "原类型名",
      count: 10,
      parent_id: 1,
    };

    const mockUpdatedType = {
      ...mockType,
      ...updatedData,
      updated_at: "2023-01-02T00:00:00Z",
    };

    CourierType.findById.mockResolvedValue(mockType);
    CourierType.update.mockResolvedValue(mockUpdatedType);

    const response = await request(app)
      .put("/api/courier-types/5")
      .send(updatedData)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toEqual(mockUpdatedType);
  });

  // 删除类型测试
  test("DELETE /api/courier-types/:id应删除类型", async () => {
    CourierType.findById.mockResolvedValue({ id: 5, name: "测试类型" });
    CourierType.delete.mockResolvedValue({ affectedRows: 1 });

    await request(app).delete("/api/courier-types/5").expect(200);

    expect(CourierType.delete).toHaveBeenCalledWith("5");
  });

  // 删除有子类型的母类型测试
  test("删除有子类型的母类型应返回400错误", async () => {
    CourierType.findById.mockResolvedValue({ id: 1, name: "母类型" });
    CourierType.delete.mockRejectedValue(new Error("不能删除有子类型的母类型"));

    const response = await request(app)
      .delete("/api/courier-types/1")
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body.message).toBe("不能删除有子类型的母类型");
  });
});
```

## API 文档

### 获取快递类型层级结构

**GET /api/courier-types/hierarchy**

返回所有母类型及其子类型的层级结构，包括子类型总和。

**响应格式例子:**

```json
[
  {
    "id": 1,
    "name": "ゆうパケット",
    "parent_id": null,
    "children": [
      {
        "id": 3,
        "name": "ゆうパケット (1CM)",
        "parent_id": 1,
        "count": 5
      },
      {
        "id": 4,
        "name": "ゆうパケット (2CM)",
        "parent_id": 1,
        "count": 10
      }
    ],
    "totalCount": 15
  }
]
```

### 创建快递类型

**POST /api/courier-types**

创建新的快递类型（母类型或子类型）。

**请求体:**

```json
{
  "name": "ゆうパケット (3CM)",
  "parent_id": 1,
  "count": 0
}
```

**响应:**

```json
{
  "id": 5,
  "name": "ゆうパケット (3CM)",
  "parent_id": 1,
  "count": 0,
  "created_at": "2023-05-15T08:30:00Z",
  "updated_at": "2023-05-15T08:30:00Z"
}
```

### 更新快递类型

**PUT /api/courier-types/:id**

更新现有快递类型的信息。

**请求体:**

```json
{
  "name": "ゆうパケット (修改后)",
  "count": 15
}
```

**响应:**

```json
{
  "id": 5,
  "name": "ゆうパケット (修改后)",
  "parent_id": 1,
  "count": 15,
  "created_at": "2023-05-15T08:30:00Z",
  "updated_at": "2023-05-15T09:45:00Z"
}
```

### 删除快递类型

**DELETE /api/courier-types/:id**

删除指定的快递类型（如果是母类型，则必须先删除所有子类型）。

**响应:**

```json
{
  "message": "快递类型删除成功"
}
```

## 技术备注

1. 使用 express-validator 进行请求数据验证
2. 关注数据一致性，确保删除母类型前必须先删除所有子类型
3. 返回统一的错误格式，便于前端处理
4. 集成测试使用 supertest 模拟 HTTP 请求
