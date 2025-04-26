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
      <Card className="p-4 hover:bg-blue-50 transition-colors cursor-pointer border-l-4 border-l-blue-500">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-md text-blue-700">{icon}</div>
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
