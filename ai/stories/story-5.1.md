# Story 5.1: 今日出力卡片

## Story

**As a** 系统管理员  
**I want** 在仪表盘上看到今日各店铺的出力情况  
**so that** 我可以快速了解当日业务情况，不需要切换到专门的出力数据页面。

## Status

complete

## Context

仪表盘是系统的核心页面，用户访问频率最高。通过在仪表盘上添加今日店铺出力情况卡片，可以让用户一打开系统就能看到最关键的业务数据，提高用户体验和工作效率。

今日出力卡片将展示所有店铺当天的出力总量、各类别的出力分布以及各店铺的详细出力数据，支持按类别筛选，帮助用户快速掌握业务全局。

## Estimation

Story Points: 3

## Acceptance Criteria

1. - [ ] 在/dashboard 页面添加"今日店铺出力情况"卡片
2. - [ ] 卡片顶部显示今日总出力量，使用大号字体突出显示
3. - [ ] 卡片中部显示各店铺类别出力分布的饼图
4. - [ ] 卡片中部显示各店铺出力分布的饼图，支持按类别筛选
5. - [ ] 卡片底部显示各店铺出力量和占比的表格，按类别分组
6. - [ ] 实现自动刷新机制，定期更新数据（默认 5 分钟刷新一次）
7. - [ ] 添加手动刷新按钮，点击后立即更新数据
8. - [ ] 数据加载过程中显示加载状态
9. - [ ] 当没有数据时，显示"暂无数据"提示
10. - [ ] 卡片的视觉设计应与系统的整体风格保持一致
11. - [ ] 在移动设备上能够良好展示

## Subtasks

1. - [ ] 创建今日出力卡片组件
   1. - [ ] 在 `app/dashboard/components/ShopOutputCard.tsx` 中实现今日出力卡片组件
   2. - [ ] 实现饼图组件，集成图表库
   3. - [ ] 实现店铺数据表格组件
2. - [ ] 实现数据获取和处理
   1. - [ ] 创建获取今日出力数据的服务函数
   2. - [ ] 实现数据加载和错误处理
   3. - [ ] 实现数据按类别和店铺的分组统计
3. - [ ] 实现数据可视化
   1. - [ ] 集成 Recharts 库
   2. - [ ] 实现类别分布饼图
   3. - [ ] 实现店铺分布饼图
   4. - [ ] 添加图表交互功能，如悬停显示详情
4. - [ ] 实现筛选功能
   1. - [ ] 添加类别筛选下拉框
   2. - [ ] 实现按类别筛选店铺数据的逻辑
   3. - [ ] 确保筛选后图表和表格数据同步更新
5. - [ ] 实现自动刷新机制
   1. - [ ] 创建定时器，定期刷新数据
   2. - [ ] 添加手动刷新按钮
   3. - [ ] 确保组件卸载时清除定时器
6. - [ ] 集成到仪表盘页面
   1. - [ ] 将卡片组件集成到仪表盘布局
   2. - [ ] 调整卡片尺寸和位置
   3. - [ ] 测试与仪表盘其他组件的协调性
7. - [ ] 实现响应式布局
   1. - [ ] 优化卡片在不同屏幕尺寸下的显示
   2. - [ ] 确保图表在小屏幕上仍能清晰显示
   3. - [ ] 测试不同设备下的展示效果
8. - [ ] 样式优化
   1. - [ ] 设计卡片样式，确保视觉吸引力
   2. - [ ] 优化图表颜色和样式，与系统风格一致
   3. - [ ] 添加适当的动画和过渡效果

## Testing Requirements:

- 单元测试覆盖率 >= 85%
- 对卡片组件进行组件测试，验证渲染和数据展示
- 测试数据统计逻辑的准确性
- 测试筛选功能
- 测试图表的渲染和交互
- 测试自动刷新和手动刷新功能
- 测试组件在不同数据状态下的显示（空数据、加载中、错误等）
- 进行手动测试，验证在不同屏幕尺寸下的用户体验

## Notes

- 使用 shadcn/ui 的 Card 组件实现出力卡片
- 使用 Recharts 实现数据可视化图表
- 图表颜色应采用系统配色方案，保持视觉一致性
- 饼图应支持交互，如悬停显示详细数据
- 参考 v0dev_prompt_shop_output_management.md 中的第 11 点"今日店铺出力卡片组件"设计
- 卡片上部显示总出力量时，考虑添加与前一天相比的增长或减少百分比
- 确保数据刷新时有适当的视觉反馈，但不要打断用户操作
- 考虑添加"查看更多"链接，跳转到出力数据详情页面
