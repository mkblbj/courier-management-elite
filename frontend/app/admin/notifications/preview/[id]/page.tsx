'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit, Send, Copy, Download } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import NotificationPreview from '@/components/admin/NotificationPreview'
import { mockData } from '@/services/admin'
import type { NotificationTemplate, NotificationStyle } from '@/types/admin'

export default function PreviewNotificationPage() {
      const router = useRouter()
      const params = useParams()
      const { toast } = useToast()
      const templateId = parseInt(params.id as string)

      const [template, setTemplate] = useState<NotificationTemplate | null>(null)
      const [style, setStyle] = useState<NotificationStyle | null>(null)
      const [loading, setLoading] = useState(true)

      useEffect(() => {
            const loadTemplate = async () => {
                  try {
                        // 使用 mock 数据
                        const foundTemplate = mockData.templates.find(t => t.id === templateId)
                        if (!foundTemplate) {
                              toast({
                                    title: '模板不存在',
                                    description: '找不到指定的通知模板',
                                    variant: 'destructive',
                              })
                              router.push('/admin/notifications')
                              return
                        }

                        const foundStyle = mockData.styles.find(s => s.id === foundTemplate.style_id)
                        if (!foundStyle) {
                              toast({
                                    title: '样式不存在',
                                    description: '找不到对应的样式配置',
                                    variant: 'destructive',
                              })
                              return
                        }

                        setTemplate(foundTemplate)
                        setStyle(foundStyle)
                  } catch (error) {
                        console.error('Failed to load template:', error)
                        toast({
                              title: '加载失败',
                              description: '无法加载通知模板',
                              variant: 'destructive',
                        })
                  } finally {
                        setLoading(false)
                  }
            }

            loadTemplate()
      }, [templateId, toast, router])

      const handleCopyContent = () => {
            if (template) {
                  navigator.clipboard.writeText(template.content)
                  toast({
                        title: '复制成功',
                        description: '模板内容已复制到剪贴板',
                  })
            }
      }

      const handleSendTest = () => {
            toast({
                  title: '测试发送',
                  description: '测试通知已发送到您的邮箱',
            })
      }

      const handleExport = () => {
            if (template) {
                  const data = {
                        template,
                        style,
                        exportTime: new Date().toISOString(),
                  }
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `notification-template-${template.id}.json`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)

                  toast({
                        title: '导出成功',
                        description: '模板配置已导出为JSON文件',
                  })
            }
      }

      const formatDate = (dateString: string) => {
            return new Date(dateString).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
            })
      }

      if (loading) {
            return (
                  <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                              <div>
                                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
                              </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              <div className="lg:col-span-2">
                                    <Card className="animate-pulse">
                                          <CardHeader>
                                                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                                          </CardHeader>
                                          <CardContent>
                                                <div className="h-64 bg-gray-200 rounded"></div>
                                          </CardContent>
                                    </Card>
                              </div>
                              <div>
                                    <Card className="animate-pulse">
                                          <CardHeader>
                                                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                          </CardHeader>
                                          <CardContent>
                                                <div className="space-y-4">
                                                      <div className="h-4 bg-gray-200 rounded"></div>
                                                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                </div>
                                          </CardContent>
                                    </Card>
                              </div>
                        </div>
                  </div>
            )
      }

      if (!template || !style) {
            return (
                  <div className="text-center py-12">
                        <p className="text-gray-500">模板或样式加载失败</p>
                  </div>
            )
      }

      return (
            <div className="space-y-6">
                  {/* 页面头部 */}
                  <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                              <Link href="/admin/notifications">
                                    <Button variant="ghost" size="sm">
                                          <ArrowLeft className="h-4 w-4 mr-2" />
                                          返回
                                    </Button>
                              </Link>
                              <div>
                                    <h1 className="text-3xl font-bold text-gray-900">预览通知模板</h1>
                                    <p className="text-gray-600 mt-2">{template.name}</p>
                              </div>
                        </div>

                        <div className="flex items-center space-x-3">
                              <Button variant="outline" onClick={handleCopyContent}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    复制内容
                              </Button>

                              <Button variant="outline" onClick={handleExport}>
                                    <Download className="h-4 w-4 mr-2" />
                                    导出配置
                              </Button>

                              <Button variant="outline" onClick={handleSendTest}>
                                    <Send className="h-4 w-4 mr-2" />
                                    测试发送
                              </Button>

                              <Link href={`/admin/notifications/edit/${template.id}`}>
                                    <Button>
                                          <Edit className="h-4 w-4 mr-2" />
                                          编辑模板
                                    </Button>
                              </Link>
                        </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* 左侧预览区域 */}
                        <div className="lg:col-span-2">
                              <Card>
                                    <CardHeader>
                                          <CardTitle>通知预览</CardTitle>
                                          <CardDescription>查看通知在不同设备上的显示效果</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                          <NotificationPreview
                                                title={template.title}
                                                content={template.content}
                                                style={style}
                                                mediaUrls={template.media_urls}
                                                links={template.links}
                                          />
                                    </CardContent>
                              </Card>
                        </div>

                        {/* 右侧信息面板 */}
                        <div className="space-y-6">
                              {/* 基本信息 */}
                              <Card>
                                    <CardHeader>
                                          <CardTitle>基本信息</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                          <div>
                                                <label className="text-sm font-medium text-gray-600">模板名称</label>
                                                <p className="text-gray-900 mt-1">{template.name}</p>
                                          </div>

                                          <div>
                                                <label className="text-sm font-medium text-gray-600">通知标题</label>
                                                <p className="text-gray-900 mt-1">{template.title}</p>
                                          </div>

                                          <div>
                                                <label className="text-sm font-medium text-gray-600">状态</label>
                                                <div className="mt-1">
                                                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                                                            {template.is_active ? '已启用' : '已禁用'}
                                                      </Badge>
                                                </div>
                                          </div>

                                          <div>
                                                <label className="text-sm font-medium text-gray-600">样式</label>
                                                <p className="text-gray-900 mt-1">{style.name}</p>
                                          </div>

                                          <div>
                                                <label className="text-sm font-medium text-gray-600">创建时间</label>
                                                <p className="text-gray-900 mt-1">{formatDate(template.created_at)}</p>
                                          </div>

                                          <div>
                                                <label className="text-sm font-medium text-gray-600">更新时间</label>
                                                <p className="text-gray-900 mt-1">{formatDate(template.updated_at)}</p>
                                          </div>
                                    </CardContent>
                              </Card>

                              {/* 媒体文件 */}
                              {template.media_urls.length > 0 && (
                                    <Card>
                                          <CardHeader>
                                                <CardTitle>媒体文件</CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                                <div className="grid grid-cols-2 gap-2">
                                                      {template.media_urls.map((url, index) => (
                                                            <img
                                                                  key={index}
                                                                  src={url}
                                                                  alt={`Media ${index + 1}`}
                                                                  className="w-full h-20 object-cover rounded border"
                                                            />
                                                      ))}
                                                </div>
                                          </CardContent>
                                    </Card>
                              )}

                              {/* 操作链接 */}
                              {template.links.length > 0 && (
                                    <Card>
                                          <CardHeader>
                                                <CardTitle>操作链接</CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                                <div className="space-y-2">
                                                      {template.links.map((link, index) => (
                                                            <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                                                                  <span className="text-sm font-medium">{link.text}</span>
                                                                  <a
                                                                        href={link.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs text-blue-600 hover:text-blue-800 truncate max-w-32"
                                                                  >
                                                                        {link.url}
                                                                  </a>
                                                            </div>
                                                      ))}
                                                </div>
                                          </CardContent>
                                    </Card>
                              )}

                              {/* 原始内容 */}
                              <Card>
                                    <CardHeader>
                                          <CardTitle>原始内容</CardTitle>
                                          <CardDescription>HTML源代码</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto max-h-40">
                                                <code>{template.content}</code>
                                          </pre>
                                    </CardContent>
                              </Card>
                        </div>
                  </div>
            </div>
      )
} 