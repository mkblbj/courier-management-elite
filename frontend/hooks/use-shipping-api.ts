"use client"

import { shippingApi } from "@/services/shipping-api"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"

// 创建自定义hook封装API操作
export function useShippingApi() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  // 封装导出数据功能
  const exportShippingData = async (params: any) => {
    setIsLoading(true)
    
    try {
      // 调用API导出端点
      const response = await shippingApi.exportData(params)
      
      // 返回成功的响应
      return {
        success: true,
        file_url: response.downloadUrl,
        message: "数据导出成功"
      }
    } catch (error) {
      // 处理错误情况
      console.error("导出数据失败:", error)
      toast({
        title: "导出失败",
        description: error instanceof Error ? error.message : "导出数据时发生错误",
        variant: "destructive",
      })
      
      return {
        success: false,
        message: error instanceof Error ? error.message : "导出失败"
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  // 返回API功能和状态
  return {
    ...shippingApi,
    exportShippingData,
    isLoading
  }
} 