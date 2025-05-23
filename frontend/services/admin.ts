import axios from 'axios'
import type { 
  NotificationTemplate, 
  NotificationStyle, 
  UploadResult, 
  PerformanceMetrics,
  SystemStatus,
  ApiResponse,
  PaginatedResponse
} from '@/types/admin'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

// 创建 axios 实例
const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/api/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
adminApi.interceptors.request.use(
  (config) => {
    // 这里可以添加认证 token
    // const token = localStorage.getItem('admin_token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
adminApi.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// 通知模板管理
export const notificationTemplateApi = {
  // 获取模板列表
  getTemplates: async (params?: {
    page?: number
    per_page?: number
    status?: 'active' | 'inactive'
  }): Promise<ApiResponse<PaginatedResponse<NotificationTemplate>>> => {
    return adminApi.get('/notification-templates', { params })
  },

  // 获取单个模板
  getTemplate: async (id: number): Promise<ApiResponse<NotificationTemplate>> => {
    return adminApi.get(`/notification-templates/${id}`)
  },

  // 创建模板
  createTemplate: async (data: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<NotificationTemplate>> => {
    return adminApi.post('/notification-templates', data)
  },

  // 更新模板
  updateTemplate: async (id: number, data: Partial<NotificationTemplate>): Promise<ApiResponse<NotificationTemplate>> => {
    return adminApi.put(`/notification-templates/${id}`, data)
  },

  // 删除模板
  deleteTemplate: async (id: number): Promise<ApiResponse<void>> => {
    return adminApi.delete(`/notification-templates/${id}`)
  },

  // 预览模板
  previewTemplate: async (data: {
    title: string
    content: string
    style_id: number
  }): Promise<ApiResponse<{ preview_html: string }>> => {
    return adminApi.post('/notification-templates/preview', data)
  },
}

// 通知样式管理
export const notificationStyleApi = {
  // 获取样式列表
  getStyles: async (): Promise<ApiResponse<NotificationStyle[]>> => {
    return adminApi.get('/notification-styles')
  },

  // 获取单个样式
  getStyle: async (id: number): Promise<ApiResponse<NotificationStyle>> => {
    return adminApi.get(`/notification-styles/${id}`)
  },

  // 创建自定义样式
  createStyle: async (data: Omit<NotificationStyle, 'id' | 'created_at'>): Promise<ApiResponse<NotificationStyle>> => {
    return adminApi.post('/notification-styles', data)
  },

  // 更新样式
  updateStyle: async (id: number, data: Partial<NotificationStyle>): Promise<ApiResponse<NotificationStyle>> => {
    return adminApi.put(`/notification-styles/${id}`, data)
  },

  // 删除样式
  deleteStyle: async (id: number): Promise<ApiResponse<void>> => {
    return adminApi.delete(`/notification-styles/${id}`)
  },
}

// 文件上传
export const uploadApi = {
  // 上传文件
  uploadFile: async (file: File, type?: string): Promise<ApiResponse<UploadResult>> => {
    const formData = new FormData()
    formData.append('file', file)
    if (type) {
      formData.append('type', type)
    }

    return adminApi.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // 批量上传文件
  uploadFiles: async (files: File[]): Promise<ApiResponse<UploadResult[]>> => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    return adminApi.post('/upload/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // 删除文件
  deleteFile: async (id: number): Promise<ApiResponse<void>> => {
    return adminApi.delete(`/upload/${id}`)
  },

  // 获取文件列表
  getFiles: async (params?: {
    page?: number
    per_page?: number
    type?: string
  }): Promise<ApiResponse<PaginatedResponse<UploadResult>>> => {
    return adminApi.get('/files', { params })
  },
}

// 性能监控
export const performanceApi = {
  // 获取性能指标
  getMetrics: async (params?: {
    metric_type?: string
    start_time?: string
    end_time?: string
    interval?: string
  }): Promise<ApiResponse<{
    metrics: PerformanceMetrics[]
    summary: {
      avg_cpu: number
      avg_memory: number
      avg_response_time: number
      total_requests: number
      total_errors: number
    }
  }>> => {
    return adminApi.get('/performance/metrics', { params })
  },

  // 获取系统状态
  getStatus: async (): Promise<ApiResponse<SystemStatus>> => {
    return adminApi.get('/performance/status')
  },

  // 获取告警信息
  getAlerts: async (): Promise<ApiResponse<any[]>> => {
    return adminApi.get('/performance/alerts')
  },
}

// Mock 数据 - 用于开发阶段
export const mockData = {
  templates: [
    {
      id: 1,
      name: '系统更新通知',
      title: '系统升级公告',
      content: '<p>系统将于今晚 22:00-24:00 进行升级维护，期间可能影响部分功能使用。</p><p>升级内容包括：</p><ul><li>性能优化</li><li>安全补丁</li><li>新功能上线</li></ul>',
      style_id: 1,
      style_name: '现代卡片',
      media_urls: [],
      links: [{ text: '查看详情', url: 'https://example.com/update' }],
      is_active: true,
      created_at: '2023-08-01T10:00:00.000Z',
      updated_at: '2023-08-01T10:00:00.000Z',
    },
    {
      id: 2,
      name: '促销活动通知',
      title: '限时优惠活动开始啦！',
      content: '<p>🎉 <strong>双十一大促销</strong> 🎉</p><p>全场商品 <span style="color: #ff4444; font-size: 18px;">5折起</span></p><p>活动时间：11月1日-11月11日</p>',
      style_id: 2,
      style_name: '渐变背景',
      media_urls: ['https://example.com/promo-banner.jpg'],
      links: [
        { text: '立即购买', url: 'https://example.com/shop' },
        { text: '查看详情', url: 'https://example.com/promo' }
      ],
      is_active: true,
      created_at: '2023-08-02T14:30:00.000Z',
      updated_at: '2023-08-02T14:30:00.000Z',
    },
    {
      id: 3,
      name: '安全提醒',
      title: '账户安全提醒',
      content: '<p>⚠️ 检测到您的账户在异地登录</p><p>登录时间：2023-08-03 15:30</p><p>登录地点：北京市朝阳区</p><p>如非本人操作，请立即修改密码。</p>',
      style_id: 4,
      style_name: '科技风格',
      media_urls: [],
      links: [{ text: '修改密码', url: 'https://example.com/change-password' }],
      is_active: true,
      created_at: '2023-08-03T15:30:00.000Z',
      updated_at: '2023-08-03T15:30:00.000Z',
    },
  ] as NotificationTemplate[],

  styles: [
    {
      id: 1,
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
          textAlign: 'left' as const
        },
        animation: { type: 'slideInDown' as const, duration: 0.5 },
        effects: {}
      },
      is_system: true,
      created_at: '2023-08-01T00:00:00.000Z',
    },
    {
      id: 2,
      name: '渐变背景',
      config: {
        background: {
          type: 'linear' as const,
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
          textAlign: 'center' as const
        },
        animation: { type: 'scaleIn' as const, duration: 0.6 },
        effects: {}
      },
      is_system: true,
      created_at: '2023-08-01T00:00:00.000Z',
    },
  ] as NotificationStyle[],
} 