# 数据库结构备忘录

本文档记录了店铺出力管理系统相关的数据库表结构，用于参考和维护。

## 主要数据表

### shops 表 - 店铺基本信息

```sql
CREATE TABLE shops (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '店铺名称',
  is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序顺序',
  remark TEXT COMMENT '备注',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='店铺基本信息表';

CREATE INDEX idx_shops_is_active ON shops(is_active);
CREATE INDEX idx_shops_sort_order ON shops(sort_order);
```

### shop_outputs 表 - 店铺出力数据

```sql
CREATE TABLE shop_outputs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shop_id INT NOT NULL COMMENT '店铺ID',
  courier_id INT NOT NULL COMMENT '快递类型ID',
  output_date DATE NOT NULL COMMENT '出力日期',
  quantity INT NOT NULL DEFAULT 0 COMMENT '出力数量',
  notes TEXT COMMENT '备注说明',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='店铺出力数据表';

CREATE INDEX idx_shop_outputs_output_date ON shop_outputs(output_date);
CREATE INDEX idx_shop_outputs_shop_id ON shop_outputs(shop_id);
CREATE INDEX idx_shop_outputs_courier_id ON shop_outputs(courier_id);
CREATE INDEX idx_shop_outputs_shop_courier_date ON shop_outputs(shop_id, courier_id, output_date);
CREATE INDEX idx_shop_outputs_date_shop ON shop_outputs(output_date, shop_id);
```

### couriers 表 - 快递类型信息

此表是系统中的一个重要依赖表，定义了各种快递类型。

```sql
CREATE TABLE couriers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '快递名称',
  code VARCHAR(50) NOT NULL COMMENT '快递代码',
  is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序顺序',
  remark TEXT COMMENT '备注',
  parent_id INT NULL COMMENT '父快递类型ID',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (parent_id) REFERENCES couriers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='快递类型信息表';

CREATE INDEX idx_couriers_is_active ON couriers(is_active);
CREATE INDEX idx_couriers_sort_order ON couriers(sort_order);
CREATE INDEX idx_couriers_parent_id ON couriers(parent_id);
```

## 数据库关系图

```
+--------+        +---------------+        +----------+
| shops  | <----> | shop_outputs  | <----> | couriers |
+--------+        +---------------+        +----------+
    |                                           ^
    |                                           |
    +------------------------------------------->
      (shops和couriers之间没有直接关系，但通过shop_outputs间接关联)
```

## 主要字段说明

### shops 表字段

- **id**: 自动递增的主键
- **name**: 店铺名称，不能为空
- **is_active**: 标识店铺是否启用，1 表示启用，0 表示禁用
- **sort_order**: 排序顺序，数字越小排序越靠前
- **remark**: 店铺备注信息，可以为空
- **created_at**: 记录创建时间，自动设置
- **updated_at**: 记录更新时间，自动更新

### shop_outputs 表字段

- **id**: 自动递增的主键
- **shop_id**: 关联到 shops 表的外键
- **courier_id**: 关联到 couriers 表的外键
- **output_date**: 出力数据的日期
- **quantity**: 出力数量，默认为 0
- **notes**: 备注说明，可以为空
- **created_at**: 记录创建时间，自动设置
- **updated_at**: 记录更新时间，自动更新

### couriers 表字段

- **id**: 自动递增的主键
- **name**: 快递名称，不能为空
- **code**: 快递代码，不能为空
- **is_active**: 标识快递类型是否启用，1 表示启用，0 表示禁用
- **sort_order**: 排序顺序，数字越小排序越靠前
- **remark**: 备注信息，可以为空
- **parent_id**: 父快递类型的 ID，可以为 NULL（表示这是一个母类型）
- **created_at**: 记录创建时间，自动设置
- **updated_at**: 记录更新时间，自动更新

## 数据库索引

为了提高查询性能，数据库表中创建了多个索引：

### shops 表索引

- **idx_shops_is_active**: 基于 is_active 字段的索引，用于快速筛选启用/禁用的店铺
- **idx_shops_sort_order**: 基于 sort_order 字段的索引，用于排序查询

### shop_outputs 表索引

- **idx_shop_outputs_output_date**: 基于 output_date 字段的索引，用于日期查询
- **idx_shop_outputs_shop_id**: 基于 shop_id 字段的索引，用于按店铺筛选
- **idx_shop_outputs_courier_id**: 基于 courier_id 字段的索引，用于按快递类型筛选
- **idx_shop_outputs_shop_courier_date**: 联合索引，用于同时按店铺、快递类型和日期筛选
- **idx_shop_outputs_date_shop**: 联合索引，用于按日期和店铺筛选

### couriers 表索引

- **idx_couriers_is_active**: 基于 is_active 字段的索引，用于快速筛选启用/禁用的快递类型
- **idx_couriers_sort_order**: 基于 sort_order 字段的索引，用于排序查询
- **idx_couriers_parent_id**: 基于 parent_id 字段的索引，用于层级关系查询

## 外键约束

- **shop_outputs.shop_id** -> **shops.id** (ON DELETE CASCADE)
- **shop_outputs.courier_id** -> **couriers.id** (ON DELETE CASCADE)
- **couriers.parent_id** -> **couriers.id** (ON DELETE CASCADE)

这些外键约束确保了数据的引用完整性。CASCADE 选项表示当删除父记录时，相关的子记录也会被自动删除。
