"use client"

import type React from "react"

import Link from "next/link"
import { Card } from "@/components/ui/card"

interface QuickActionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
}

export function QuickActionCard({ title, description, icon, href }: QuickActionCardProps) {
  return (
    <Link href={href}>
      <Card className="p-4 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500 dark:border-l-blue-400">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-950/50 rounded-md text-blue-700 dark:text-blue-300">{icon}</div>
          <div>
            <h3 className="font-medium text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
