'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
      Plus,
      Search,
      Filter,
      Eye,
      Edit,
      Trash2,
      MoreHorizontal,
      Bell,
      Calendar,
      User
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuSeparator,
      DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
} from '@/components/ui/select'
import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { mockData } from '@/services/admin'
import type { NotificationTemplate } from '@/types/admin'

export default function NotificationsPage() {
      const [templates, setTemplates] = useState<NotificationTemplate[]>([])
      const [loading, setLoading] = useState(true)
      const [searchQuery, setSearchQuery] = useState('')
      const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
      const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
      const [templateToDelete, setTemplateToDelete] = useState<NotificationTemplate | null>(null)
      const { toast } = useToast()

      // 模拟加载数据
      useEffect(() => {
            const loadTemplates = async () => {
                  try {
                        // 使用 mock 数据
                        await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟加载时间
                        setTemplates(mockData.templates)
                  } catch (error) {
                        console.error('Failed to load templates:', error)
                        toast({
                              title: '加载失败',
                              description: '无法加载通知模板列表',
                              variant: 'destructive',
                        })
                  } finally {
                        setLoading(false)
                  }
            }

            loadTemplates()
      }, [toast])

      // 筛选模板
      const filteredTemplates = templates.filter(template => {
            const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  template.title.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === 'all' ||
                  (statusFilter === 'active' && template.is_active) ||
                  (statusFilter === 'inactive' && !template.is_active)

            return matchesSearch && matchesStatus
      })

      // 切换模板状态
      const toggleTemplateStatus = async (templateId: number) => {
            try {
                  setTemplates(prev => prev.map(template =>
                        template.id === templateId
                              ? { ...template, is_active: !template.is_active }
                              : template
                  ))

                  toast({
                        title: '状态已更新',
                        description: '模板状态已成功更新',
                  })
            } catch (error) {
                  console.error('Failed to toggle template status:', error)
                  toast({
                        title: '更新失败',
                        description: '无法更新模板状态',
                        variant: 'destructive',
                  })
            }
      }

      // 删除模板
      const deleteTemplate = async () => {
            if (!templateToDelete) return

            try {
                  setTemplates(prev => prev.filter(template => template.id !== templateToDelete.id))

                  toast({
                        title: '删除成功',
                        description: '模板已成功删除',
                  })
            } catch (error) {
                  console.error('Failed to delete template:', error)
                  toast({
                        title: '删除失败',
                        description: '无法删除模板',
                        variant: 'destructive',
                  })
            } finally {
                  setDeleteDialogOpen(false)
                  setTemplateToDelete(null)
            }
      }

      const formatDate = (dateString: string) => {
            return new Date(dateString).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
            })
      }

      if (loading) {
            return (
                  <div className="space-y-6">
                        <div className="flex items-center justify-between">
                              <div>
                                    <h1 className="text-3xl font-bold text-gray-900">通知管理</h1>
                                    <p className="text-gray-600 mt-2">管理系统通知模板</p>
                              </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <Card key={i} className="animate-pulse">
                                          <CardHeader>
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                          </CardHeader>
                                          <CardContent>
                                                <div className="space-y-2">
                                                      <div className="h-3 bg-gray-200 rounded"></div>
                                                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                                                </div>
                                          </CardContent>
                                    </Card>
                              ))}
                        </div>
                  </div>
            )
      }

      return (
            <div className="space-y-6">
                  {/* 页面头部 */}
                  <div className="flex items-center justify-between">
                        <div>
                              <h1 className="text-3xl font-bold text-gray-900">通知管理</h1>
                              <p className="text-gray-600 mt-2">管理系统通知模板</p>
                        </div>

                        <Link href="/admin/notifications/create">
                              <Button className="flex items-center space-x-2">
                                    <Plus className="h-4 w-4" />
                                    <span>新建模板</span>
                              </Button>
                        </Link>
                  </div>

                  {/* 搜索和筛选 */}
                  <Card>
                        <CardContent className="p-6">
                              <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                          <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                      placeholder="搜索模板名称或标题..."
                                                      value={searchQuery}
                                                      onChange={(e) => setSearchQuery(e.target.value)}
                                                      className="pl-10"
                                                />
                                          </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                                                <SelectTrigger className="w-32">
                                                      <Filter className="h-4 w-4 mr-2" />
                                                      <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                      <SelectItem value="all">全部状态</SelectItem>
                                                      <SelectItem value="active">已启用</SelectItem>
                                                      <SelectItem value="inactive">已禁用</SelectItem>
                                                </SelectContent>
                                          </Select>

                                          <div className="text-sm text-gray-600">
                                                共 {filteredTemplates.length} 个模板
                                          </div>
                                    </div>
                              </div>
                        </CardContent>
                  </Card>

                  {/* 模板列表 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map((template, index) => (
                              <motion.div
                                    key={template.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                              >
                                    <Card className="group">
                                          <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                      <div className="flex-1">
                                                            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                  {template.name}
                                                            </CardTitle>
                                                            <CardDescription className="mt-1">
                                                                  {template.title}
                                                            </CardDescription>
                                                      </div>

                                                      <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                  </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                  <DropdownMenuItem asChild>
                                                                        <Link href={`/admin/notifications/preview/${template.id}`}>
                                                                              <Eye className="h-4 w-4 mr-2" />
                                                                              预览
                                                                        </Link>
                                                                  </DropdownMenuItem>
                                                                  <DropdownMenuItem asChild>
                                                                        <Link href={`/admin/notifications/edit/${template.id}`}>
                                                                              <Edit className="h-4 w-4 mr-2" />
                                                                              编辑
                                                                        </Link>
                                                                  </DropdownMenuItem>
                                                                  <DropdownMenuSeparator />
                                                                  <DropdownMenuItem
                                                                        className="text-red-600"
                                                                        onClick={() => {
                                                                              setTemplateToDelete(template)
                                                                              setDeleteDialogOpen(true)
                                                                        }}
                                                                  >
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        删除
                                                                  </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                      </DropdownMenu>
                                                </div>
                                          </CardHeader>

                                          <CardContent className="space-y-4">
                                                {/* 模板内容预览 */}
                                                <div
                                                      className="text-sm text-gray-600 line-clamp-3"
                                                      dangerouslySetInnerHTML={{
                                                            __html: template.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
                                                      }}
                                                />

                                                {/* 样式和媒体信息 */}
                                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                      <Badge variant="outline" className="text-xs">
                                                            {template.style_name || '默认样式'}
                                                      </Badge>

                                                      {template.media_urls.length > 0 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                  {template.media_urls.length} 个媒体文件
                                                            </Badge>
                                                      )}

                                                      {template.links.length > 0 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                  {template.links.length} 个链接
                                                            </Badge>
                                                      )}
                                                </div>

                                                {/* 状态和时间 */}
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                      <div className="flex items-center space-x-2">
                                                            <Switch
                                                                  checked={template.is_active}
                                                                  onCheckedChange={() => toggleTemplateStatus(template.id)}
                                                            />
                                                            <span className="text-xs text-gray-600">
                                                                  {template.is_active ? '已启用' : '已禁用'}
                                                            </span>
                                                      </div>

                                                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{formatDate(template.updated_at)}</span>
                                                      </div>
                                                </div>
                                          </CardContent>
                                    </Card>
                              </motion.div>
                        ))}
                  </div>

                  {/* 空状态 */}
                  {filteredTemplates.length === 0 && (
                        <Card className="p-12 text-center">
                              <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {searchQuery || statusFilter !== 'all' ? '没有找到匹配的模板' : '还没有通知模板'}
                              </h3>
                              <p className="text-gray-600 mb-6">
                                    {searchQuery || statusFilter !== 'all'
                                          ? '尝试调整搜索条件或筛选器'
                                          : '创建您的第一个通知模板来开始使用'
                                    }
                              </p>
                              {!searchQuery && statusFilter === 'all' && (
                                    <Link href="/admin/notifications/create">
                                          <Button>
                                                <Plus className="h-4 w-4 mr-2" />
                                                创建模板
                                          </Button>
                                    </Link>
                              )}
                        </Card>
                  )}

                  {/* 删除确认对话框 */}
                  <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent>
                              <AlertDialogHeader>
                                    <AlertDialogTitle>确认删除</AlertDialogTitle>
                                    <AlertDialogDescription>
                                          您确定要删除模板 "{templateToDelete?.name}" 吗？此操作无法撤销。
                                    </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction onClick={deleteTemplate} className="bg-red-600 hover:bg-red-700">
                                          删除
                                    </AlertDialogAction>
                              </AlertDialogFooter>
                        </AlertDialogContent>
                  </AlertDialog>
            </div>
      )
} 