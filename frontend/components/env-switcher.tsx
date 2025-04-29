"use client";
import { useTranslation } from "react-i18next";

import { useState, useEffect } from "react"
import { useEnvStore, type Environment } from "@/lib/env-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Settings, Bug, Server, Code, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { logInfo } from "@/components/debug-logger"

export function EnvSwitcher() {
  const { t } = useTranslation();

  const { env, isDev, debug, setEnvironment, resetToDefault } = useEnvStore()
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  // 在组件挂载时记录当前环境
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      logInfo(t("当前环境配置"), { env, isDev, debug })
    }
  }, [env, isDev, debug, t])

  // 只在开发环境中显示
  // 添加NODE_ENV检查，确保在生产环境中不显示
  if (process.env.NODE_ENV === "production") {
    return null
  }

  const handleEnvironmentChange = (newEnv: Environment) => {
    setEnvironment(newEnv)
    logInfo(t("环境已切换"), { from: env, to: newEnv })
    toast({
      title: t("环境已切换"),
      description: t("当前环境: {{env}}", { env: newEnv }),
      variant: "default",
    })
  }

  const handleReset = () => {
    resetToDefault()
    const newEnv = useEnvStore.getState().env
    logInfo(t("环境已重置"), { to: newEnv })
    toast({
      title: t("环境已重置"),
      description: t("当前环境: {{env}}", { env: newEnv }),
      variant: "default",
    })
  }

  return (<>
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full shadow-md transition-all duration-200",
          isOpen ? "bg-blue-100 text-blue-700" : "bg-white hover:bg-blue-50",
          env === "production" && !isOpen && "bg-red-100 text-red-700 hover:bg-red-50",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Settings className={cn("h-5 w-5 transition-transform", isOpen && "rotate-90")} />
      </Button>
    </div>
    {isOpen && (
      <div className="fixed bottom-16 right-4 z-50 w-80 animate-fade-in">
        <Card className="border shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Code className="h-5 w-5" />{t("环境配置")}</CardTitle>
              <Badge
                variant={env === "development" ? "default" : env === "production" ? "destructive" : "secondary"}
                className="px-2 py-0.5"
              >
                {env}
              </Badge>
            </div>
            <CardDescription>{t("切换环境配置以测试不同环境")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="environment">{t("环境")}</Label>
              <Select value={env} onValueChange={(value) => handleEnvironmentChange(value as Environment)}>
                <SelectTrigger id="environment">
                  <SelectValue placeholder={t("选择环境")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development" className="flex items-center gap-2">
                    <Bug className="h-4 w-4 inline-block" />
                    <span>Development</span>
                  </SelectItem>
                  <SelectItem value="production" className="flex items-center gap-2">
                    <Server className="h-4 w-4 inline-block" />
                    <span>Production</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="debug-mode" className="cursor-pointer">{t("调试模式")}</Label>
                <Badge variant={debug ? "default" : "outline"} className="px-2 py-0.5">
                  {debug ? t("开启") : t("关闭")}
                </Badge>
              </div>
              <Switch id="debug-mode" checked={debug} disabled={true} className="data-[state=checked]:bg-blue-600" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="api-url" className="cursor-pointer">{t("API 地址")}</Label>
              </div>
              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                {useEnvStore.getState().apiBaseUrl}
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>{t("关闭")}</Button>
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
              <RefreshCw className="h-3.5 w-3.5" />{t("重置")}</Button>
          </CardFooter>
        </Card>
      </div>
    )}
  </>);
}
