"use client"

import { Suspense, useEffect, useState } from "react"
import { CourierTypeManagement } from "@/components/courier-type-management"
import { PageHeader } from "@/components/page-header"
import { CourierTypesSkeleton } from "@/components/courier-types-skeleton"
import { ApiDebug } from "@/components/api-debug"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileInput, Plus, Box, Store, Package, TagIcon, ShoppingBag, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEnvStore } from "@/lib/env-config"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { useTranslation } from "react-i18next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams, useRouter } from "next/navigation"
import { CategoryManagementTab } from "@/components/shop-category/CategoryManagementTab"
import { ShopManagementTab } from "@/components/shop/ShopManagementTab"
import { CourierCategoryManagementTab } from "@/components/courier-category/CourierCategoryManagementTab"

// 创建一个包装组件来使用 useSearchParams
function CourierTypesContent() {
  const { debug } = useEnvStore()
  const [isVisible, setIsVisible] = useState(false)
  const { t } = useTranslation(['common', 'courier', 'shop'])
  const router = useRouter()
  const searchParams = useSearchParams()

  // 获取当前激活的标签
  const activeTab = searchParams.get('tab') || 'courier-management'
  // 获取商店管理子标签
  const shopTab = searchParams.get('shopTab') || 'categories'
  // 获取快递管理子标签
  const courierTab = searchParams.get('courierTab') || 'types'

  // 切换标签时更新URL参数
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`?${params.toString()}`)
  }

  // 切换商店管理子标签
  const handleShopTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('shopTab', value)
    router.push(`?${params.toString()}`)
  }

  // 切换快递管理子标签
  const handleCourierTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('courierTab', value)
    router.push(`?${params.toString()}`)
  }

  // 初始加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={cn(
        "transition-all duration-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      )}
    >
      <div className="bg-background dark:bg-background shadow rounded-lg p-6 max-w-5xl mx-auto">
        {/* 主要管理区域选择卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 快递管理卡片 */}
          <div
            className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${activeTab === 'courier-management'
              ? 'border-primary bg-primary/10 dark:bg-primary/5'
              : 'border-border hover:border-primary/40'
              }`}
            onClick={() => handleTabChange('courier-management')}
          >
            <div className="flex items-center gap-3 mb-2">
              <Package className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-medium">{t('courier:courier_management')}</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              {t('courier:manage_courier_services_and_categories')}
            </p>
          </div>

          {/* 商店管理卡片 */}
          <div
            className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${activeTab === 'shop-management'
              ? 'border-primary bg-primary/10 dark:bg-primary/5'
              : 'border-border hover:border-primary/40'
              }`}
            onClick={() => handleTabChange('shop-management')}
          >
            <div className="flex items-center gap-3 mb-2">
              <Store className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-medium">{t('shop:shop_management')}</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              {t('shop:manage_shops_and_categories')}
            </p>
          </div>
        </div>

        {/* 快递管理内容 */}
        {activeTab === 'courier-management' && (
          <div className="space-y-6 mt-4">
            <div className="flex border-b">
              <button
                onClick={() => handleCourierTabChange('types')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all relative ${courierTab === 'types'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Box className="h-4 w-4" />
                {t('courier:courier_types')}
                {courierTab === 'types' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
                )}
              </button>

              <button
                onClick={() => handleCourierTabChange('categories')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all relative ${courierTab === 'categories'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <TagIcon className="h-4 w-4" />
                {t('courier:category_list')}
                {courierTab === 'categories' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
                )}
              </button>
            </div>

            <div className="bg-card rounded-lg border p-4">
              {courierTab === 'types' ? (
                <Suspense fallback={<CourierTypesSkeleton />}>
                  <CourierTypeManagement />
                </Suspense>
              ) : (
                <CourierCategoryManagementTab />
              )}
            </div>
          </div>
        )}

        {/* 商店管理内容 */}
        {activeTab === 'shop-management' && (
          <div className="space-y-6 mt-4">
            <div className="flex border-b">
              <button
                onClick={() => handleShopTabChange('categories')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all relative ${shopTab === 'categories'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <LayoutGrid className="h-4 w-4" />
                {t('shop:category_list')}
                {shopTab === 'categories' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
                )}
              </button>

              <button
                onClick={() => handleShopTabChange('shops')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all relative ${shopTab === 'shops'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <ShoppingBag className="h-4 w-4" />
                {t('shop:shop_management')}
                {shopTab === 'shops' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
                )}
              </button>
            </div>

            <div className="bg-card rounded-lg border p-4">
              {shopTab === 'categories' ? (
                <CategoryManagementTab />
              ) : (
                <ShopManagementTab />
              )}
            </div>
          </div>
        )}
      </div>
      {debug && (
        <div className="mt-8 max-w-5xl mx-auto">
          <ApiDebug />
        </div>
      )}
    </div>
  )
}

export default function CourierTypesPage() {
  const { debug } = useEnvStore()
  const { t } = useTranslation(['common', 'courier', 'shop'])

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <DashboardNav />

      <main className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
        <Suspense fallback={<CourierTypesSkeleton />}>
          <CourierTypesContent />
        </Suspense>
      </main>
    </div>
  )
}
