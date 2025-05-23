# 后台管理系统 V0 提示词

本文档包含用于生成快递管理系统后台管理功能的 Vercel V0 提示词，包括通知管理和性能监控功能。

## 主要功能提示词

### 1. 后台管理主页面布局

```
创建一个现代化的后台管理系统主页面，使用 React、Next.js、TypeScript、Tailwind CSS 和 shadcn/ui 组件。页面路径为 /admin，包含以下布局：

1. 顶部导航栏：
   - 左侧：系统Logo和"后台管理系统"标题
   - 右侧：用户头像下拉菜单（包含退出登录选项）

2. 侧边栏导航：
   - 仪表盘（默认选中）
   - 通知管理
   - 性能监控
   - 系统设置
   - 使用 lucide-react 图标，每个菜单项有对应图标

3. 主内容区域：
   - 面包屑导航
   - 动态内容区域，根据选中的菜单显示不同内容

4. 设计要求：
   - 深色侧边栏配浅色主内容区
   - 响应式设计，移动端侧边栏可折叠
   - 平滑的页面切换动画
   - 现代简约的设计风格

使用 Framer Motion 实现页面切换和悬停动画效果。整体配色采用专业的管理系统风格。
```

### 2. 通知模板管理页面

```
设计一个功能完整的通知模板管理页面，包含以下功能：

1. 页面头部：
   - 标题"通知模板管理"
   - "新建模板"按钮（主要按钮样式）
   - 搜索框和状态筛选下拉菜单

2. 模板列表区域：
   - 卡片式布局展示模板
   - 每个卡片包含：模板名称、创建时间、状态开关、预览按钮、编辑按钮、删除按钮
   - 支持拖拽排序
   - 分页控件

3. 模板编辑对话框：
   - 大尺寸模态框（全屏或接近全屏）
   - 左侧编辑区域：
     * 模板名称输入框
     * 通知标题输入框
     * 富文本编辑器（支持HTML）
     * 样式选择器（预设样式卡片选择）
     * 媒体文件上传区域（支持拖拽上传图片/GIF）
     * 链接添加器（文本+URL输入）
   - 右侧预览区域：实时预览通知效果
   - 底部操作按钮：保存、预览、取消

4. 样式选择器：
   - 多种预设通知样式卡片
   - 包含：现代卡片、渐变背景、毛玻璃效果、霓虹风格等
   - 每个样式有缩略图预览

5. 文件上传组件：
   - 拖拽上传区域
   - 支持多文件上传
   - 文件预览和删除功能
   - 进度条显示

使用 TinyMCE 或类似的富文本编辑器，Framer Motion 实现动画效果。整体设计要现代化且易用。
```

### 3. 通知预览组件

```
创建一个动态通知预览组件，能够实时展示不同样式的通知弹窗效果：

1. 预览容器：
   - 模拟浏览器窗口的背景
   - 可切换不同设备尺寸预览（桌面/平板/手机）
   - 深色/浅色背景切换

2. 通知弹窗样式（多种可选）：

   **现代卡片风格**：
   - 白色背景，圆角边框
   - 顶部彩色进度条
   - 左侧图标，右侧内容
   - 底部操作按钮
   - 入场动画：从上方滑入

   **渐变背景风格**：
   - 渐变色背景
   - 半透明白色内容区
   - 大号图标居中
   - 入场动画：缩放+淡入

   **毛玻璃效果**：
   - 半透明背景
   - 毛玻璃模糊效果
   - 霓虹色边框
   - 入场动画：从中心扩散

   **极简风格**：
   - 纯色背景
   - 极简图标和文字
   - 细线边框
   - 入场动画：左右摇摆

   **科技风格**：
   - 深色背景
   - 霓虹色装饰线条
   - 发光效果
   - 入场动画：故障效果

3. 动画效果要求：
   - 使用 Framer Motion 实现
   - 入场动画要引人注目但不过于夸张
   - 支持自定义动画时长和缓动函数
   - 鼠标悬停时的微交互效果

4. 交互功能：
   - 点击预览按钮触发通知显示
   - 支持重复播放动画
   - 可调整动画速度
   - 全屏预览模式

预览组件要能准确反映最终用户看到的效果，动画要流畅且视觉冲击力强。
```

### 4. 性能监控仪表板

```
设计一个专业的性能监控仪表板页面，实时展示系统性能指标：

1. 概览卡片区域（顶部4个卡片）：
   - 系统状态（健康/警告/错误，带状态指示灯）
   - CPU使用率（百分比+环形进度条）
   - 内存使用率（百分比+环形进度条）
   - 响应时间（毫秒+趋势箭头）

2. 实时图表区域：
   - 左上：CPU使用率时间线图（折线图）
   - 右上：内存使用率时间线图（面积图）
   - 左下：API响应时间分布图（柱状图）
   - 右下：错误率统计图（饼图）

3. 系统信息面板：
   - 服务器信息：操作系统、Node.js版本、运行时间
   - 数据库状态：连接状态、查询性能
   - 缓存状态：Redis连接、命中率
   - 最近备份时间

4. 告警日志区域：
   - 最近告警列表
   - 告警级别标识（严重/警告/信息）
   - 时间戳和详细描述
   - 处理状态

5. 实时更新功能：
   - WebSocket连接状态指示器
   - 自动刷新间隔设置
   - 手动刷新按钮
   - 数据更新动画效果

6. 交互功能：
   - 时间范围选择器（1小时/6小时/24小时/7天）
   - 指标类型筛选
   - 图表缩放和平移
   - 数据导出功能

使用 Recharts 创建图表，WebSocket 实现实时数据更新，Framer Motion 添加数据变化动画。配色使用专业的监控系统风格（深蓝色主题）。
```

### 5. 文件上传组件

```
创建一个功能强大的文件上传组件，支持多种媒体格式：

1. 上传区域设计：
   - 大尺寸拖拽区域，虚线边框
   - 中央上传图标和提示文字
   - 支持点击选择和拖拽上传
   - 拖拽时高亮边框和背景色变化

2. 文件类型支持：
   - 图片：JPG、PNG、WebP、SVG
   - 动图：GIF、WebP动图
   - 视频：MP4、WebM（可选）
   - 文件大小限制提示

3. 上传进度显示：
   - 每个文件独立的进度条
   - 上传速度和剩余时间显示
   - 可取消上传功能
   - 错误状态提示

4. 文件预览功能：
   - 图片缩略图预览
   - GIF动图播放控制
   - 文件信息显示（名称、大小、类型）
   - 删除和重新上传按钮

5. 批量操作：
   - 全选/取消全选
   - 批量删除
   - 批量重新上传
   - 上传队列管理

6. 高级功能：
   - 图片压缩选项
   - 文件重命名
   - 上传到不同目录
   - 云存储集成提示

7. 响应式设计：
   - 移动端优化的触摸体验
   - 自适应网格布局
   - 手势支持

使用 React Dropzone 实现拖拽功能，Framer Motion 添加上传动画效果。设计要直观易用，支持大文件上传的进度反馈。
```

### 6. 通知样式编辑器

```
设计一个可视化的通知样式编辑器，让用户能够自定义通知外观：

1. 编辑器布局：
   - 左侧属性面板（1/3宽度）
   - 右侧实时预览区域（2/3宽度）
   - 顶部工具栏（保存、重置、导入、导出）

2. 属性面板分组：

   **基础样式**：
   - 背景颜色/渐变选择器
   - 边框样式（颜色、宽度、圆角）
   - 阴影效果（偏移、模糊、颜色）
   - 尺寸设置（宽度、高度、内边距）

   **文字样式**：
   - 字体选择器
   - 字号、行高、字重
   - 文字颜色
   - 对齐方式

   **动画效果**：
   - 入场动画类型选择
   - 动画时长滑块
   - 缓动函数选择
   - 延迟时间设置

   **高级效果**：
   - 毛玻璃效果开关
   - 霓虹发光效果
   - 粒子背景效果
   - 3D变换效果

3. 颜色选择器：
   - 支持HEX、RGB、HSL格式
   - 预设颜色面板
   - 渐变编辑器
   - 透明度滑块

4. 预览功能：
   - 实时预览样式变化
   - 不同设备尺寸预览
   - 动画重播按钮
   - 背景切换（测试对比度）

5. 预设模板：
   - 多种预设样式模板
   - 一键应用模板
   - 自定义模板保存
   - 模板分享功能

6. 导入导出：
   - JSON格式配置导出
   - CSS代码生成
   - 样式模板导入
   - 批量样式管理

使用 React Color 实现颜色选择器，Framer Motion 处理动画预览。界面要直观，实时反馈要流畅。
```

## 综合提示词

如果需要一次性生成完整的后台管理系统，可以使用以下整合提示词：

```
创建一个完整的企业级后台管理系统，用于快递管理系统的管理功能，包含通知管理和性能监控两大核心模块：

## 系统架构
- 使用 Next.js 15.x、React 19.x、TypeScript
- UI框架：shadcn/ui + Tailwind CSS
- 动画库：Framer Motion
- 图表库：Recharts
- 富文本编辑：TinyMCE
- 文件上传：React Dropzone
- 图标库：lucide-react

## 主要页面和功能

### 1. 主布局页面 (/admin)
- 响应式侧边栏导航（仪表盘、通知管理、性能监控、系统设置）
- 顶部导航栏（Logo、用户菜单）
- 面包屑导航
- 深色侧边栏 + 浅色主内容区设计

### 2. 通知管理模块
- **模板列表页面**：卡片式布局，支持搜索、筛选、排序
- **模板编辑器**：分屏设计（左侧编辑，右侧预览）
  * 富文本编辑器（支持HTML）
  * 多种通知样式选择（现代卡片、渐变背景、毛玻璃、霓虹风格、科技风格）
  * 媒体文件上传（图片、GIF支持）
  * 超链接管理
- **实时预览组件**：支持多设备尺寸预览，动画效果展示
- **样式编辑器**：可视化样式定制（颜色、字体、动画、特效）

### 3. 性能监控模块
- **监控仪表板**：
  * 系统状态概览卡片（CPU、内存、响应时间、系统状态）
  * 实时图表（CPU使用率、内存使用率、API响应时间、错误率）
  * 系统信息面板（服务器信息、数据库状态、缓存状态）
  * 告警日志列表
- **实时数据更新**：WebSocket连接，自动刷新
- **交互功能**：时间范围选择、数据导出、图表缩放

### 4. 核心组件
- **文件上传组件**：拖拽上传、进度显示、批量操作、文件预览
- **通知预览组件**：多样式支持、动画效果、设备适配
- **数据图表组件**：实时更新、交互式图表、专业配色

## 设计要求

### 视觉设计
- 现代企业级管理系统风格
- 深蓝色主题配色方案
- 卡片式布局，适当阴影和圆角
- 清晰的视觉层次和信息架构

### 动画效果
- 页面切换的平滑过渡
- 通知弹窗的引人入胜动画（滑入、缩放、故障效果等）
- 数据更新的微动画
- 悬停和点击的交互反馈

### 响应式设计
- 桌面端优先，兼容平板和移动设备
- 侧边栏在移动端可折叠
- 图表和表格的移动端适配
- 触摸友好的交互设计

### 性能优化
- 懒加载和代码分割
- 图片和媒体文件的优化
- 实时数据的防抖处理
- 大数据量的虚拟滚动

## 特色功能
1. **多样化通知样式**：提供5+种预设样式，支持自定义
2. **实时预览**：编辑时即时看到效果
3. **动画编辑器**：可视化配置动画参数
4. **性能监控**：专业级系统监控界面
5. **文件管理**：强大的媒体文件上传和管理
6. **响应式预览**：支持多设备尺寸预览

整个系统要体现专业性、易用性和视觉冲击力，特别是通知弹窗的动画效果要做到引人入胜。
```

## 使用说明

1. 可以将各个模块的提示词单独使用，逐步构建系统
2. 也可以使用综合提示词一次性生成完整系统
3. 根据实际需求调整功能模块和设计细节
4. 确保项目已安装所需依赖包

## 技术栈清单

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "typescript": "^5.0.0",
    "framer-motion": "^10.0.0",
    "recharts": "^2.8.0",
    "@tinymce/tinymce-react": "^4.3.0",
    "react-dropzone": "^14.2.0",
    "react-color": "^2.19.3",
    "lucide-react": "^0.300.0",
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^3.4.0"
  }
}
```
