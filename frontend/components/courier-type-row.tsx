"use client"

import type React from "react"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import type { CourierType } from "@/services/api"

interface CourierTypeRowProps {
  courierType: CourierType
  children: React.ReactNode
}

export function CourierTypeRow({ courierType, children }: CourierTypeRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: courierType.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "border-b last:border-b-0 transition-colors hover:bg-muted/30",
        isDragging ? "bg-accent z-10" : "bg-card even:bg-muted/50",
        !courierType.is_active && "opacity-60",
      )}
    >
      {children}
    </div>
  )
}
