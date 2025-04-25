"use client"

import { useEffect, useState } from "react"
import { ShippingDataEntry } from "@/components/shipping-data-entry"
import { ShippingApiDebug } from "@/components/shipping-api-debug"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit, Package } from "lucide-react"
import { Breadcrumb } from "@/components/breadcrumb"
import { cn } from "@/lib/utils"
import { useEnvStore } from "@/lib/env-config"

export default function ShippingDataPage() {
  const { debug } = useEnvStore()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 space-y-6 min-h-screen">
      <Breadcrumb
        items={[
          { label: "发货数据录入", href: "/shipping-data", active: true, icon: <Edit className="h-3.5 w-3.5" /> },
        ]}
        action={
          <Link href="/courier-types">
            <Button className="bg-blue-600 hover:bg-blue-700 transition-all duration-300">
              <Package className="mr-2 h-4 w-4" />
              编辑快递种类
            </Button>
          </Link>
        }
      />
      <PageHeader
        title="发货数据录入"
        description="记录每日各快递类型的发货数量"
        className="w-full"
      />
      <div
        className={cn(
          "transition-all duration-500",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        <ShippingDataEntry />
      </div>
      {/* API调试工具 - 仅在开发环境中显示 */}
      {debug && process.env.NODE_ENV !== "production" && (
        <div
          className={cn(
            "transition-all duration-500 delay-300",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <ShippingApiDebug />
        </div>
      )}
    </div>
  )
}
