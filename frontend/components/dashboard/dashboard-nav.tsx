"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart, FileInput, Package, PieChart, Settings, BarChart2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

export function DashboardNav() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { t, i18n } = useTranslation(['common', 'shop'])

  const navItems = [
    {
      title: mounted ? t('dashboard') : '',
      href: "/dashboard",
      icon: <BarChart className="h-4 w-4" />,
    },
    {
      title: mounted ? t('shipping_data') : '',
      href: "/shipping-data",
      icon: <FileInput className="h-4 w-4" />,
    },
    {
      title: mounted ? t('shop:output_data') : '',
      href: "/output-data",
      icon: <BarChart2 className="h-4 w-4" />,
    },
    {
      title: mounted ? t('stats') : '',
      href: "/stats",
      icon: <PieChart className="h-4 w-4" />,
    },
    {
      title: mounted ? t('courier_types') : '',
      href: "/courier-types",
      icon: <Package className="h-4 w-4" />,
    },
    {
      title: mounted ? t('settings') : '',
      href: "/settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 200)

    setMounted(true)

    return () => clearTimeout(timer)
  }, [])

  return (
    <nav className="bg-white border-b">
      <div className="max-w-screen-xl mx-auto px-4 flex justify-center">
        <div className="flex items-center">
          {navItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1 px-4 py-3 text-sm font-medium transition-all duration-500",
                pathname === item.href
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
