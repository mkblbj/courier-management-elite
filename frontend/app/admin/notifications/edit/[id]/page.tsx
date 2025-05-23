'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Eye, Plus, X, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import NotificationPreview from '@/components/admin/NotificationPreview'
import FileUploader from '@/components/admin/FileUploader'
import TinyMCEEditor from '@/components/admin/TinyMCEEditor'
import { mockData } from '@/services/admin'
import type { NotificationTemplate, NotificationStyle, UploadResult } from '@/types/admin'

interface LinkItem {
      id: string
      text: string
      url: string
}

export default function EditNotificationPage() {
      const router = useRouter()
      const params = useParams()
      const { toast } = useToast()
      const templateId = parseInt(params.id as string)

      // 表单状态
      const [formData, setFormData] = useState({
            name: '',
            title: '',
            content: '',
            style_id: 1,
            is_active: true,
      })

      const [styles, setStyles] = useState<NotificationStyle[]>([])
      const [mediaUrls, setMediaUrls] = useState<string[]>([])
      const [links, setLinks] = useState<LinkItem[]>([])
      const [loading, setLoading] = useState(false)
      const [initialLoading, setInitialLoading] = useState(true)
      const [previewMode, setPreviewMode] = useState(false)

      // 加载模板数据
      useEffect(() => {
            const loadTemplate = async () => {
                  try {
                        // 使用 mock 数据
                        const template = mockData.templates.find(t => t.id === templateId)
                        if (!template) {
                              toast({
                                    title: '模板不存在',
                                    description: '找不到指定的通知模板',
                                    variant: 'destructive',
                              })
                              router.push('/admin/notifications')
                              return
                        }

                        setFormData({
                              name: template.name,
                              title: template.title,
                              content: template.content,
                              style_id: template.style_id,
                              is_active: template.is_active,
                        })

                        setMediaUrls(template.media_urls)
                        setLinks(template.links.map((link, index) => ({
                              id: `link-${index}`,
                              text: link.text,
                              url: link.url,
                        })))

                  } catch (error) {
                        console.error('Failed to load template:', error)
                        toast({
                              title: '加载失败',
                              description: '无法加载通知模板',
                              variant: 'destructive',
                        })
                  } finally {
                        setInitialLoading(false)
                  }
            }

            loadTemplate()
      }, [templateId, toast, router])

      // 加载样式列表
      useEffect(() => {
            const loadStyles = async () => {
                  try {
                        // 使用 mock 数据
                        setStyles(mockData.styles)
                  } catch (error) {
                        console.error('Failed to load styles:', error)
                        toast({
                              title: '加载失败',
                              description: '无法加载样式列表',
                              variant: 'destructive',
                        })
                  }
            }

            loadStyles()
      }, [toast])

      // 获取当前选中的样式
      const selectedStyle = styles.find(style => style.id === formData.style_id) || styles[0]

      // 处理表单提交
      const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault()

            if (!formData.name.trim() || !formData.title.trim() || !formData.content.trim()) {
                  toast({
                        title: '表单验证失败',
                        description: '请填写所有必填字段',
                        variant: 'destructive',
                  })
                  return
            }

            setLoading(true)

            try {
                  // 模拟API调用
                  await new Promise(resolve => setTimeout(resolve, 1000))

                  toast({
                        title: '更新成功',
                        description: '通知模板已成功更新',
                  })

                  router.push('/admin/notifications')
            } catch (error) {
                  console.error('Failed to update template:', error)
                  toast({
                        title: '更新失败',
                        description: '无法更新通知模板',
                        variant: 'destructive',
                  })
            } finally {
                  setLoading(false)
            }
      }

      // 处理文件上传
      const handleFileUpload = (files: UploadResult[]) => {
            const newUrls = files.map(file => file.url)
            setMediaUrls(prev => [...prev, ...newUrls])
      }

      // 删除媒体文件
      const removeMediaFile = (url: string) => {
            setMediaUrls(prev => prev.filter(u => u !== url))
      }

      // 添加链接
      const addLink = () => {
            setLinks(prev => [...prev, {
                  id: Math.random().toString(36).substr(2, 9),
                  text: '',
                  url: '',
            }])
      }

      // 更新链接
      const updateLink = (id: string, field: 'text' | 'url', value: string) => {
            setLinks(prev => prev.map(link =>
                  link.id === id ? { ...link, [field]: value } : link
            ))
      }

      // 删除链接
      const removeLink = (id: string) => {
            setLinks(prev => prev.filter(link => link.id !== id))
      }

      if (initialLoading) {
            return (
                  <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                              <div>
                                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
                              </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div className="space-y-6">
                                    {[1, 2, 3].map((i) => (
                                          <Card key={i} className="animate-pulse">
                                                <CardHeader>
                                                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                                                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                                </CardHeader>
                                                <CardContent>
                                                      <div className="space-y-4">
                                                            <div className="h-4 bg-gray-200 rounded"></div>
                                                            <div className="h-10 bg-gray-200 rounded"></div>
                                                      </div>
                                                </CardContent>
                                          </Card>
                                    ))}
                              </div>
                              <Card className="animate-pulse">
                                    <CardHeader>
                                          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                                    </CardHeader>
                                    <CardContent>
                                          <div className="h-64 bg-gray-200 rounded"></div>
                                    </CardContent>
                              </Card>
                        </div>
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
                                    <h1 className="text-3xl font-bold text-gray-900">编辑通知模板</h1>
                                    <p className="text-gray-600 mt-2">修改通知模板的设置和内容</p>
                              </div>
                        </div>

                        <div className="flex items-center space-x-3">
                              <Button
                                    variant="outline"
                                    onClick={() => setPreviewMode(!previewMode)}
                                    className="flex items-center space-x-2"
                              >
                                    <Eye className="h-4 w-4" />
                                    <span>{previewMode ? '编辑模式' : '预览模式'}</span>
                              </Button>

                              <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex items-center space-x-2"
                              >
                                    <Save className="h-4 w-4" />
                                    <span>{loading ? '保存中...' : '保存更改'}</span>
                              </Button>
                        </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 左侧编辑区域 */}
                        <div className="space-y-6">
                              <Card>
                                    <CardHeader>
                                          <CardTitle>基本信息</CardTitle>
                                          <CardDescription>设置模板的基本信息</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                          <div>
                                                <Label htmlFor="name">模板名称 *</Label>
                                                <Input
                                                      id="name"
                                                      value={formData.name}
                                                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                      placeholder="输入模板名称"
                                                      className="mt-1"
                                                />
                                          </div>

                                          <div>
                                                <Label htmlFor="title">通知标题 *</Label>
                                                <Input
                                                      id="title"
                                                      value={formData.title}
                                                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                                      placeholder="输入通知标题"
                                                      className="mt-1"
                                                />
                                          </div>

                                          <div>
                                                <TinyMCEEditor
                                                      label="通知内容 *"
                                                      value={formData.content}
                                                      onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                                      placeholder="输入通知内容，支持富文本格式"
                                                      height={250}
                                                />
                                          </div>

                                          <div className="flex items-center space-x-2">
                                                <Switch
                                                      id="is_active"
                                                      checked={formData.is_active}
                                                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                                                />
                                                <Label htmlFor="is_active">启用模板</Label>
                                          </div>
                                    </CardContent>
                              </Card>

                              {/* 样式选择 */}
                              <Card>
                                    <CardHeader>
                                          <CardTitle>样式设置</CardTitle>
                                          <CardDescription>选择通知的显示样式</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                          <div>
                                                <Label htmlFor="style">通知样式</Label>
                                                <Select
                                                      value={formData.style_id.toString()}
                                                      onValueChange={(value) => setFormData(prev => ({ ...prev, style_id: parseInt(value) }))}
                                                >
                                                      <SelectTrigger className="mt-1">
                                                            <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                            {styles.map((style) => (
                                                                  <SelectItem key={style.id} value={style.id.toString()}>
                                                                        {style.name}
                                                                  </SelectItem>
                                                            ))}
                                                      </SelectContent>
                                                </Select>
                                          </div>
                                    </CardContent>
                              </Card>

                              {/* 媒体文件 */}
                              <Card>
                                    <CardHeader>
                                          <CardTitle>媒体文件</CardTitle>
                                          <CardDescription>上传图片、GIF等媒体文件</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                          <FileUploader
                                                accept={['image/*']}
                                                maxSize={5 * 1024 * 1024} // 5MB
                                                multiple={true}
                                                onUpload={handleFileUpload}
                                                onDelete={(fileId) => {
                                                      console.log('Delete file:', fileId)
                                                }}
                                          />

                                          {/* 已上传的媒体文件列表 */}
                                          {mediaUrls.length > 0 && (
                                                <div className="mt-4">
                                                      <Label>已上传的文件</Label>
                                                      <div className="grid grid-cols-2 gap-2 mt-2">
                                                            {mediaUrls.map((url, index) => (
                                                                  <div key={index} className="relative group">
                                                                        <img
                                                                              src={url}
                                                                              alt={`Media ${index + 1}`}
                                                                              className="w-full h-20 object-cover rounded border"
                                                                        />
                                                                        <Button
                                                                              variant="destructive"
                                                                              size="sm"
                                                                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                              onClick={() => removeMediaFile(url)}
                                                                        >
                                                                              <X className="h-3 w-3" />
                                                                        </Button>
                                                                  </div>
                                                            ))}
                                                      </div>
                                                </div>
                                          )}
                                    </CardContent>
                              </Card>

                              {/* 链接管理 */}
                              <Card>
                                    <CardHeader>
                                          <CardTitle>操作链接</CardTitle>
                                          <CardDescription>添加通知中的操作按钮链接</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                          {links.map((link) => (
                                                <motion.div
                                                      key={link.id}
                                                      initial={{ opacity: 0, y: 20 }}
                                                      animate={{ opacity: 1, y: 0 }}
                                                      exit={{ opacity: 0, y: -20 }}
                                                      className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg"
                                                >
                                                      <div className="flex-1 space-y-2">
                                                            <Input
                                                                  placeholder="链接文本"
                                                                  value={link.text}
                                                                  onChange={(e) => updateLink(link.id, 'text', e.target.value)}
                                                            />
                                                            <Input
                                                                  placeholder="链接地址"
                                                                  value={link.url}
                                                                  onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                                                            />
                                                      </div>
                                                      <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeLink(link.id)}
                                                            className="text-red-600 hover:text-red-700"
                                                      >
                                                            <X className="h-4 w-4" />
                                                      </Button>
                                                </motion.div>
                                          ))}

                                          <Button
                                                variant="outline"
                                                onClick={addLink}
                                                className="w-full flex items-center space-x-2"
                                          >
                                                <Plus className="h-4 w-4" />
                                                <span>添加链接</span>
                                          </Button>
                                    </CardContent>
                              </Card>
                        </div>

                        {/* 右侧预览区域 */}
                        <div className="lg:sticky lg:top-6">
                              <Card>
                                    <CardHeader>
                                          <CardTitle>实时预览</CardTitle>
                                          <CardDescription>查看通知的实际显示效果</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                          {selectedStyle && (
                                                <NotificationPreview
                                                      title={formData.title || '通知标题'}
                                                      content={formData.content || '通知内容'}
                                                      style={selectedStyle}
                                                      mediaUrls={mediaUrls}
                                                      links={links.filter(link => link.text && link.url)}
                                                />
                                          )}
                                    </CardContent>
                              </Card>
                        </div>
                  </div>
            </div>
      )
} 