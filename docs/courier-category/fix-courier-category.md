# Story: 快递类型结构优化与类别管理

## Story

**As a** 系统管理员
**I want** 将快递类型的层级结构改为类别管理模式，类似店铺类别的管理方式
**so that** 简化系统维护和用户操作，提高系统可用性。

## Status

待实施

## Context

当前系统中快递类型采用层级结构（父子关系），这种设计增加了系统的复杂性和维护难度。为简化系统，我们计划将快递类型改为类别管理模式，类似于店铺类别的管理方式。

具体来说，我们将：

1. 移除快递类型的层级结构（parent_id）
2. 创建新的 courier_categories 表，用于管理快递类别
3. 修改 couriers 表，添加 category_id 字段关联到 courier_categories
4. 实现快递类别的管理功能，包括类别的添加、编辑、删除和排序
5. 在统计数据时，将同一类别下所有快递类型的发货数据汇总，作为该类别的发货数据

此改动涉及数据库结构、API 端点、后端模型以及前端界面的修改，但不会影响系统的核心功能。通过这一改变，我们可以简化数据模型，使用更一致的业务逻辑，提高系统的整体可维护性。

## Estimation

Story Points: 8

## Acceptance Criteria

1. - [ ] 修改 couriers 表结构，移除层级关系相关字段
2. - [ ] 创建 courier_categories 表，实现快递类别管理
3. - [ ] 修改 couriers 表，添加 category_id 外键关联到 courier_categories 表
4. - [ ] 更新 Courier 模型，移除与层级关系相关的方法，添加与类别关联的方法
5. - [ ] 创建 CourierCategory 模型，实现快递类别的增删改查功能
6. - [ ] 修改 CourierController，移除处理层级关系的功能，添加与类别关联的功能
7. - [ ] 创建 CourierCategoryController，实现类别管理 API
8. - [ ] 更新 API 文档，反映快递类型和类别 API 的变更
9. - [ ] 修改前端界面，实现快递类别管理和类型关联功能
10. - [ ] 实现快递类别的数据统计功能，汇总同类别下所有快递类型的发货数据
11. - [ ] 确保现有的快递类型数据能够平滑迁移到新结构
12. - [ ] 保证 shop_outputs 表的外键约束正常工作
13. - [ ] 所有更改都不影响已有功能的正常使用
14. - [ ] 更新单元测试，确保覆盖率不低于 85%

## Subtasks

1. - [x] 数据库改动

   1. - [x] 创建迁移脚本移除 couriers 表中的 parent_id 字段及相关外键和索引
   2. - [x] 创建 courier_categories 表的迁移脚本，包含 id、name、sort_order 等字段
   3. - [ ] 修改 couriers 表，添加 category_id 字段及外键约束
   4. - [ ] 编写数据迁移逻辑，将子类型转换为扁平结构，并分配到适当的类别中
   5. - [ ] 确保 shop_outputs 表中与 couriers 表的外键关系保持正确
   6. - [ ] 为 courier_categories 表创建索引，优化查询性能

2. - [ ] 模型开发

   1. - [ ] 更新 Courier.js 模型，移除 getParentTypes()和相关的层级查询方法
   2. - [ ] 移除模型中与 parent_id 相关的字段处理
   3. - [ ] 添加获取快递类型所属类别的方法
   4. - [ ] 创建 CourierCategory.js 模型，实现类别的增删改查功能
   5. - [ ] 实现按类别获取快递类型的方法
   6. - [ ] 开发类别数据统计方法，计算类别下所有快递类型的发货数据总和

3. - [ ] API 控制器修改

   1. - [ ] 更新 CourierController.js，移除处理层级关系的逻辑
   2. - [ ] 移除 validateCourier 中的 parent_id 验证，添加 category_id 验证
   3. - [ ] 简化 getAll()、add()和 update()方法的实现
   4. - [ ] 确保 API 响应格式保持一致性
   5. - [ ] 创建 CourierCategoryController.js，实现类别管理 API
   6. - [ ] 实现按类别获取统计数据的 API 端点

4. - [ ] 前端服务和接口更新

   1. - [ ] 更新 api.ts 中的 CourierType 接口定义，移除 parent_id 字段，添加 category_id 字段
   2. - [ ] 修改 CreateCourierTypeRequest 接口，更新相关字段
   3. - [ ] 创建 CourierCategory 接口定义和相关 API 请求函数
   4. - [ ] 更新快递类型表单组件，移除父类型选择功能，添加类别选择功能
   5. - [ ] 修改快递类型列表组件，移除层级展示逻辑，添加类别过滤功能

5. - [ ] 文档更新

   1. - [ ] 更新 API 文档，反映快递类型和类别 API 的变更
   2. - [ ] 更新数据库结构文档，反映新的 courier_categories 和 couriers 表结构
   3. - [ ] 更新用户指南和管理员手册（如果存在）

6. - [ ] 测试
   1. - [ ] 更新单元测试，确保覆盖所有修改点
   2. - [ ] 编写数据迁移测试，确保现有数据能正确转换
   3. - [ ] 测试类别数据统计功能的准确性
   4. - [ ] 进行手动测试，验证界面和功能正常工作
   5. - [ ] 确保与 shop_outputs 相关的功能不受影响

## Testing Requirements:

- 确保单元测试覆盖率 >= 85%
- 测试数据迁移的正确性，确保不丢失数据
- 验证 shop_outputs 表的外键约束正确性
- 测试类别统计数据计算功能的准确性
- 手动测试前端界面功能，确保用户体验流畅
- 进行回归测试，确保不影响系统中的其他功能

## 详细实施计划

### 1. 数据库修改

#### 1.1 创建 courier_categories 表

创建新的迁移脚本 `create_courier_categories.js`，内容如下：

```javascript
/**
 * 迁移脚本：创建快递类别表
 */
async function up() {
  // 创建 courier_categories 表
  await db.query(`
    CREATE TABLE courier_categories (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL COMMENT '类别名称',
      sort_order INT NOT NULL DEFAULT 0 COMMENT '排序顺序',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='快递类别表';
  `);

  // 添加索引以提高查询性能
  await db.query(`
    CREATE INDEX idx_courier_categories_sort_order ON courier_categories(sort_order);
  `);

  console.log("成功创建 courier_categories 表及索引");
}

async function down() {
  // 删除表
  await db.query(`
    DROP TABLE IF EXISTS courier_categories;
  `);

  console.log("成功删除 courier_categories 表");
}

module.exports = { up, down };
```

#### 1.2 修改 couriers 表，移除层级关系并添加类别关联

创建新的迁移脚本 `modify_couriers_table.js`，内容如下：

```javascript
/**
 * 迁移脚本：修改 couriers 表结构，移除层级关系并添加类别关联
 */
async function up() {
  // 先删除外键约束
  await db.query(`
    ALTER TABLE couriers
    DROP FOREIGN KEY IF EXISTS couriers_ibfk_1
  `);

  // 删除parent_id索引
  await db.query(`
    DROP INDEX IF EXISTS idx_couriers_parent_id ON couriers
  `);

  // 添加category_id字段
  await db.query(`
    ALTER TABLE couriers
    ADD COLUMN category_id INT NULL COMMENT '快递类别ID',
    DROP COLUMN parent_id
  `);

  // 添加category_id索引
  await db.query(`
    CREATE INDEX idx_couriers_category_id ON couriers(category_id);
  `);

  // 添加外键约束
  await db.query(`
    ALTER TABLE couriers
    ADD CONSTRAINT couriers_category_fk 
    FOREIGN KEY (category_id) REFERENCES courier_categories(id) ON DELETE SET NULL
  `);

  console.log("成功修改 couriers 表结构");
}

async function down() {
  // 删除外键约束
  await db.query(`
    ALTER TABLE couriers
    DROP FOREIGN KEY IF EXISTS couriers_category_fk
  `);

  // 删除category_id索引
  await db.query(`
    DROP INDEX IF EXISTS idx_couriers_category_id ON couriers
  `);

  // 还原表结构：移除category_id，添加parent_id
  await db.query(`
    ALTER TABLE couriers
    ADD COLUMN parent_id INT NULL COMMENT '父快递类型ID',
    DROP COLUMN category_id
  `);

  // 添加parent_id索引
  await db.query(`
    CREATE INDEX idx_couriers_parent_id ON couriers(parent_id);
  `);

  // 添加原来的外键约束
  await db.query(`
    ALTER TABLE couriers
    ADD CONSTRAINT couriers_ibfk_1 
    FOREIGN KEY (parent_id) REFERENCES couriers(id) ON DELETE CASCADE
  `);

  console.log("成功还原 couriers 表结构");
}

module.exports = { up, down };
```

#### 1.3 数据迁移

创建一个脚本来处理数据迁移，包括根据现有层级结构创建类别和分配快递类型：

```javascript
/**
 * 快递类型数据迁移脚本：从层级结构迁移到类别结构
 */
async function migrateCourierData() {
  // 获取所有快递类型
  const allCouriers = await db.query(`SELECT * FROM couriers`);

  // 获取父级快递类型（作为类别的基础）
  const parentCouriers = allCouriers.filter((c) => c.parent_id === null);
  console.log(`发现${parentCouriers.length}个父级类型，将创建对应的类别`);

  // 为每个父级类型创建对应的类别
  for (let i = 0; i < parentCouriers.length; i++) {
    const parent = parentCouriers[i];
    const result = await db.query(
      `INSERT INTO courier_categories (name, sort_order) VALUES (?, ?)`,
      [parent.name, i + 1]
    );
    const categoryId = result.insertId;

    // 更新该父类型对应的category_id
    await db.query(`UPDATE couriers SET category_id = ? WHERE id = ?`, [
      categoryId,
      parent.id,
    ]);

    // 更新该父类型下的所有子类型
    const childCouriers = allCouriers.filter((c) => c.parent_id === parent.id);
    for (const child of childCouriers) {
      await db.query(`UPDATE couriers SET category_id = ? WHERE id = ?`, [
        categoryId,
        child.id,
      ]);
    }

    console.log(
      `已创建类别: ${parent.name}，分配了${childCouriers.length + 1}个快递类型`
    );
  }

  // 创建一个"其他"类别，用于未分类的快递类型
  const otherResult = await db.query(
    `INSERT INTO courier_categories (name, sort_order) VALUES (?, ?)`,
    ["其他", parentCouriers.length + 1]
  );
  const otherCategoryId = otherResult.insertId;

  // 查找未分类的快递类型并分配到"其他"类别
  await db.query(
    `UPDATE couriers SET category_id = ? WHERE category_id IS NULL`,
    [otherCategoryId]
  );

  console.log("快递类型数据迁移完成");
}
```

### 2. 模型开发

#### 2.1 创建 CourierCategory 模型

创建 `CourierCategory.js` 模型，实现类别的基本操作：

```javascript
/**
 * 快递类别模型
 */
class CourierCategory {
  constructor() {
    this.table = "courier_categories";
  }

  /**
   * 获取所有快递类别
   * @param {Object} options 过滤和排序选项
   * @returns {Promise<Array>}
   */
  async getAll(options = {}) {
    let sql = `SELECT * FROM ${this.table}`;
    const params = [];
    const whereClauses = [];

    // 添加搜索过滤条件
    if (options.search) {
      whereClauses.push("name LIKE ?");
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm);
    }

    // 添加WHERE子句
    if (whereClauses.length > 0) {
      sql += " WHERE " + whereClauses.join(" AND ");
    }

    // 添加排序
    const allowedSortFields = [
      "id",
      "name",
      "sort_order",
      "created_at",
      "updated_at",
    ];
    const sortBy = allowedSortFields.includes(options.sort_by)
      ? options.sort_by
      : "sort_order";
    const sortOrder = options.sort_order === "DESC" ? "DESC" : "ASC";

    sql += ` ORDER BY ${sortBy} ${sortOrder}`;

    return await db.query(sql, params);
  }

  /**
   * 获取类别的统计数据
   * @param {number} categoryId 类别ID
   * @param {Object} options 过滤选项
   * @returns {Promise<Object>} 类别的总发货数据
   */
  async getCategoryStats(categoryId, options = {}) {
    // 构造基础SQL
    let sql = `
      SELECT 
        cc.id as category_id,
        cc.name as category_name,
        SUM(so.quantity) as total_quantity
      FROM courier_categories cc
      LEFT JOIN couriers c ON c.category_id = cc.id
      LEFT JOIN shop_outputs so ON so.courier_id = c.id
      WHERE cc.id = ?
    `;
    const params = [categoryId];

    // 添加日期过滤
    if (options.start_date && options.end_date) {
      sql += ` AND so.output_date BETWEEN ? AND ?`;
      params.push(options.start_date, options.end_date);
    } else if (options.start_date) {
      sql += ` AND so.output_date >= ?`;
      params.push(options.start_date);
    } else if (options.end_date) {
      sql += ` AND so.output_date <= ?`;
      params.push(options.end_date);
    }

    // 添加店铺过滤
    if (options.shop_id) {
      sql += ` AND so.shop_id = ?`;
      params.push(options.shop_id);
    }

    sql += ` GROUP BY cc.id, cc.name`;

    const results = await db.query(sql, params);
    return results.length > 0 ? results[0] : { total_quantity: 0 };
  }
}

module.exports = new CourierCategory();
```

#### 2.2 更新 Courier 模型

修改 `Courier.js` 模型，添加与类别关联的功能：

```javascript
// 修改getAll方法，添加category_id过滤
async getAll(options = {}) {
  let sql = `
    SELECT c.*, cc.name as category_name
    FROM ${this.table} c
    LEFT JOIN courier_categories cc ON c.category_id = cc.id
  `;
  const params = [];
  const whereClauses = [];

  // 添加过滤条件
  if (options.is_active !== null && options.is_active !== undefined) {
    whereClauses.push('c.is_active = ?');
    params.push(options.is_active ? 1 : 0);
  }

  if (options.search) {
    whereClauses.push('(c.name LIKE ? OR c.code LIKE ? OR c.remark LIKE ?)');
    const searchTerm = `%${options.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // 添加类别过滤
  if (options.category_id) {
    whereClauses.push('c.category_id = ?');
    params.push(options.category_id);
  }

  // 添加WHERE子句
  if (whereClauses.length > 0) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }

  // 添加排序
  const allowedSortFields = ['id', 'name', 'code', 'is_active', 'sort_order', 'created_at', 'updated_at'];
  const sortBy = allowedSortFields.includes(options.sort_by) ? options.sort_by : 'sort_order';
  const sortOrder = options.sort_order === 'DESC' ? 'DESC' : 'ASC';

  sql += ` ORDER BY ${sortBy} ${sortOrder}`;

  return await db.query(sql, params);
}

// 修改add方法，添加category_id参数
async add(data) {
  const sql = `INSERT INTO ${this.table} (name, code, remark, is_active, sort_order, category_id) VALUES (?, ?, ?, ?, ?, ?)`;

  const isActive = data.is_active !== undefined ? data.is_active : true;
  const sortOrder = data.sort_order !== undefined ? data.sort_order : 0;
  const remark = data.remark || null;
  const categoryId = data.category_id || null;

  const result = await db.query(sql, [
    data.name,
    data.code,
    remark,
    isActive ? 1 : 0,
    sortOrder,
    categoryId
  ]);

  return result.insertId;
}
```

### 3. API 控制器开发

#### 3.1 创建 CourierCategoryController

创建 `CourierCategoryController.js` 实现类别管理 API：

```javascript
const CourierCategory = require("../models/CourierCategory");
const { body, validationResult } = require("express-validator");

/**
 * 验证快递类别数据
 */
const validateCategory = [
  body("name")
    .notEmpty()
    .withMessage("名称不能为空")
    .isLength({ max: 50 })
    .withMessage("名称长度不能超过50"),
  body("sort_order").optional().isInt().withMessage("排序值必须是整数"),
];

class CourierCategoryController {
  /**
   * 获取所有类别
   */
  async getAll(req, res) {
    try {
      const options = {
        sort_by: req.query.sort || "sort_order",
        sort_order: req.query.order || "ASC",
        search: req.query.search || "",
      };

      const categories = await CourierCategory.getAll(options);

      res.status(200).json({
        code: 0,
        message: "获取成功",
        data: categories,
      });
    } catch (error) {
      console.error("获取快递类别列表失败:", error);
      res.status(500).json({
        code: 500,
        message: "获取快递类别列表失败",
      });
    }
  }

  /**
   * 获取类别统计数据
   */
  async getCategoryStats(req, res) {
    try {
      const categoryId = parseInt(req.params.id);

      const options = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        shop_id: req.query.shop_id ? parseInt(req.query.shop_id) : null,
      };

      const stats = await CourierCategory.getCategoryStats(categoryId, options);

      res.status(200).json({
        code: 0,
        message: "获取成功",
        data: stats,
      });
    } catch (error) {
      console.error("获取类别统计数据失败:", error);
      res.status(500).json({
        code: 500,
        message: "获取类别统计数据失败",
      });
    }
  }

  // 其他方法：add, getById, update, delete, updateSort 等省略...
}

module.exports = {
  CourierCategoryController: new CourierCategoryController(),
  validateCategory,
};
```

#### 3.2 更新 CourierController

更新 `CourierController.js` 验证规则，添加 category_id 验证：

```javascript
const validateCourier = [
  body("name")
    .notEmpty()
    .withMessage("名称不能为空")
    .isLength({ max: 100 })
    .withMessage("名称长度不能超过100"),
  body("code")
    .optional()
    .isLength({ max: 50 })
    .withMessage("代码长度不能超过50"),
  body("remark").optional(),
  body("is_active").optional().isBoolean().withMessage("状态必须是布尔值"),
  body("sort_order").optional().isInt().withMessage("排序值必须是整数"),
  body("category_id").optional().isInt().withMessage("类别ID必须是整数"),
];
```

### 4. 前端服务和接口更新

#### 4.1 快递类别管理组件

实现类别管理界面，类似于店铺类别管理：

```tsx
const CourierCategoryList = () => {
  const [categories, setCategories] = useState<CourierCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取类别列表
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("获取类别失败", error);
      toast.error("获取类别列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 其他功能：添加、编辑、删除类别等

  return <div>{/* 类别列表界面 */}</div>;
};
```

#### 4.2 类别统计展示

实现类别统计数据展示组件：

```tsx
const CourierCategoryStats = ({ categoryId }: { categoryId: number }) => {
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getCategoryStats(categoryId);
      setStats(data);
    } catch (error) {
      console.error("获取统计数据失败", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryId) {
      fetchStats();
    }
  }, [categoryId]);

  return <div>{/* 统计数据展示 */}</div>;
};
```

### 5. 前端界面实现

#### 5.1 类别管理页面

添加类别管理标签页，类似店铺类别管理界面：

```tsx
// courier-types/page.tsx 修改
export default function CourierTypesPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">快递类型管理</h1>

      <Tabs defaultValue="types">
        <TabsList>
          <TabsTrigger value="types">快递类型</TabsTrigger>
          <TabsTrigger value="categories">快递类别</TabsTrigger>
        </TabsList>

        <TabsContent value="types">
          <CourierTypeList />
        </TabsContent>

        <TabsContent value="categories">
          <CourierCategoryList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### 5.2 快递类型表单修改

更新快递类型表单，添加类别选择功能：

```tsx
// CourierTypeForm.tsx 修改
export default function CourierTypeForm({
  initialData,
  onSubmit,
}: CourierTypeFormProps) {
  const [categories, setCategories] = useState<CourierCategory[]>([]);

  // 获取所有类别
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("获取类别失败", error);
      }
    };

    fetchCategories();
  }, []);

  // ... 其他表单逻辑 ...

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... 其他表单字段 ... */}

      <div className="space-y-2">
        <Label htmlFor="category_id">类别</Label>
        <Select
          onValueChange={(value) => form.setValue("category_id", Number(value))}
          defaultValue={initialData?.category_id?.toString()}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择类别" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">无类别</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.category_id && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.category_id.message}
          </p>
        )}
      </div>

      {/* ... 其他表单字段和提交按钮 ... */}
    </form>
  );
}
```

#### 5.3 类别数据统计展示

在统计页面添加按类别展示数据的功能：

```tsx
// 类别数据统计组件
export default function CategoryStatsView() {
  const [categories, setCategories] = useState<CourierCategory[]>([]);
  const [categoryStats, setCategoryStats] = useState<
    Record<number, CategoryStats>
  >({});
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  // 获取所有类别
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("获取类别失败", error);
      }
    };

    fetchCategories();
  }, []);

  // 获取类别统计数据
  useEffect(() => {
    const fetchCategoryStats = async () => {
      if (!categories.length) return;

      const stats: Record<number, CategoryStats> = {};

      for (const category of categories) {
        try {
          const options: any = {};
          if (dateRange.start)
            options.start_date = format(dateRange.start, "yyyy-MM-dd");
          if (dateRange.end)
            options.end_date = format(dateRange.end, "yyyy-MM-dd");

          const data = await getCategoryStats(category.id, options);
          stats[category.id] = data;
        } catch (error) {
          console.error(`获取类别${category.id}统计数据失败`, error);
        }
      }

      setCategoryStats(stats);
    };

    fetchCategoryStats();
  }, [categories, dateRange]);

  return (
    <div>
      {/* 日期筛选器 */}
      <div className="mb-4">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* 类别统计数据展示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {categoryStats[category.id]?.total_quantity || 0}
              </p>
              <p className="text-muted-foreground">总发货量</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

## Story Wrap Up (To be filled in AFTER execution):

- **Agent Model Used:** `TBD`
- **Agent Credit or Cost:** `TBD`
- **Date/Time Completed:** `TBD`
- **Commit Hash:** `TBD`
- **Change Log**
  - 创建 courier_categories 表实现快递类别管理
  - 修改 couriers 表结构，移除层级关系，添加类别关联
  - 实现父子类型到类别结构的数据迁移
  - 开发 CourierCategory 模型和相关 API
  - 更新 Courier 模型，支持类别关联
  - 实现前端类别管理界面和统计功能
  - 优化快递类型列表和表单，支持类别筛选
