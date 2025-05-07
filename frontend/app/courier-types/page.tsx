"use client"

import { Suspense, useEffect, useState } from "react"
import { CourierTypeManagement } from "@/components/courier-type-management"
import { PageHeader } from "@/components/page-header"
import { CourierTypesSkeleton } from "@/components/courier-types-skeleton"
import { ApiDebug } from "@/components/api-debug" // 导入调试组件
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileInput, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEnvStore } from "@/lib/env-config"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { useTranslation } from "react-i18next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams, useRouter } from "next/navigation"
import { CategoryManagementTab } from "@/components/shop-category/CategoryManagementTab"
import { ShopManagementTab } from "@/components/shop/ShopManagementTab"

export default function CourierTypesPage() {
  const { debug } = useEnvStore()
  const [isVisible, setIsVisible] = useState(false)
  const { t } = useTranslation(['common', 'courier', 'shop'])
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 获取当前激活的标签
  const activeTab = searchParams.get('tab') || 'courier-types'
  // 获取商店管理子标签
  const shopTab = searchParams.get('shopTab') || 'categories'

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

  // 初始加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardNav />
      
      <main className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
        <PageHeader
          title={t('courier:courier_management')}
          description={t('courier:courier_list')}
          className="max-w-5xl mx-auto"
          action={
            <Link href="/shipping-data">
              <Button className="bg-blue-600 hover:bg-blue-700 transition-all duration-300">
                <FileInput className="mr-2 h-4 w-4" />
                {t('shipping:shipping_management')}
              </Button>
            </Link>
          }
        />
        <div
          className={cn(
            "transition-all duration-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <div className="bg-white shadow rounded-lg p-6 max-w-5xl mx-auto">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-6">
                <TabsTrigger value="courier-types">{t('courier:courier_types')}</TabsTrigger>
                <TabsTrigger value="shop-management">{t('shop:shop_management')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="courier-types">
                <Suspense fallback={<CourierTypesSkeleton />}>
                  <CourierTypeManagement />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="shop-management">
                <Tabs value={shopTab} onValueChange={handleShopTabChange}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="categories">{t('shop:category_list')}</TabsTrigger>
                    <TabsTrigger value="shops">{t('shop:shop_management')}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="categories">
                    <CategoryManagementTab />
                  </TabsContent>
                  
                  <TabsContent value="shops">
                    <ShopManagementTab />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </div>
          {debug && (
            <div className="mt-8 max-w-5xl mx-auto">
              <ApiDebug />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
