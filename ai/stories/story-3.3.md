# Story 3.3: 出力数据录入表单

## Story

**As a** 系统管理员  
**I want** 能够录入各个店铺不同快递类型的出力数据  
**so that** 我可以记录和追踪每家店铺的出货量情况。

## Status

complete

## Context

出力数据的录入是整个系统的核心功能，用户需要一个简单高效的表单来完成数据录入操作。本故事将实现出力数据录入表单及其验证逻辑，确保用户能够正确地录入特定日期、特定店铺、特定快递类型的出力数据。

表单需要包含日期、店铺、快递类型、数量和备注等字段，并提供适当的验证机制，防止录入无效或错误的数据。同时，录入成功后应该提供清晰的反馈，并刷新相关数据显示。

## Estimation

Story Points: 3

## Acceptance Criteria

1. - [ ] 在出力数据页面中部实现数据录入表单，包含以下字段：
   - 店铺选择（使用故事 3.2 中的店铺选择组件）
   - 快递类型选择（使用故事 3.2 中的快递类型选择组件）
   - 数量输入框（只允许输入正整数）
   - 备注文本框（可选）
2. - [ ] 表单顶部显示当前选择的日期（来自故事 3.2 中的日期选择器）
3. - [ ] 实现表单验证逻辑，包括：
   - 店铺必须选择
   - 快递类型必须选择
   - 数量必须为正整数
4. - [ ] 添加"添加记录"按钮，点击后提交表单数据
5. - [ ] 提交过程中显示加载状态
6. - [ ] 提交成功后显示成功提示消息
7. - [ ] 提交失败时显示错误提示消息
8. - [ ] 提交成功后清空表单，准备下一次录入，但保留日期和店铺选择
9. - [ ] 提交成功后自动更新"最近录入数据"区域，显示新添加的记录
10. - [ ] 提交成功后自动更新"当日数据汇总"区域，反映新添加的数据
11. - [ ] 表单布局在大屏幕下采用水平排列方式，在小屏幕下采用垂直堆叠方式

## Subtasks

1. - [ ] 构建表单组件
   1. - [ ] 在 `app/output-data/components/OutputForm.tsx` 中实现表单组件
   2. - [ ] 集成日期显示、店铺选择和快递类型选择组件
   3. - [ ] 添加数量输入框和备注文本框
   4. - [ ] 实现表单布局，支持响应式设计
2. - [ ] 实现表单状态管理
   1. - [ ] 使用 React Hook 管理表单状态
   2. - [ ] 实现字段值变更处理
   3. - [ ] 实现表单重置功能
3. - [ ] 实现表单验证
   1. - [ ] 使用 zod 实现表单验证逻辑
   2. - [ ] 添加字段验证规则
   3. - [ ] 实现错误消息展示
4. - [ ] 实现表单提交功能
   1. - [ ] 实现表单提交处理函数
   2. - [ ] 创建并调用保存出力数据的 API
   3. - [ ] 处理提交过程中的加载状态
   4. - [ ] 处理提交成功和失败的情况
5. - [ ] 实现提交后的数据更新
   1. - [ ] 提交成功后刷新"最近录入数据"列表
   2. - [ ] 提交成功后刷新"当日数据汇总"
   3. - [ ] 实现数据刷新的状态管理
6. - [ ] 添加表单反馈机制
   1. - [ ] 添加加载状态指示器
   2. - [ ] 实现成功和错误提示消息
   3. - [ ] 设置提示消息的自动消失逻辑
7. - [ ] 样式优化
   1. - [ ] 优化表单控件布局和间距
   2. - [ ] 确保表单元素尺寸适当，便于操作
   3. - [ ] 优化移动端下的表单展示和交互

## Testing Requirements:

- 单元测试覆盖率 >= 85%
- 对表单组件进行组件测试，验证渲染和交互逻辑
- 测试表单验证逻辑，包括各种错误情况
- 测试表单提交功能，包括成功和失败情况
- 测试表单提交后的数据更新逻辑
- 测试表单在不同屏幕尺寸下的响应式布局
- 进行手动测试，验证表单的用户体验和交互流程

## Notes

- 使用 shadcn/ui 的 Form 组件和相关控件实现表单
- 使用 zod 库进行表单验证，与 shadcn/ui 的 Form 组件集成
- 数量输入框应使用 shadcn/ui 的 Input 组件，并限制只能输入数字
- 备注文本框应使用 shadcn/ui 的 Textarea 组件
- 添加记录按钮应使用 shadcn/ui 的 Button 组件，采用主色调
- 表单提交反馈使用 shadcn/ui 的 Toast 组件
- 按照 UI-draft.md 中 2.1 部分的出力数据页面布局设计中的相关部分实现
- 考虑添加键盘快捷键支持，如回车键提交表单，提高录入效率
- 参考 v0dev 生成的出力数据录入表单设计
