"use client"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
      const { theme, setTheme, resolvedTheme } = useTheme()
      const [mounted, setMounted] = useState(false)

      // 避免 hydration 不匹配
      useEffect(() => {
            setMounted(true)
      }, [])

      const toggleTheme = () => {
            setTheme(theme === "light" ? "dark" : "light")
      }

      // 在客户端挂载前不渲染，避免 hydration 错误
      if (!mounted) {
            return (
                  <div className="flex items-center space-x-2 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                        <Sun className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
                        <Switch disabled aria-label="Toggle theme" className="transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
                        <Moon className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
                  </div>
            )
      }

      // 使用 resolvedTheme 来获取实际的主题值
      const isDark = resolvedTheme === "dark"

      return (
            <div className="flex items-center space-x-2 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                  <Sun
                        className={`h-[1.2rem] w-[1.2rem] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isDark
                              ? "text-muted-foreground scale-75 rotate-12"
                              : "text-foreground scale-100 rotate-0"
                              }`}
                  />
                  <Switch
                        checked={isDark}
                        onCheckedChange={toggleTheme}
                        aria-label="Toggle theme"
                        className="transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110"
                  />
                  <Moon
                        className={`h-[1.2rem] w-[1.2rem] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isDark
                              ? "text-foreground scale-100 rotate-0"
                              : "text-muted-foreground scale-75 rotate-12"
                              }`}
                  />
            </div>
      )
} 