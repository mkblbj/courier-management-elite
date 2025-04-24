"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function RouteChangeLoading() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 当路由变化时，更新状态（但不显示进度条）
    setIsLoading(true)

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [pathname])

  // 始终返回null，不显示进度条
  return null
}
