"use client"

import React from "react"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface MotionProps {
  children: React.ReactNode
  className?: string
  delay?: number // delay in ms
  duration?: number // duration in ms
  type?: "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale" | "none"
}

export function Motion({ children, className, delay = 0, duration = 300, type = "fade" }: MotionProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const getAnimationClasses = () => {
    const baseClasses = `transition-all duration-${duration} ease-in-out`

    if (type === "none") return ""

    const initialClasses = {
      fade: "opacity-0",
      "slide-up": "opacity-0 translate-y-4",
      "slide-down": "opacity-0 -translate-y-4",
      "slide-left": "opacity-0 translate-x-4",
      "slide-right": "opacity-0 -translate-x-4",
      scale: "opacity-0 scale-95",
    }

    return isVisible
      ? `${baseClasses} opacity-100 translate-x-0 translate-y-0 scale-100`
      : `${baseClasses} ${initialClasses[type]}`
  }

  return <div className={cn(getAnimationClasses(), className)}>{children}</div>
}

// Staggered animation container for lists
export function MotionList({
  children,
  className,
  staggerDelay = 50,
}: {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child

        return React.cloneElement(child as React.ReactElement, {
          style: {
            ...((child as React.ReactElement).props.style || {}),
            animationDelay: `${index * staggerDelay}ms`,
          },
          className: cn((child as React.ReactElement).props.className, "animate-fade-in"),
        })
      })}
    </div>
  )
}
