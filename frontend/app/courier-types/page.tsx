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
import ShopList from "@/components/shop/ShopList"
import ShopForm from "@/components/shop/ShopForm"
import ShopSortModal from "@/components/shop/ShopSortModal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Shop, ShopFormData, ShopSortItem } from "@/lib/types/shop"
import { getShops, createShop, updateShop, deleteShop, toggleShopStatus, updateShopSort } from "@/lib/api/shop"
import { useSearchParams, useRouter } from "next/navigation"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import EditShopDialog from "@/components/shop/EditShopDialog"

export default function CourierTypesPage() {
  const { debug } = useEnvStore()
  const [isVisible, setIsVisible] = useState(false)
  const { t } = useTranslation(['common', 'courier', 'shop'])
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // 状态管理
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [shopFormOpen, setShopFormOpen] = useState(false)
  const [sortModalOpen, setSortModalOpen] = useState(false)
  const [currentShop, setCurrentShop] = useState<Shop | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [shopToDelete, setShopToDelete] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // 获取当前激活的标签
  const activeTab = searchParams.get('tab') || 'courier-types'

  // 切换标签时更新URL参数
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`?${params.toString()}`)
  }

  // 加载店铺数据
  const loadShops = async () => {
    try {
      setLoading(true)
      const response = await getShops({ search: searchTerm });
      
      // 确保response.data是一个数组
      if (response.code === 0 && Array.isArray(response.data)) {
        setShops(response.data);
      } else {
        setShops([]);
        console.error("API返回的数据不是预期的数组格式:", response);
        if (response.code !== 0) {
          toast({
            title: t('common:error'),
            description: response.message || t('shop:error_loading_shops'),
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error loading shops:", error)
      setShops([]);
      toast({
        title: t('common:error'),
        description: t('shop:error_loading_shops'),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // 加载店铺数据
  useEffect(() => {
    if (activeTab === 'shops') {
      loadShops()
    }
  }, [activeTab, searchTerm])

  // 打开添加店铺表单
  const handleAddShop = () => {
    setCurrentShop(undefined)
    setShopFormOpen(true)
  }

  // 打开编辑店铺表单
  const handleEditShop = (shop: Shop) => {
    setCurrentShop(shop)
    setShopFormOpen(true)
  }

  // 打开删除确认对话框
  const handleDeleteClick = (id: number) => {
    setShopToDelete(id)
    setDeleteDialogOpen(true)
  }

  // 执行删除操作
  const handleDeleteConfirm = async () => {
    if (!shopToDelete) return

    try {
      setIsSubmitting(true)
      await deleteShop(shopToDelete)
      toast({
        title: t('shop:shop_deleted'),
        description: t('shop:shop_deleted_success'),
      })
      loadShops()
    } catch (error) {
      console.error("Error deleting shop:", error)
      toast({
        title: t('common:error'),
        description: t('shop:error_deleting_shop'),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setDeleteDialogOpen(false)
      setShopToDelete(null)
    }
  }

  // 切换店铺状态
  const handleToggleActive = async (id: number, active: boolean) => {
    try {
      await toggleShopStatus(id)
      // 更新本地状态
      setShops(shops.map(shop => 
        shop.id === id ? { ...shop, is_active: active ? 1 : 0 } : shop
      ))
      toast({
        title: t('shop:status_updated'),
        description: active 
          ? t('shop:shop_activated') 
          : t('shop:shop_deactivated'),
      })
    } catch (error) {
      console.error("Error toggling shop status:", error)
      toast({
        title: t('common:error'),
        description: t('shop:error_updating_status'),
        variant: "destructive",
      })
    }
  }

  // 提交店铺表单
  const handleShopFormSubmit = async (data: ShopFormData) => {
    try {
      setIsSubmitting(true)
      if (currentShop) {
        // 更新店铺
        await updateShop(currentShop.id, data)
        toast({
          title: t('shop:shop_updated'),
          description: t('shop:shop_updated_success'),
        })
      } else {
        // 创建店铺
        await createShop(data)
        toast({
          title: t('shop:shop_created'),
          description: t('shop:shop_created_success'),
        })
      }
      setShopFormOpen(false)
      loadShops()
    } catch (error) {
      console.error("Error submitting shop form:", error)
      toast({
        title: t('common:error'),
        description: currentShop 
          ? t('shop:error_updating_shop') 
          : t('shop:error_creating_shop'),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理排序
  const handleSort = async (items: ShopSortItem[]) => {
    try {
      setIsSubmitting(true)
      await updateShopSort(items)
      toast({
        title: t('shop:sort_updated'),
        description: t('shop:sort_updated_success'),
      })
      setSortModalOpen(false)
      loadShops()
    } catch (error) {
      console.error("Error updating sort order:", error)
      toast({
        title: t('common:error'),
        description: t('shop:error_updating_sort'),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6">
              <TabsTrigger value="courier-types">{t('courier:courier_types')}</TabsTrigger>
              <TabsTrigger value="shops">{t('shop:shop_management')}</TabsTrigger>
            </TabsList>

            <TabsContent value="courier-types">
              <Suspense fallback={<CourierTypesSkeleton />}>
                <CourierTypeManagement />
              </Suspense>
            </TabsContent>

            <TabsContent value="shops">
              <ShopList 
                shops={shops} 
                loading={loading}
                onToggleActive={handleToggleActive}
                onEdit={handleEditShop}
                onDelete={handleDeleteClick}
                onSearch={setSearchTerm}
                searchTerm={searchTerm}
                onSort={() => setSortModalOpen(true)}
                onRefresh={loadShops}
              />
            </TabsContent>
          </Tabs>
        </div>
        {/* 添加API调试组件 - 只在开发模式下显示 */}
        {debug && process.env.NODE_ENV !== "production" && (
          <div
            className={cn(
              "transition-all duration-500 delay-300",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <ApiDebug />
          </div>
        )}
      </main>

      {/* 店铺编辑对话框 */}
      <EditShopDialog
        open={shopFormOpen}
        onOpenChange={setShopFormOpen}
        shop={currentShop}
        onSuccess={loadShops}
      />

      {/* 排序对话框 */}
      <ShopSortModal
        isOpen={sortModalOpen}
        onClose={() => setSortModalOpen(false)}
        shops={shops}
        onSort={handleSort}
        isSubmitting={isSubmitting}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('shop:confirm_delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('shop:delete_shop_confirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? t('common:deleting') : t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
