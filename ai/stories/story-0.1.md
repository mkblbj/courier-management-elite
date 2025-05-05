# Story 0.1: 数据库迁移与设计

## Story

**As a** 系统开发者
**I want** 创建店铺和店铺出力数据的数据库表及相关索引
**so that** 系统能够存储和高效查询店铺及其出力数据。

## Status

Draft

## Context

店铺出力管理功能需要两个核心数据表：shops 表用于存储店铺基本信息，shop_outputs 表用于记录各店铺每日的出力数据。这些表需要合理的字段设计和索引优化，确保系统能够高效地存储和查询数据。同时，需要确保与现有系统的 couriers 表建立正确的外键关系，以支持后续的多维度数据分析和展示。

本故事是整个店铺出力管理功能的基础，需要首先完成，为后续的功能开发奠定数据基础。

## Estimation

Story Points: 1

## Acceptance Criteria

1. - [ ] shops 表创建成功，包含所有必要字段（id、name、is_active、sort_order、remark、created_at、updated_at）
2. - [ ] shop_outputs 表创建成功，包含所有必要字段（id、shop_id、courier_id、output_date、quantity、notes、created_at、updated_at）
3. - [ ] 正确设置了 shop_outputs 表的外键约束，shop_id 关联到 shops 表的 id，courier_id 关联到 couriers 表的 id
4. - [ ] 创建了必要的索引，包括 shop_outputs 表上的日期索引、shop_id 索引、courier_id 索引和复合索引
5. - [ ] 编写的迁移脚本能够正确创建表和索引，并支持回滚操作
6. - [ ] 迁移脚本在开发环境测试通过

## Subtasks

1. - [ ] 编写 shops 表迁移脚本
   1. - [ ] 创建迁移文件 create_shops_table.js
   2. - [ ] 实现表创建 SQL，包含所有必要字段和约束
   3. - [ ] 实现表删除 SQL 用于回滚
   4. - [ ] 为 is_active 字段添加索引以优化查询性能
   5. - [ ] 为 sort_order 字段添加索引以优化排序查询
2. - [ ] 编写 shop_outputs 表迁移脚本
   1. - [ ] 创建迁移文件 create_shop_outputs_table.js
   2. - [ ] 实现表创建 SQL，包含所有必要字段和约束
   3. - [ ] 实现表删除 SQL 用于回滚
   4. - [ ] 添加外键约束，关联 shops 表和 couriers 表
3. - [ ] 创建必要的索引
   1. - [ ] 为 shop_outputs 表的 output_date 字段创建索引
   2. - [ ] 为 shop_outputs 表的 shop_id 字段创建索引
   3. - [ ] 为 shop_outputs 表的 courier_id 字段创建索引
   4. - [ ] 创建 (shop_id, courier_id, output_date) 复合索引
   5. - [ ] 创建 (output_date, shop_id) 复合索引
4. - [ ] 测试迁移脚本
   1. - [ ] 在开发环境执行迁移，验证表和索引创建成功
   2. - [ ] 测试回滚功能，确保能够正确删除表
   3. - [ ] 插入测试数据，验证外键约束工作正常
   4. - [ ] 执行示例查询，确认索引工作正常

## Testing Requirements:

- 确保单元测试覆盖率 >= 85%
- 包含迁移脚本的正向和回滚测试
- 测试外键约束在插入和删除操作时的行为
- 验证索引是否正确应用于相关查询

## Story Wrap Up (To be filled in AFTER agent execution):

- **Agent Model Used:** `<Agent Model Name/Version>`
- **Agent Credit or Cost:** `<Cost/Credits Consumed>`
- **Date/Time Completed:** `<Timestamp>`
- **Commit Hash:** `<Git Commit Hash of resulting code>`
- **Change Log**
  - 创建 shops 表
  - 创建 shop_outputs 表
  - 添加必要的索引和外键约束
