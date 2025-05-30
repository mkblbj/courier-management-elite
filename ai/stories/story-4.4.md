# Story 4.4: 按店铺统计功能

## Story

**As a** 系统管理员  
**I want** 能够按店铺统计出力数据  
**so that** 我可以详细了解每个店铺的业务表现，识别表现优异和需要改进的店铺。

## Status

complete

## Context

按店铺进行统计是出力数据分析最细致的维度之一。通过这种方式，管理员可以深入了解每个店铺的具体表现，比较不同店铺之间的业务量差异，识别业绩领先和落后的店铺，从而制定有针对性的业务策略。

本故事将实现按店铺统计的功能，包括数据表格展示和可视化图表，允许用户通过日期范围、店铺类别、快递类型等筛选条件进一步细化分析。该功能是统计分析功能（Epic 4）的重要组成部分，依赖于统计分析页面基础 UI（故事 4.1）和统计维度选择功能（故事 4.2）。

## Estimation

Story Points: 3

## Acceptance Criteria

1. - [ ] 当用户选择"按店铺统计"维度时，显示相应的统计数据
2. - [ ] 使用数据表格展示各店铺的统计结果，包含以下列：
   - 店铺名称
   - 所属类别
   - 总出力量
   - 占总体出力的百分比
   - 日均出力量（根据选定时间范围计算）
   - 快递类型分布（可展开查看详细数据）
   - 同比/环比变化（如果有历史数据）
3. - [ ] 使用图表直观展示各店铺的数据分布：
   - 提供按店铺名称的柱状图，显示出力量大小
   - 提供按类别分组的堆叠柱状图，显示各类别下店铺的出力量
   - 图表支持切换不同的显示方式
4. - [ ] 支持以下筛选条件：
   - 日期范围（必选）
   - 店铺类别（可选，多选）
   - 快递类型（可选，多选）
5. - [ ] 支持表格数据排序，可以按出力量、占比或日均量排序
6. - [ ] 支持表格分页，当店铺数量较多时分页显示
7. - [ ] 支持按类别对表格数据进行分组展示
8. - [ ] 表格支持行展开功能，展开后显示该店铺各快递类型的详细数据
9. - [ ] 图表支持交互，悬停时显示详细数据
10. - [ ] 当数据量较大时，保持良好的性能和响应速度
11. - [ ] 数据加载过程中显示适当的加载状态

## Subtasks

1. - [ ] 实现数据获取服务
   1. - [ ] 在 `lib/api/stats.ts` 中添加获取按店铺统计数据的方法
   2. - [ ] 遵循前端服务代理模式，确保同时支持直接和代理 API 调用
   3. - [ ] 使用环境配置中的 URL 获取函数以正确处理代理情况
   4. - [ ] 实现日期范围、店铺类别和快递类型筛选参数
   5. - [ ] 处理数据加载状态和错误情况
2. - [ ] 实现数据表格组件
   1. - [ ] 创建 `app/stats/components/ShopStatsTable.tsx` 组件
   2. - [ ] 实现表格列配置和数据绑定
   3. - [ ] 添加排序功能
   4. - [ ] 实现分页控件
   5. - [ ] 添加行展开功能，显示各快递类型详情
   6. - [ ] 实现按类别分组展示
3. - [ ] 实现数据可视化图表
   1. - [ ] 创建 `app/stats/components/ShopStatsChart.tsx` 组件
   2. - [ ] 集成 Recharts 或其他图表库
   3. - [ ] 实现柱状图和堆叠柱状图
   4. - [ ] 添加图表切换功能
   5. - [ ] 实现图表交互和工具提示
4. - [ ] 完善筛选器组件
   1. - [ ] 更新 `StatsFilterPanel.tsx` 组件以支持店铺统计所需的筛选条件
   2. - [ ] 实现日期范围选择器
   3. - [ ] 实现店铺类别多选框
   4. - [ ] 实现快递类型多选框
   5. - [ ] 添加筛选条件重置功能
5. - [ ] 集成到统计分析页面
   1. - [ ] 在 `ShopOutputStats.tsx` 中条件性渲染店铺统计组件
   2. - [ ] 连接维度选择、筛选器和数据展示组件
   3. - [ ] 优化页面布局和交互流程
6. - [ ] 性能优化
   1. - [ ] 实现数据缓存机制
   2. - [ ] 优化大数据量下的渲染性能
   3. - [ ] 实现表格的虚拟滚动
   4. - [ ] 添加数据预取功能

## Testing Requirements:

- 单元测试覆盖率 >= 85%
- 对数据表格和图表组件进行组件测试，验证渲染和交互逻辑
- 测试筛选功能，验证筛选条件对数据结果的影响
- 测试排序、分页和分组功能
- 测试表格行展开功能
- 测试大数据量下的性能和响应速度
- 测试与 API 的集成，包括不同参数组合的情况
- 进行端到端测试，验证整个功能流程

## Notes

- 使用 shadcn/ui 的 Table 组件实现数据表格
- 使用 Recharts 实现数据可视化图表
- 考虑使用颜色或图标标识不同店铺类别，提高可读性
- 堆叠柱状图中使用不同颜色表示不同快递类型，保持颜色一致性
- 百分比数据应精确到小数点后两位
- 考虑添加同比/环比变化的箭头指示（上升/下降）和颜色提示（绿/红）
- 对于数据量较大的情况，考虑实现数据懒加载或分批加载
- 确保表格和图表在打印时能够正确显示（添加打印样式）
- 参考现有的统计分析页面样式，确保视觉一致性
- 确保所有 API 调用都通过现有的 API 服务框架进行，正确处理代理配置
- 使用 `useEnvStore` 或其他环境配置方法获取正确的 API URL
- 在开发过程中测试代理和非代理环境下的功能表现
