'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
      LayoutDashboard,
      Bell,
      Activity,
      Settings,
      Menu,
      X,
      User,
      LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuSeparator,
      DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navigation = [
      {
            name: '仪表盘',
            href: '/admin',
            icon: LayoutDashboard,
      },
      {
            name: '通知管理',
            href: '/admin/notifications',
            icon: Bell,
      },
      {
            name: '性能监控',
            href: '/admin/performance',
            icon: Activity,
      },
      {
            name: '系统设置',
            href: '/admin/settings',
            icon: Settings,
      },
]

export default function AdminLayout({
      children,
}: {
      children: React.ReactNode
}) {
      const [sidebarOpen, setSidebarOpen] = useState(false)
      const pathname = usePathname()

      return (
            <div className="min-h-screen bg-gray-50">
                  {/* 侧边栏 */}
                  <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-gray-900">
                        <div className="flex h-full flex-col">
                              {/* Logo 区域 */}
                              <div className="flex h-16 items-center justify-between px-6">
                                    <div className="flex items-center space-x-3">
                                          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                                <LayoutDashboard className="h-5 w-5 text-white" />
                                          </div>
                                          <span className="text-white font-semibold">后台管理系统</span>
                                    </div>
                              </div>

                              {/* 导航菜单 */}
                              <nav className="flex-1 px-4 py-6 space-y-2">
                                    {navigation.map((item) => {
                                          const isActive = pathname === item.href ||
                                                (item.href !== '/admin' && pathname.startsWith(item.href))

                                          return (
                                                <Link
                                                      key={item.name}
                                                      href={item.href}
                                                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                                            ? 'bg-blue-600 text-white'
                                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                                            }`}
                                                >
                                                      <item.icon className="h-5 w-5" />
                                                      <span>{item.name}</span>
                                                </Link>
                                          )
                                    })}
                              </nav>
                        </div>
                  </div>

                  {/* 移动端侧边栏 */}
                  <AnimatePresence>
                        {sidebarOpen && (
                              <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                                    onClick={() => setSidebarOpen(false)}
                              />
                        )}
                  </AnimatePresence>

                  <motion.div
                        initial={false}
                        animate={{
                              x: sidebarOpen ? 0 : '-100%',
                        }}
                        className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 lg:hidden"
                  >
                        <div className="flex h-full flex-col">
                              {/* Logo 区域 */}
                              <div className="flex h-16 items-center justify-between px-6">
                                    <div className="flex items-center space-x-3">
                                          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                                <LayoutDashboard className="h-5 w-5 text-white" />
                                          </div>
                                          <span className="text-white font-semibold">后台管理系统</span>
                                    </div>
                                    <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-white hover:bg-gray-800"
                                          onClick={() => setSidebarOpen(false)}
                                    >
                                          <X className="h-5 w-5" />
                                    </Button>
                              </div>

                              {/* 导航菜单 */}
                              <nav className="flex-1 px-4 py-6 space-y-2">
                                    {navigation.map((item) => {
                                          const isActive = pathname === item.href ||
                                                (item.href !== '/admin' && pathname.startsWith(item.href))

                                          return (
                                                <Link
                                                      key={item.name}
                                                      href={item.href}
                                                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                                            ? 'bg-blue-600 text-white'
                                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                                            }`}
                                                      onClick={() => setSidebarOpen(false)}
                                                >
                                                      <item.icon className="h-5 w-5" />
                                                      <span>{item.name}</span>
                                                </Link>
                                          )
                                    })}
                              </nav>
                        </div>
                  </motion.div>

                  {/* 主内容区域 */}
                  <div className="lg:pl-64">
                        {/* 顶部导航栏 */}
                        <header className="bg-white shadow-sm border-b">
                              <div className="flex h-16 items-center justify-between px-6">
                                    <div className="flex items-center space-x-4">
                                          <Button
                                                variant="ghost"
                                                size="sm"
                                                className="lg:hidden"
                                                onClick={() => setSidebarOpen(true)}
                                          >
                                                <Menu className="h-5 w-5" />
                                          </Button>

                                          {/* 面包屑导航 */}
                                          <nav className="flex items-center space-x-2 text-sm text-gray-600">
                                                <Link href="/admin" className="hover:text-gray-900">
                                                      后台管理
                                                </Link>
                                                {pathname !== '/admin' && (
                                                      <>
                                                            <span>/</span>
                                                            <span className="text-gray-900">
                                                                  {navigation.find(item =>
                                                                        pathname === item.href ||
                                                                        (item.href !== '/admin' && pathname.startsWith(item.href))
                                                                  )?.name}
                                                            </span>
                                                      </>
                                                )}
                                          </nav>
                                    </div>

                                    {/* 用户菜单 */}
                                    <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                                      <Avatar className="h-8 w-8">
                                                            <AvatarFallback>管</AvatarFallback>
                                                      </Avatar>
                                                </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent className="w-56" align="end" forceMount>
                                                <DropdownMenuItem>
                                                      <User className="mr-2 h-4 w-4" />
                                                      <span>个人资料</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>
                                                      <LogOut className="mr-2 h-4 w-4" />
                                                      <span>退出登录</span>
                                                </DropdownMenuItem>
                                          </DropdownMenuContent>
                                    </DropdownMenu>
                              </div>
                        </header>

                        {/* 页面内容 */}
                        <main className="p-6">
                              {children}
                        </main>
                  </div>
            </div>
      )
} 