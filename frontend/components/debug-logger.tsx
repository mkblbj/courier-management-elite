"use client"

import { useState, useEffect, useCallback } from "react"
import { useEnvStore } from "@/lib/env-config"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bug, X, Trash2, Clock, Info, AlertCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// 日志类型
type LogLevel = "info" | "warn" | "error"

// 日志条目
interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  message: string
  data?: any
}

// 创建一个全局日志存储
const logs: LogEntry[] = []

// 判断是否可以记录日志
const canLog = () => {
  return process.env.NODE_ENV !== "production"
}

// 添加日志的函数
export function addLog(level: LogLevel, message: string, data?: any) {
  // 在生产环境中不记录日志
  if (!canLog()) return

  const log: LogEntry = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    timestamp: new Date(),
    level,
    message,
    data,
  }
  logs.unshift(log) // 添加到开头

  // 限制日志数量
  if (logs.length > 100) {
    logs.pop()
  }

  // 触发更新 - 只在非生产环境中执行
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("debug-log-update"))
  }
}

// 导出便捷函数
export const logInfo = (message: string, data?: any) => canLog() && addLog("info", message, data)
export const logWarn = (message: string, data?: any) => canLog() && addLog("warn", message, data)
export const logError = (message: string, data?: any) => canLog() && addLog("error", message, data)

export function DebugLogger() {
  // 在生产环境中直接返回null
  if (process.env.NODE_ENV === "production") {
    return null
  }
  
  const { debug } = useEnvStore()
  const [isOpen, setIsOpen] = useState(false)
  const [localLogs, setLocalLogs] = useState<LogEntry[]>([])
  const [isVisible, setIsVisible] = useState(false)

  const handleLogUpdate = useCallback(() => {
    setLocalLogs([...logs])
  }, [])

  useEffect(() => {
    // 只在非生产环境中执行
    if (process.env.NODE_ENV === "production") return
    
    // 初始加载日志
    setLocalLogs([...logs])

    // 监听日志更新
    window.addEventListener("debug-log-update", handleLogUpdate)

    // 显示动画
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 500)

    return () => {
      window.removeEventListener("debug-log-update", handleLogUpdate)
      clearTimeout(timer)
    }
  }, [handleLogUpdate])

  const clearLogs = () => {
    logs.length = 0
    setLocalLogs([])
  }

  // 获取日志级别对应的图标和颜色
  const getLogLevelInfo = (level: LogLevel) => {
    switch (level) {
      case "info":
        return { icon: <Info className="h-4 w-4" />, color: "bg-blue-100 text-blue-700" }
      case "warn":
        return { icon: <AlertTriangle className="h-4 w-4" />, color: "bg-amber-100 text-amber-700" }
      case "error":
        return { icon: <AlertCircle className="h-4 w-4" />, color: "bg-red-100 text-red-700" }
    }
  }

  // 只在开发环境和调试模式下显示
  if (!debug) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full shadow-md transition-all duration-200",
          isOpen ? "bg-blue-100 text-blue-700" : "bg-white hover:bg-blue-50",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bug className={cn("h-5 w-5 transition-transform", isOpen && "rotate-90")} />
      </Button>

      {isOpen && (
        <Card
          className={cn(
            "absolute bottom-12 left-0 w-96 border shadow-lg transition-all duration-300",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bug className="h-4 w-4" />
              调试日志
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearLogs} title="清除日志">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)} title="关闭">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {localLogs.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">暂无日志记录</div>
              ) : (
                <div className="divide-y">
                  {localLogs.map((log) => {
                    const { icon, color } = getLogLevelInfo(log.level)
                    return (
                      <div key={log.id} className="p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className={cn("px-1.5 py-0", color)}>
                            <div className="flex items-center gap-1">
                              {icon}
                              <span className="uppercase text-[10px] font-semibold">{log.level}</span>
                            </div>
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {log.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-sm">{log.message}</div>
                        {log.data && (
                          <details className="mt-1">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              查看详情
                            </summary>
                            <pre className="mt-2 p-2 text-xs bg-muted/50 rounded overflow-auto max-h-40">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="py-2 px-4 border-t text-xs text-muted-foreground">
            共 {localLogs.length} 条日志记录
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
