"use client";
import { useTranslation } from "react-i18next";

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function PageLoading() {
  const {
    t: t
  } = useTranslation();

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 模拟页面加载完成
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  return (
    (<div
      className={cn(
        "fixed inset-0 bg-white z-50 flex flex-col items-center justify-center transition-opacity duration-500",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      <div className="relative h-16 w-16 mb-4">
        <div className="absolute h-16 w-16 rounded-full border-4 border-blue-100"></div>
        <div className="absolute h-16 w-16 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
      </div>
      <div className="text-blue-600 font-medium animate-pulse">{t("加载中...")}</div>
    </div>)
  );
}
