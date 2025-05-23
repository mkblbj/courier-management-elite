// 通知样式配置
export interface NotificationStyleConfig {
  // 基础样式
  background: string | GradientConfig
  borderRadius: number
  border: BorderConfig
  shadow: ShadowConfig
  padding: PaddingConfig

  // 文字样式
  typography: TypographyConfig

  // 动画配置
  animation: AnimationConfig

  // 特效配置
  effects: EffectsConfig
}

export interface GradientConfig {
  type: 'linear' | 'radial'
  direction?: string
  colors: Array<{ color: string; stop: number }>
}

export interface BorderConfig {
  width: number
  style: 'solid' | 'dashed' | 'dotted'
  color: string
}

export interface ShadowConfig {
  x: number
  y: number
  blur: number
  spread: number
  color: string
}

export interface PaddingConfig {
  top: number
  right: number
  bottom: number
  left: number
}

export interface TypographyConfig {
  fontFamily: string
  fontSize: number
  fontWeight: number
  lineHeight: number
  color: string
  textAlign: 'left' | 'center' | 'right'
}

export interface AnimationConfig {
  type: 'slideInDown' | 'slideInUp' | 'slideInLeft' | 'slideInRight' | 'scaleIn' | 'expandFromCenter' | 'glitchIn' | 'bounceIn'
  duration: number
  delay?: number
  easing?: string
}

export interface EffectsConfig {
  backdrop?: string
  glow?: boolean
  neon?: string
  particles?: boolean
  transform3d?: boolean
}

// 通知样式
export interface NotificationStyle {
  id: number
  name: string
  config: NotificationStyleConfig
  preview_image?: string
  is_system: boolean
  created_at: string
}

// 通知模板
export interface NotificationTemplate {
  id: number
  name: string
  title: string
  content: string
  style_id: number
  style_name?: string
  media_urls: string[]
  links: Array<{ text: string; url: string }>
  is_active: boolean
  created_at: string
  updated_at: string
}

// 文件上传结果
export interface UploadResult {
  url: string
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  id?: number
}

// 性能指标
export interface PerformanceMetrics {
  timestamp: string
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  response_time: number
  request_count: number
  error_rate: number
  db_connections: number
  db_query_time: number
  cache_hit_rate: number
  cache_memory: number
}

// 系统状态
export interface SystemStatus {
  status: 'healthy' | 'warning' | 'error'
  uptime: number
  version: string
  database_status: 'connected' | 'disconnected'
  redis_status: 'connected' | 'disconnected'
  last_backup: string
}

// 告警规则
export interface AlertRule {
  metric: string
  operator: '>' | '<' | '=' | '>='
  threshold: number
  severity: 'info' | 'warning' | 'critical'
  message: string
}

// API 响应格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页响应
export interface PaginatedResponse<T> {
  total: number
  page: number
  per_page: number
  items: T[]
}

// 预设通知样式
export const PRESET_NOTIFICATION_STYLES: Omit<NotificationStyle, 'id' | 'created_at'>[] = [
  {
    name: '现代卡片',
    config: {
      background: '#ffffff',
      borderRadius: 12,
      border: { width: 1, style: 'solid', color: '#e5e7eb' },
      shadow: { x: 0, y: 4, blur: 6, spread: -1, color: 'rgba(0, 0, 0, 0.1)' },
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.5,
        color: '#374151',
        textAlign: 'left'
      },
      animation: { type: 'slideInDown', duration: 0.5 },
      effects: {}
    },
    is_system: true
  },
  {
    name: '渐变背景',
    config: {
      background: {
        type: 'linear',
        direction: '135deg',
        colors: [
          { color: '#667eea', stop: 0 },
          { color: '#764ba2', stop: 100 }
        ]
      },
      borderRadius: 16,
      border: { width: 0, style: 'solid', color: 'transparent' },
      shadow: { x: 0, y: 8, blur: 25, spread: -5, color: 'rgba(0, 0, 0, 0.25)' },
      padding: { top: 20, right: 20, bottom: 20, left: 20 },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 1.5,
        color: '#ffffff',
        textAlign: 'center'
      },
      animation: { type: 'scaleIn', duration: 0.6 },
      effects: {}
    },
    is_system: true
  },
  {
    name: '毛玻璃效果',
    config: {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 20,
      border: { width: 1, style: 'solid', color: 'rgba(255, 255, 255, 0.2)' },
      shadow: { x: 0, y: 8, blur: 32, spread: 0, color: 'rgba(31, 38, 135, 0.37)' },
      padding: { top: 24, right: 24, bottom: 24, left: 24 },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.6,
        color: '#1f2937',
        textAlign: 'left'
      },
      animation: { type: 'expandFromCenter', duration: 0.7 },
      effects: { backdrop: 'blur(10px)' }
    },
    is_system: true
  },
  {
    name: '科技风格',
    config: {
      background: '#0a0a0a',
      borderRadius: 8,
      border: { width: 1, style: 'solid', color: '#00ff88' },
      shadow: { x: 0, y: 0, blur: 20, spread: 0, color: 'rgba(0, 255, 136, 0.3)' },
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      typography: {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 13,
        fontWeight: 400,
        lineHeight: 1.4,
        color: '#00ff88',
        textAlign: 'left'
      },
      animation: { type: 'glitchIn', duration: 0.8 },
      effects: { glow: true, neon: '#00ff88' }
    },
    is_system: true
  },
  {
    name: '极简风格',
    config: {
      background: '#f9fafb',
      borderRadius: 4,
      border: { width: 1, style: 'solid', color: '#d1d5db' },
      shadow: { x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(0, 0, 0, 0.05)' },
      padding: { top: 12, right: 16, bottom: 12, left: 16 },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.4,
        color: '#374151',
        textAlign: 'left'
      },
      animation: { type: 'slideInRight', duration: 0.4 },
      effects: {}
    },
    is_system: true
  }
] 