"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  isLoading: boolean
  isVisible: boolean
  delay?: number
  className?: string
}

export function StatCard({ 
  title, 
  icon, 
  children, 
  isLoading, 
  isVisible, 
  delay = 0,
  className 
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-md text-blue-700">{icon}</div>
            {title}
          </CardTitle>
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
