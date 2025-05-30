# Story 4.7: 数据导出功能

## Story

**As a** 系统管理员  
**I want** 能够将统计分析结果导出为常用文件格式  
**so that** 我可以在外部工具中进一步分析数据，或将数据共享给不使用系统的同事。

## Status

developing

## Context

统计分析功能提供了丰富的数据可视化和分析能力，但用户有时需要将数据导出到 Excel、CSV 或 PDF 等格式，用于进一步分析、报告生成或与不使用该系统的同事共享。数据导出功能是完善统计分析体验的重要组成部分。

本故事将实现统一的数据导出功能，允许用户导出当前时间筛选范围内的完整订单数据。用户可以在导出的数据基础上自己做透视表分析，比系统预设的聚合更灵活。该功能是统计分析功能（Epic 4）的补充，依赖于各个统计维度功能（故事 4.3-4.6）。

## Estimation

Story Points: 2

## Acceptance Criteria

1. - [ ] 在统计控制面板中添加"导出数据"按钮
2. - [ ] 点击"导出数据"按钮时，弹出导出选项对话框
3. - [ ] 导出选项对话框包含以下内容：
   - 导出格式选择（Excel、CSV、PDF）
   - 导出范围选择（当前页数据、全部数据）
   - 导出包含图表选项（仅限 PDF 格式）
   - 文件名称输入框（带有默认名称建议）
4. - [ ] 导出当前时间筛选范围内的完整订单数据
5. - [ ] 导出文件包含以下信息：
   - 完整的订单明细数据
   - 当前时间筛选条件
   - 导出时间和用户信息
6. - [ ] 导出过程中显示加载状态和进度条
7. - [ ] 导出完成后提供文件下载链接
8. - [ ] 导出失败时显示错误消息
9. - [ ] 导出大量数据时不影响页面其他部分的使用
10. - [ ] 导出文件具有良好的格式和样式，便于阅读和使用

## Subtasks

1. - [ ] 实现导出服务
   1. - [ ] 创建 `lib/services/export.ts` 导出服务
   2. - [ ] 集成现有 API 服务框架，确保导出 URL 正确处理代理情况
   3. - [ ] 使用适当的 URL 获取方法，支持不同环境配置
   4. - [ ] 实现 Excel 导出功能，使用 exceljs 库
   5. - [ ] 实现 CSV 导出功能
   6. - [ ] 实现 PDF 导出功能，使用 jspdf 和 jspdf-autotable 库
   7. - [ ] 添加图表导出功能（转换为图片后嵌入 PDF）
2. - [ ] 创建导出选项对话框
   1. - [ ] 创建 `app/stats/components/ExportDialog.tsx` 组件
   2. - [ ] 实现导出格式选择控件
   3. - [ ] 实现导出范围选择控件
   4. - [ ] 添加包含图表选项（仅在 PDF 格式下启用）
   5. - [ ] 实现文件名输入框，添加默认值生成逻辑
3. - [ ] 集成到统计控制面板
   1. - [ ] 在 `StatsControlPanel.tsx` 中添加导出按钮
   2. - [ ] 集成导出对话框
   3. - [ ] 实现导出按钮的状态管理（禁用状态处理）
4. - [ ] 实现统一的数据导出适配
   1. - [ ] 创建通用的订单数据导出适配器
   2. - [ ] 根据当前时间筛选条件获取数据
   3. - [ ] 确保导出数据包含所有必要的维度字段
5. - [ ] 实现导出进度和状态反馈
   1. - [ ] 创建导出进度指示器组件
   2. - [ ] 实现导出过程中的状态更新
   3. - [ ] 添加导出完成和失败通知
6. - [ ] 优化导出文件样式和格式
   1. - [ ] 设计表格样式（边框、字体、颜色等）
   2. - [ ] 添加页眉和页脚（导出时间、筛选条件等）
   3. - [ ] 优化 PDF 中的图表布局
7. - [ ] 性能优化
   1. - [ ] 实现大数据量导出的分批处理
   2. - [ ] 使用 Web Worker 避免阻塞主线程
   3. - [ ] 添加导出超时处理

## Testing Requirements:

- 单元测试覆盖率 >= 85%
- 对导出服务进行单元测试，验证各种格式的导出功能
- 对导出对话框组件进行组件测试，验证渲染和交互逻辑
- 测试各统计维度的导出适配器
- 测试大数据量导出的性能和稳定性
- 测试导出文件的格式和内容正确性
- 测试异常情况的处理（如导出失败、导出超时等）
- 进行端到端测试，验证完整的导出流程

## Notes

- 使用 shadcn/ui 的 Dialog 组件实现导出选项对话框
- 使用 shadcn/ui 的 Button 组件实现导出按钮
- 使用 shadcn/ui 的 Select、RadioGroup 和 Checkbox 组件实现各种选择控件
- 使用 exceljs 库实现 Excel 导出
- 使用 jspdf 和 jspdf-autotable 库实现 PDF 导出
- 考虑为每种导出格式提供预览功能
- 对于大量数据导出，考虑添加电子邮件通知功能（导出完成后发送下载链接）
- 导出按钮在无数据可导出时应禁用
- 导出文件命名应包含统计维度、日期范围等关键信息
- PDF 导出时确保图表清晰可读
- 导出的 Excel 文件应包含适当的格式设置（如数字格式、日期格式等）
- 确保所有 API 调用都通过现有的 API 服务框架进行，正确处理代理配置
- 使用 `useEnvStore` 或其他环境配置方法获取正确的 API URL
- 在开发过程中测试代理和非代理环境下的功能表现
