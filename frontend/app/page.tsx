"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileInput, Edit, Package, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-16 px-4 sm:px-6">
        <div
          className={cn(
            "text-center mb-12 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8",
          )}
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-3">快递管理系统</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">高效管理快递类型和发货数据的综合平台</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card
            className={cn(
              "border transition-all duration-500 hover-lift overflow-hidden",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            )}
            style={{ transitionDelay: "200ms" }}
          >
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-gray-800">快递类型管理</CardTitle>
              </div>
              <CardDescription className="text-gray-600">管理系统中可用的快递类型及其属性</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-6 text-gray-600 leading-relaxed">
                添加、编辑、删除快递类型，管理快递类型的状态和排序。通过拖拽功能轻松调整快递类型的显示顺序，提高工作效率。
              </p>
              <Link href="/courier-types" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 group transition-all duration-300">
                  <Edit className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  进入快递类型管理
                  <ArrowRight className="ml-2 h-4 w-4 opacity-70 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "border transition-all duration-500 hover-lift overflow-hidden",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            )}
            style={{ transitionDelay: "400ms" }}
          >
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <FileInput className="h-4 w-4 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-gray-800">发货数据录入</CardTitle>
              </div>
              <CardDescription className="text-gray-600">记录每日各快递类型的发货数量</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-6 text-gray-600 leading-relaxed">
                单条或批量录入发货数据，查看最近录入的记录。支持按日期筛选和导出数据，方便统计和分析发货情况。
              </p>
              <Link href="/shipping-data" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 group transition-all duration-300">
                  <FileInput className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  进入发货数据录入
                  <ArrowRight className="ml-2 h-4 w-4 opacity-70 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
