# Story 2.1: 店铺列表展示

## Story

**As a** 系统管理员  
**I want** 在现有的/courier-types 页面中添加店铺管理标签页，实现店铺列表的展示功能  
**so that** 我可以查看和管理系统中的所有店铺信息。

## Status

complete

## Context

店铺信息是店铺出力管理的核心数据。为了保持系统的一致性，店铺管理功能将集成到现有的快递类型管理页面中，与店铺类别功能一起，通过标签页方式进行展示。

本故事将实现店铺列表的展示功能，包括店铺名称、所属类别、状态和排序等基本数据，并支持按类别分组展示，同时提供搜索、排序和筛选功能，为后续的店铺添加、编辑、删除、状态切换和排序功能奠定基础。

## Estimation

Story Points: 5

## Acceptance Criteria

1. - [ ] 在/courier-types 页面顶部添加标签导航，包含"快递类型"和"店铺管理"两个标签
2. - [ ] 在"店铺管理"标签下，创建两个子标签："店铺类别"和"店铺管理"，默认选中"店铺管理"
3. - [ ] 店铺列表以按类别分组的表格形式展示，每个类别有独立的标题行，格式为"[类别名称] 共 X 家店铺"
4. - [ ] 每个类别下的店铺表格包含以下列：
   - 店铺名称
   - 状态（使用开关组件显示启用/禁用状态）
   - 排序（显示数字）
   - 操作按钮组（编辑、删除）
5. - [ ] 表格上方有添加新店铺按钮和搜索栏
6. - [ ] 添加类别筛选下拉框，可以筛选特定类别的店铺
7. - [ ] 各类别之间有明显的视觉分隔，使用不同的背景色或边框
8. - [ ] 表格底部显示分页控件和总记录数信息（格式为"共 X 家店铺"）
9. - [ ] 支持按名称、类别或创建时间进行排序
10. - [ ] 实现搜索功能，可以根据店铺名称进行筛选，搜索应作用于所有类别的店铺
11. - [ ] 表格使用淡色背景和圆角边框设计，保持现代简约风格
12. - [ ] 表格行在悬停时有背景色变化效果
13. - [ ] 页面需要响应式设计，在移动设备上自动调整布局

## Subtasks

1. - [ ] 完善页面布局和标签导航
   1. - [ ] 在 app/courier-types/page.tsx 中添加顶层标签导航
   2. - [ ] 创建"店铺管理"下的子标签导航，包含"店铺类别"和"店铺管理"
   3. - [ ] 实现标签切换逻辑
2. - [ ] 实现店铺列表组件
   1. - [ ] 完善 components/shop/ShopList.tsx 组件
   2. - [ ] 实现按类别分组的表格布局和样式
   3. - [ ] 为每个类别创建标题行，显示类别名称和店铺数量
   4. - [ ] 实现表格列，包括店铺名称、状态开关、排序和操作按钮
   5. - [ ] 为类别之间添加视觉分隔
   6. - [ ] 添加空状态和加载状态处理
3. - [ ] 实现数据获取和展示
   1. - [ ] 完善 lib/api/shop.ts 中的获取店铺列表 API
   2. - [ ] 在列表组件中集成 API 调用
   3. - [ ] 实现按类别分组的数据处理逻辑
   4. - [ ] 实现错误处理和加载状态
4. - [ ] 实现筛选、搜索和排序功能
   1. - [ ] 添加店铺搜索输入框
   2. - [ ] 添加类别筛选下拉框
   3. - [ ] 实现表格排序功能
   4. - [ ] 将筛选、搜索和排序参数集成到 API 请求中
5. - [ ] 实现分页功能
   1. - [ ] 添加分页控件
   2. - [ ] 实现分页逻辑
   3. - [ ] 显示总记录数信息
6. - [ ] 实现添加店铺按钮
   1. - [ ] 添加"添加店铺"按钮
   2. - [ ] 设置按钮位置和样式
7. - [ ] 样式优化和响应式设计
   1. - [ ] 实现表格淡色背景和圆角边框设计
   2. - [ ] 实现表格行悬停效果
   3. - [ ] 确保在不同屏幕尺寸下的正确显示
   4. - [ ] 优化移动设备上的用户体验

## Testing Requirements:

- 单元测试覆盖率 >= 85%
- 对列表组件进行组件测试，验证渲染和交互逻辑
- 测试 API 集成是否正确
- 测试类别筛选、搜索和排序功能
- 进行手动测试，验证在不同屏幕尺寸下的显示效果
- 验证按类别分组展示的正确性

## Notes

- 使用 shadcn/ui 的 Table 组件实现表格
- 使用 shadcn/ui 的 Tabs 组件实现标签导航
- 使用 shadcn/ui 的 Select 组件实现类别筛选
- 使用 shadcn/ui 的 Switch 组件实现状态开关
- 使用 shadcn/ui 的 Button 组件实现添加店铺按钮
- 使用 shadcn/ui 的 Input 组件实现搜索框
- 参考 v0dev 生成的店铺管理标签页组件设计
- 每个类别的表格标题行使用与表格区分的背景色，以突出类别分组
- 按照 UI-draft.md 中 1.3 部分的店铺列表视图设计实现界面
