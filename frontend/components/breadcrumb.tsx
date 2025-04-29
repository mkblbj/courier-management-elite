"use client";
import { useTranslation } from "react-i18next";

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home, Package, FileInput } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href: string
  active?: boolean
  icon?: React.ReactNode
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  action?: React.ReactNode
}

export function Breadcrumb({ items, action }: BreadcrumbProps) {
  const {
    t: t
  } = useTranslation();

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 50)

    return () => clearTimeout(timer)
  }, [])

  return (
    (<nav
      className={cn(
        "flex items-center justify-between text-sm mb-6 bg-white px-4 py-3 rounded-lg border transition-all duration-300",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4",
      )}
    >
      <div className="flex items-center">
        <Link
          href="/"
          className={cn(
            "flex items-center text-gray-600 hover:text-blue-600 transition-colors transition-all duration-300 delay-100",
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4",
          )}
        >
          <Home className="h-4 w-4 mr-1" />
          <span>{t("首页")}</span>
        </Link>

        {items.map((item, index) => (
          <div
            key={item.href}
            className={cn(
              "flex items-center transition-all duration-300",
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4",
            )}
            style={{ transitionDelay: `${(index + 1) * 100}ms` }}
          >
            <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            {item.active ? (
              <span className="font-medium text-blue-600 flex items-center">
                {item.icon && <span className="mr-1.5">{item.icon}</span>}
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="text-gray-600 hover:text-blue-600 transition-colors flex items-center">
                {item.icon && <span className="mr-1.5">{item.icon}</span>}
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </div>
      {action && (
        <div 
          className={cn(
            "transition-all duration-300",
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
          )}
          style={{ transitionDelay: "200ms" }}
        >
          {action}
        </div>
      )}
    </nav>)
  );
}

export function useBreadcrumb() {
  const {
    t: t
  } = useTranslation();

  const pathname = usePathname()

  const breadcrumbMap: Record<string, { label: string; href: string; icon: React.ReactNode }> = {
    "/courier-types": {
      label: "快递类型管理",
      href: "/courier-types",
      icon: <Package className="h-3.5 w-3.5" />,
    },
    "/shipping-data": {
      label: "发货数据录入",
      href: "/shipping-data",
      icon: <FileInput className="h-3.5 w-3.5" />,
    },
  }

  const items: BreadcrumbItem[] = []

  if (breadcrumbMap[pathname]) {
    items.push({
      ...breadcrumbMap[pathname],
      active: true,
    })
  }

  return items
}
