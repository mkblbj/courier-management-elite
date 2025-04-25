"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

export function RouteChangeLoading() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    // 路由变化时显示进度条
    setIsVisible(true)
    setProgress(0)
    
    // 快速增加到80%
    const timer1 = setTimeout(() => {
      setProgress(66)
    }, 50)
    
    // 然后缓慢增加到95%
    const timer2 = setTimeout(() => {
      setProgress(95)
    }, 500)
    
    // 页面加载完成后，完成进度条并隐藏
    const timer3 = setTimeout(() => {
      setProgress(100)
      const timer4 = setTimeout(() => {
        setIsVisible(false)
      }, 200) // 短暂延迟后隐藏
      
      return () => clearTimeout(timer4)
    }, 800)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [pathname, searchParams])
  
  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 h-1 bg-transparent z-50 transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className="h-full bg-blue-600 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
