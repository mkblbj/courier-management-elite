"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: React.ReactNode
  icon: React.ReactNode
  children: React.ReactNode
  isLoading: boolean
  isVisible: boolean
  delay?: number
  className?: string
  headerRight?: React.ReactNode
}

export function StatCard({
  title,
  icon,
  children,
  isLoading,
  isVisible,
  delay = 0,
  className,
  headerRight
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-lg flex items-center gap-2">
            {icon && <div className="p-1.5 bg-blue-100 dark:bg-blue-950 rounded-md text-blue-700 dark:text-blue-300">{icon}</div>}
            {title}
          </CardTitle>
          {headerRight && (
            <div className="flex items-center">
              {headerRight}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[100px]">
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
