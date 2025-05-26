# 后台管理系统实现规划

## 项目概述

为快递管理系统开发一个功能完整的后台管理系统，访问路径为 `/admin`，主要包含通知管理和性能监控两大核心功能模块。

## 技术架构

### 前端技术栈

- **框架**: Next.js 15.x + React 19.x + TypeScript
- **UI 组件**: shadcn/ui + Tailwind CSS
- **动画库**: Framer Motion
- **图表库**: Recharts
- **富文本编辑**: TinyMCE
- **文件上传**: React Dropzone
- **颜色选择**: React Color
- **图标库**: lucide-react

### 后端扩展

- **路由**: 新增 `/api/admin/*` 路由组
- **权限**: 管理员权限验证中间件
- **文件服务**: 支持图片/GIF 上传的文件服务
- **监控**: 性能数据收集和 WebSocket 实时推送

## 数据库设计

### 1. 通知模板表 (notification_templates)

```sql
CREATE TABLE notification_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '模板名称',
  title VARCHAR(200) NOT NULL COMMENT '通知标题',
  content TEXT NOT NULL COMMENT '通知内容(HTML)',
  style_id INT COMMENT '样式ID',
  media_urls JSON COMMENT '媒体文件URL数组',
  links JSON COMMENT '链接数组',
  is_active BOOLEAN DEFAULT true COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_style_id (style_id),
  INDEX idx_is_active (is_active)
);
```

### 2. 通知样式表 (notification_styles)

```sql
CREATE TABLE notification_styles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '样式名称',
  config JSON NOT NULL COMMENT '样式配置',
  preview_image VARCHAR(255) COMMENT '预览图片URL',
  is_system BOOLEAN DEFAULT false COMMENT '是否系统预设',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. 系统通知表 (system_notifications)

```sql
CREATE TABLE system_notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_id INT COMMENT '模板ID',
  target_users JSON COMMENT '目标用户',
  scheduled_at TIMESTAMP COMMENT '计划发送时间',
  sent_at TIMESTAMP COMMENT '实际发送时间',
  status ENUM('draft', 'scheduled', 'sent', 'cancelled') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES notification_templates(id)
);
```

### 4. 性能监控表 (performance_metrics)

```sql
CREATE TABLE performance_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  metric_type VARCHAR(50) NOT NULL COMMENT '指标类型',
  metric_value DECIMAL(10,2) NOT NULL COMMENT '指标值',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '时间戳',
  metadata JSON COMMENT '额外元数据',
  INDEX idx_metric_type (metric_type),
  INDEX idx_timestamp (timestamp)
);
```

### 5. 文件上传表 (uploaded_files)

```sql
CREATE TABLE uploaded_files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  filename VARCHAR(255) NOT NULL COMMENT '文件名',
  original_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
  file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
  file_size INT NOT NULL COMMENT '文件大小(字节)',
  mime_type VARCHAR(100) NOT NULL COMMENT 'MIME类型',
  upload_type ENUM('notification', 'system') DEFAULT 'notification',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API 设计

### 通知管理 API

#### 1. 通知模板管理

- `GET /api/admin/notification-templates` - 获取模板列表
- `POST /api/admin/notification-templates` - 创建模板
- `PUT /api/admin/notification-templates/:id` - 更新模板
- `DELETE /api/admin/notification-templates/:id` - 删除模板
- `POST /api/admin/notification-templates/preview` - 预览模板

#### 2. 通知样式管理

- `GET /api/admin/notification-styles` - 获取样式列表
- `POST /api/admin/notification-styles` - 创建自定义样式
- `PUT /api/admin/notification-styles/:id` - 更新样式
- `DELETE /api/admin/notification-styles/:id` - 删除样式

#### 3. 文件上传

- `POST /api/admin/upload` - 上传文件
- `DELETE /api/admin/upload/:id` - 删除文件
- `GET /api/admin/files` - 获取文件列表

### 性能监控 API

#### 1. 性能指标

- `GET /api/admin/performance/metrics` - 获取性能指标
- `GET /api/admin/performance/status` - 获取系统状态
- `GET /api/admin/performance/alerts` - 获取告警信息

#### 2. 实时数据

- `WebSocket /api/admin/performance/realtime` - 实时性能数据推送

## 前端页面结构

````
frontend/app/admin
              ├── layout.tsx                 # 后台布局组件
              ├── page.tsx                   # 仪表盘首页
              ├── notifications/
              │   ├── page.tsx              # 通知模板列表
              │   ├── create/
              │   │   └── page.tsx          # 创建模板
              │   ├── edit/
              │   │   └── [id]/
              │   │       └── page.tsx      # 编辑模板
              │   └── styles/
              │       └── page.tsx          # 样式管理
              ├── performance/
              │   ├── page.tsx              # 性能监控仪表板
              │   └── alerts/
              │       └── page.tsx          # 告警管理
              └── settings/
                  └── page.tsx              # 系统设置
              ```

## 核心组件设计

### 1. 通知预览组件 (NotificationPreview)

```typescript
interface NotificationPreviewProps {
  title: string;
  content: string;
  style: NotificationStyle;
  mediaUrls?: string[];
  links?: Array<{ text: string; url: string }>;
  deviceType?: "desktop" | "tablet" | "mobile";
  onClose?: () => void;
}
````

### 2. 富文本编辑器组件 (RichTextEditor)

```typescript
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  plugins?: string[];
}
```

### 3. 文件上传组件 (FileUploader)

```typescript
interface FileUploaderProps {
  accept: string[];
  maxSize: number;
  multiple?: boolean;
  onUpload: (files: File[]) => Promise<UploadResult[]>;
  onDelete: (fileId: string) => Promise<void>;
}
```

### 4. 样式编辑器组件 (StyleEditor)

```typescript
interface StyleEditorProps {
  style: NotificationStyle;
  onChange: (style: NotificationStyle) => void;
  onPreview: () => void;
}
```

### 5. 性能图表组件 (PerformanceChart)

```typescript
interface PerformanceChartProps {
  type: "line" | "area" | "bar" | "pie";
  data: MetricData[];
  timeRange: TimeRange;
  realtime?: boolean;
}
```

## 通知样式系统

### 预设样式配置

```typescript
interface NotificationStyle {
  id: number;
  name: string;
  config: {
    // 基础样式
    background: string | GradientConfig;
    borderRadius: number;
    border: BorderConfig;
    shadow: ShadowConfig;
    padding: PaddingConfig;

    // 文字样式
    typography: TypographyConfig;

    // 动画配置
    animation: AnimationConfig;

    // 特效配置
    effects: EffectsConfig;
  };
}

// 预设样式
const PRESET_STYLES = [
  {
    name: "现代卡片",
    config: {
      background: "#ffffff",
      borderRadius: 12,
      animation: { type: "slideInDown", duration: 0.5 },
    },
  },
  {
    name: "渐变背景",
    config: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      animation: { type: "scaleIn", duration: 0.6 },
    },
  },
  {
    name: "毛玻璃效果",
    config: {
      background: "rgba(255, 255, 255, 0.1)",
      effects: { backdrop: "blur(10px)" },
      animation: { type: "expandFromCenter", duration: 0.7 },
    },
  },
  {
    name: "科技风格",
    config: {
      background: "#0a0a0a",
      effects: { glow: true, neon: "#00ff88" },
      animation: { type: "glitchIn", duration: 0.8 },
    },
  },
];
```

## 性能监控指标

### 收集的指标类型

```typescript
interface PerformanceMetrics {
  // 系统指标
  cpu_usage: number; // CPU使用率 (%)
  memory_usage: number; // 内存使用率 (%)
  disk_usage: number; // 磁盘使用率 (%)

  // 应用指标
  response_time: number; // 平均响应时间 (ms)
  request_count: number; // 请求数量
  error_rate: number; // 错误率 (%)

  // 数据库指标
  db_connections: number; // 数据库连接数
  db_query_time: number; // 数据库查询时间 (ms)

  // 缓存指标
  cache_hit_rate: number; // 缓存命中率 (%)
  cache_memory: number; // 缓存内存使用 (MB)
}
```

### 告警规则

```typescript
interface AlertRule {
  metric: string;
  operator: ">" | "<" | "=" | ">=";
  threshold: number;
  severity: "info" | "warning" | "critical";
  message: string;
}

const DEFAULT_ALERT_RULES = [
  { metric: "cpu_usage", operator: ">", threshold: 80, severity: "warning" },
  {
    metric: "memory_usage",
    operator: ">",
    threshold: 85,
    severity: "critical",
  },
  {
    metric: "response_time",
    operator: ">",
    threshold: 1000,
    severity: "warning",
  },
  { metric: "error_rate", operator: ">", threshold: 5, severity: "critical" },
];
```

## 实现步骤

### 阶段一：基础架构 (1-2 周)

1. 设置后台路由和权限验证
2. 创建数据库表结构
3. 实现基础 API 框架
4. 搭建前端页面结构和布局

### 阶段二：通知管理功能 (2-3 周)

1. 实现通知模板 CRUD 功能
2. 开发富文本编辑器集成
3. 创建文件上传服务
4. 实现通知预览组件
5. 开发样式编辑器

### 阶段三：性能监控功能 (2-3 周)

1. 实现性能数据收集
2. 创建监控仪表板
3. 开发实时数据推送
4. 实现告警系统
5. 添加数据导出功能

### 阶段四：优化和测试 (1-2 周)

1. 性能优化和代码重构
2. 添加单元测试和集成测试
3. 用户体验优化
4. 文档完善

## 安全考虑

### 1. 权限控制

- 管理员身份验证
- 基于角色的访问控制 (RBAC)
- API 接口权限验证

### 2. 文件上传安全

- 文件类型白名单验证
- 文件大小限制
- 病毒扫描集成
- 安全的文件存储路径

### 3. 数据安全

- SQL 注入防护
- XSS 攻击防护
- CSRF 令牌验证
- 敏感数据加密

## 性能优化

### 1. 前端优化

- 代码分割和懒加载
- 图片压缩和 CDN
- 缓存策略
- 虚拟滚动

### 2. 后端优化

- 数据库查询优化
- Redis 缓存
- API 响应压缩
- 连接池管理

### 3. 监控优化

- 数据采样策略
- 批量数据处理
- 异步任务队列
- 数据清理策略

## 部署方案

### 1. 开发环境

- Docker 容器化部署
- 热重载开发服务器
- 开发数据库

### 2. 生产环境

- Nginx 反向代理
- PM2 进程管理
- 数据库主从复制
- 文件存储服务

## 监控和维护

### 1. 应用监控

- 错误日志收集
- 性能指标监控
- 用户行为分析

### 2. 系统维护

- 定期数据备份
- 日志轮转
- 安全更新
- 性能调优

这个实现规划提供了完整的技术架构、数据库设计、API 设计和开发步骤，可以作为后台管理系统开发的详细指南。
