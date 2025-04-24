"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { EnvIndicator } from "@/components/env-indicator"

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border mb-6 transition-all duration-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4",
        className,
      )}
    >
      <div
        className="transition-all duration-500 delay-100"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(-10px)",
        }}
      >
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
          <EnvIndicator />
        </div>
        {description && <p className="text-gray-600 mt-1">{description}</p>}
      </div>
      {action && (
        <div
          className="mt-2 sm:mt-0 transition-all duration-500 delay-200"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(-10px)",
          }}
        >
          {action}
        </div>
      )}
    </div>
  )
}
