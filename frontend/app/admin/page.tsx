'use client'

import { motion } from 'framer-motion'
import {
      Bell,
      Activity,
      Users,
      TrendingUp,
      AlertTriangle,
      CheckCircle,
      Clock,
      BarChart3
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const stats = [
      {
            title: '通知模板',
            value: '12',
            change: '+2',
            changeType: 'positive' as const,
            icon: Bell,
            description: '本月新增 2 个模板',
      },
      {
            title: '系统状态',
            value: '正常',
            change: '99.9%',
            changeType: 'positive' as const,
            icon: Activity,
            description: '系统运行时间',
      },
      {
            title: '活跃用户',
            value: '1,234',
            change: '+12%',
            changeType: 'positive' as const,
            icon: Users,
            description: '相比上月增长',
      },
      {
            title: '性能指标',
            value: '优秀',
            change: '120ms',
            changeType: 'neutral' as const,
            icon: TrendingUp,
            description: '平均响应时间',
      },
]

const recentActivities = [
      {
            id: 1,
            type: 'notification',
            title: '创建了新的通知模板',
            description: '系统更新通知模板已创建',
            time: '2 分钟前',
            status: 'success',
      },
      {
            id: 2,
            type: 'performance',
            title: '性能监控告警',
            description: 'CPU 使用率超过 80%',
            time: '15 分钟前',
            status: 'warning',
      },
      {
            id: 3,
            type: 'system',
            title: '系统备份完成',
            description: '数据库备份已成功完成',
            time: '1 小时前',
            status: 'success',
      },
      {
            id: 4,
            type: 'notification',
            title: '通知发送完成',
            description: '向 500 用户发送系统通知',
            time: '2 小时前',
            status: 'success',
      },
]

const getStatusIcon = (status: string) => {
      switch (status) {
            case 'success':
                  return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'warning':
                  return <AlertTriangle className="h-4 w-4 text-yellow-500" />
            case 'error':
                  return <AlertTriangle className="h-4 w-4 text-red-500" />
            default:
                  return <Clock className="h-4 w-4 text-gray-500" />
      }
}

const getStatusBadge = (status: string) => {
      switch (status) {
            case 'success':
                  return <Badge variant="secondary" className="bg-green-100 text-green-800">成功</Badge>
            case 'warning':
                  return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">警告</Badge>
            case 'error':
                  return <Badge variant="secondary" className="bg-red-100 text-red-800">错误</Badge>
            default:
                  return <Badge variant="secondary">处理中</Badge>
      }
}

export default function AdminDashboard() {
      return (
            <div className="space-y-6">
                  {/* 页面标题 */}
                  <div>
                        <h1 className="text-3xl font-bold text-gray-900">仪表盘</h1>
                        <p className="text-gray-600 mt-2">欢迎回到后台管理系统</p>
                  </div>

                  {/* 统计卡片 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                              <motion.div
                                    key={stat.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                              >
                                    <Card>
                                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium text-gray-600">
                                                      {stat.title}
                                                </CardTitle>
                                                <stat.icon className="h-4 w-4 text-gray-400" />
                                          </CardHeader>
                                          <CardContent>
                                                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                                <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
                                                      <span
                                                            className={`font-medium ${stat.changeType === 'positive'
                                                                        ? 'text-green-600'
                                                                        : stat.changeType === 'negative'
                                                                              ? 'text-red-600'
                                                                              : 'text-gray-600'
                                                                  }`}
                                                      >
                                                            {stat.change}
                                                      </span>
                                                      <span>{stat.description}</span>
                                                </div>
                                          </CardContent>
                                    </Card>
                              </motion.div>
                        ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 最近活动 */}
                        <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 }}
                        >
                              <Card>
                                    <CardHeader>
                                          <CardTitle className="flex items-center space-x-2">
                                                <Clock className="h-5 w-5" />
                                                <span>最近活动</span>
                                          </CardTitle>
                                          <CardDescription>系统最近的操作记录</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                          <div className="space-y-4">
                                                {recentActivities.map((activity) => (
                                                      <div key={activity.id} className="flex items-start space-x-3">
                                                            <div className="flex-shrink-0 mt-1">
                                                                  {getStatusIcon(activity.status)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                  <div className="flex items-center justify-between">
                                                                        <p className="text-sm font-medium text-gray-900">
                                                                              {activity.title}
                                                                        </p>
                                                                        {getStatusBadge(activity.status)}
                                                                  </div>
                                                                  <p className="text-sm text-gray-600 mt-1">
                                                                        {activity.description}
                                                                  </p>
                                                                  <p className="text-xs text-gray-400 mt-1">
                                                                        {activity.time}
                                                                  </p>
                                                            </div>
                                                      </div>
                                                ))}
                                          </div>
                                    </CardContent>
                              </Card>
                        </motion.div>

                        {/* 快速操作 */}
                        <motion.div
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 }}
                        >
                              <Card>
                                    <CardHeader>
                                          <CardTitle className="flex items-center space-x-2">
                                                <BarChart3 className="h-5 w-5" />
                                                <span>快速操作</span>
                                          </CardTitle>
                                          <CardDescription>常用功能快速入口</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                          <div className="grid grid-cols-2 gap-4">
                                                <motion.a
                                                      href="/admin/notifications"
                                                      className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                      whileHover={{ scale: 1.02 }}
                                                      whileTap={{ scale: 0.98 }}
                                                >
                                                      <Bell className="h-8 w-8 text-blue-600 mb-2" />
                                                      <span className="text-sm font-medium text-gray-900">通知管理</span>
                                                      <span className="text-xs text-gray-600 text-center mt-1">
                                                            创建和管理通知模板
                                                      </span>
                                                </motion.a>

                                                <motion.a
                                                      href="/admin/performance"
                                                      className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                      whileHover={{ scale: 1.02 }}
                                                      whileTap={{ scale: 0.98 }}
                                                >
                                                      <Activity className="h-8 w-8 text-green-600 mb-2" />
                                                      <span className="text-sm font-medium text-gray-900">性能监控</span>
                                                      <span className="text-xs text-gray-600 text-center mt-1">
                                                            查看系统性能指标
                                                      </span>
                                                </motion.a>

                                                <motion.div
                                                      className="flex flex-col items-center p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60"
                                                      whileHover={{ scale: 1.02 }}
                                                >
                                                      <Users className="h-8 w-8 text-gray-400 mb-2" />
                                                      <span className="text-sm font-medium text-gray-600">用户管理</span>
                                                      <span className="text-xs text-gray-500 text-center mt-1">
                                                            即将推出
                                                      </span>
                                                </motion.div>

                                                <motion.div
                                                      className="flex flex-col items-center p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60"
                                                      whileHover={{ scale: 1.02 }}
                                                >
                                                      <TrendingUp className="h-8 w-8 text-gray-400 mb-2" />
                                                      <span className="text-sm font-medium text-gray-600">数据分析</span>
                                                      <span className="text-xs text-gray-500 text-center mt-1">
                                                            即将推出
                                                      </span>
                                                </motion.div>
                                          </div>
                                    </CardContent>
                              </Card>
                        </motion.div>
                  </div>
            </div>
      )
} 