# 母子快递类型管理 - Epic 1：后端实现 - 故事 1：数据模型设计

## 状态: 已完成

## 简介

本故事实现快递类型的母子关系模型设计，添加必要的数据库字段并更新快递类型模型，以支持母子类型关系管理和数据统计功能。

## 验收标准

1. 数据库表结构已更新，添加了支持母子关系的字段
2. 快递类型模型已扩展，支持母子类型关系管理
3. 可以正确获取子类型列表和统计总和
4. 所有单元测试通过

## 子任务

### 子任务 1: 数据库模式更新

- 在快递类型表(couries)中添加 parent_id 字段，建立自引用关系
- 确保添加适当的外键约束
- 编写数据库迁移脚本

**具体实现例子:**

```sql
-- 在快递类型表中添加parent_id字段，建立自引用关系
ALTER TABLE couriers
ADD COLUMN parent_id INT NULL,
ADD FOREIGN KEY (parent_id) REFERENCES couriers(id);

-- 为parent_id创建索引以提高查询性能
CREATE INDEX idx_couriers_parent_id ON couriers(parent_id);
```

### 子任务 2: 快递类型模型更新

- 更新 Courier 模型，添加对 parent_id 字段的支持
- 实现获取子类型的方法
- 实现计算子类型总和的方法

**具体实现例子:**

```javascript
// backend/src/models/courierTypeModel.js
const db = require("../db/connection");

class CourierType {
  // 获取所有母类型(parent_id为null的类型)
  static async getParentTypes() {
    const query = `
      SELECT * FROM couriers 
      WHERE parent_id IS NULL 
      ORDER BY name ASC
    `;
    return db.query(query);
  }

  // 获取特定母类型的所有子类型
  static async getChildren(parentId) {
    const query = `
      SELECT * FROM couriers 
      WHERE parent_id = ? 
      ORDER BY name ASC
    `;
    return db.query(query, [parentId]);
  }

  // 计算子类型数量总和
  static async getChildrenSum(parentId) {
    const query = `
      SELECT SUM(count) as total 
      FROM couriers 
      WHERE parent_id = ?
    `;
    const result = await db.query(query, [parentId]);
    return result[0].total || 0;
  }

  // 创建新的快递类型(可以是母类型或子类型)
  static async create(data) {
    const { name, parent_id, count = 0, ...otherData } = data;

    const query = `
      INSERT INTO couriers (name, parent_id, count, created_at, updated_at) 
      VALUES (?, ?, ?, NOW(), NOW())
    `;

    const result = await db.query(query, [name, parent_id, count]);
    const id = result.insertId;

    return this.findById(id);
  }

  // 更新快递类型
  static async update(id, data) {
    const { name, count, ...otherData } = data;
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }

    if (count !== undefined) {
      fields.push("count = ?");
      values.push(count);
    }

    // 注意：不允许修改parent_id，以防止循环引用和数据一致性问题

    fields.push("updated_at = NOW()");
    values.push(id);

    const query = `
      UPDATE couriers 
      SET ${fields.join(", ")} 
      WHERE id = ?
    `;

    await db.query(query, values);
    return this.findById(id);
  }

  // 删除快递类型(确保没有子类型)
  static async delete(id) {
    // 先检查是否有子类型
    const children = await this.getChildren(id);
    if (children.length > 0) {
      throw new Error("不能删除有子类型的母类型");
    }

    const query = "DELETE FROM couriers WHERE id = ?";
    return db.query(query, [id]);
  }

  // 获取单个快递类型
  static async findById(id) {
    const query = "SELECT * FROM couriers WHERE id = ?";
    const result = await db.query(query, [id]);
    return result[0] || null;
  }

  // 获取带有层级关系的完整类型列表
  static async getTypeHierarchy() {
    // 获取所有母类型
    const parentTypes = await this.getParentTypes();

    // 为每个母类型获取子类型和统计数据
    const result = await Promise.all(
      parentTypes.map(async (parent) => {
        const children = await this.getChildren(parent.id);
        const childrenSum = await this.getChildrenSum(parent.id);

        return {
          ...parent,
          children,
          totalCount: childrenSum,
        };
      })
    );

    return result;
  }
}

module.exports = CourierType;
```

### 子任务 3: 编写单元测试

- 为新添加的方法编写单元测试
- 测试母子类型关系和数据统计功能

**具体实现例子:**

```javascript
// backend/src/tests/models/courierTypeModel.test.js
const CourierType = require("../../models/courierTypeModel");
const db = require("../../db/connection");

// 模拟数据库连接
jest.mock("../../db/connection");

describe("CourierType Model", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getParentTypes应该返回所有母类型", async () => {
    const mockParentTypes = [
      { id: 1, name: "母类型1", parent_id: null },
      { id: 2, name: "母类型2", parent_id: null },
    ];

    db.query.mockResolvedValue(mockParentTypes);

    const result = await CourierType.getParentTypes();

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE parent_id IS NULL")
    );
    expect(result).toEqual(mockParentTypes);
  });

  test("getChildren应该返回指定母类型的所有子类型", async () => {
    const mockChildren = [
      { id: 3, name: "子类型1", parent_id: 1 },
      { id: 4, name: "子类型2", parent_id: 1 },
    ];

    db.query.mockResolvedValue(mockChildren);

    const result = await CourierType.getChildren(1);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE parent_id = ?"),
      [1]
    );
    expect(result).toEqual(mockChildren);
  });

  test("getChildrenSum应该计算子类型的数量总和", async () => {
    db.query.mockResolvedValue([{ total: 15 }]);

    const result = await CourierType.getChildrenSum(1);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("SUM(count)"),
      [1]
    );
    expect(result).toBe(15);
  });

  test("getTypeHierarchy应该返回带有层级关系的数据", async () => {
    const mockParentTypes = [
      { id: 1, name: "母类型1", parent_id: null },
      { id: 2, name: "母类型2", parent_id: null },
    ];

    const mockChildren1 = [
      { id: 3, name: "子类型1", parent_id: 1 },
      { id: 4, name: "子类型2", parent_id: 1 },
    ];

    const mockChildren2 = [{ id: 5, name: "子类型3", parent_id: 2 }];

    // 模拟各个方法的返回值
    CourierType.getParentTypes = jest.fn().mockResolvedValue(mockParentTypes);
    CourierType.getChildren = jest
      .fn()
      .mockResolvedValueOnce(mockChildren1)
      .mockResolvedValueOnce(mockChildren2);
    CourierType.getChildrenSum = jest
      .fn()
      .mockResolvedValueOnce(10) // 母类型1的子类型总和
      .mockResolvedValueOnce(5); // 母类型2的子类型总和

    const result = await CourierType.getTypeHierarchy();

    expect(result).toEqual([
      { ...mockParentTypes[0], children: mockChildren1, totalCount: 10 },
      { ...mockParentTypes[1], children: mockChildren2, totalCount: 5 },
    ]);
  });
});
```

## 技术备注

1. 使用自引用关系（self-referencing relationship）实现母子类型层级结构
2. 使用外键约束确保数据一致性
3. 为了防止数据错误，设计上不允许修改已有记录的 parent_id 字段
4. 删除母类型前确保没有子类型，以维护数据完整性
