"use client";
import { useTranslation } from "react-i18next";

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { runNetworkDiagnostics } from "@/lib/network-test"
import { useEnvStore } from "@/lib/env-config"
import { Wifi, WifiOff, Server, Globe, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

export function NetworkDiagnostics() {
  const { t } = useTranslation();

  const { apiBaseUrl } = useEnvStore()
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const runDiagnostics = async () => {
    setIsRunning(true)
    try {
      const results = await runNetworkDiagnostics(apiBaseUrl)
      setDiagnosticResults(results)
    } catch (error) {
      console.error("诊断运行失败:", error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    (<Card
      className="border shadow-md transition-all duration-500 opacity-0 translate-y-4"
      style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(16px)" }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Server className="h-5 w-5 text-blue-500" />{t("网络连接诊断")}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t("API 服务器:")}</span>
              <span className="text-sm text-muted-foreground">{apiBaseUrl}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runDiagnostics}
              disabled={isRunning}
              className="flex items-center gap-1"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>{t("诊断中...")}</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{t("运行诊断")}</span>
                </>
              )}
            </Button>
          </div>

          {diagnosticResults && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {diagnosticResults.networkStatus.online ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">{t("网络连接")}</span>
                </div>
                <Badge variant={diagnosticResults.networkStatus.online ? "success" : "destructive"}>
                  {diagnosticResults.networkStatus.online ? "在线" : "离线"}
                </Badge>
              </div>

              {diagnosticResults.networkStatus.online && diagnosticResults.networkStatus.latency && (
                <div className="flex items-center justify-between pl-6">
                  <span className="text-xs text-muted-foreground">{t("网络延迟")}</span>
                  <span className="text-xs font-mono">{Math.round(diagnosticResults.networkStatus.latency)} ms</span>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {diagnosticResults.apiConnection.success ? (
                    <Server className="h-4 w-4 text-green-500" />
                  ) : (
                    <Server className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">{t("API 服务器")}</span>
                </div>
                <Badge variant={diagnosticResults.apiConnection.success ? "success" : "destructive"}>
                  {diagnosticResults.apiConnection.success ? "可访问" : "不可访问"}
                </Badge>
              </div>

              {diagnosticResults.apiConnection.status && (
                <div className="flex items-center justify-between pl-6">
                  <span className="text-xs text-muted-foreground">{t("HTTP 状态")}</span>
                  <span className="text-xs font-mono">
                    {diagnosticResults.apiConnection.status} {diagnosticResults.apiConnection.statusText}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pl-6">
                <span className="text-xs text-muted-foreground">{t("响应时间")}</span>
                <span className="text-xs font-mono">{Math.round(diagnosticResults.apiConnection.responseTime)} ms</span>
              </div>

              {diagnosticResults.apiConnection.error && (
                <div className="pl-6 mt-1">
                  <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">{t("错误:")}{diagnosticResults.apiConnection.error}
                  </div>
                </div>
              )}

              {diagnosticResults.dnsResolution && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {diagnosticResults.dnsResolution.success ? (
                        <Globe className="h-4 w-4 text-green-500" />
                      ) : (
                        <Globe className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">{t("DNS 解析")}</span>
                    </div>
                    <Badge variant={diagnosticResults.dnsResolution.success ? "success" : "destructive"}>
                      {diagnosticResults.dnsResolution.success ? "成功" : "失败"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pl-6">
                    <span className="text-xs text-muted-foreground">{t("解析时间")}</span>
                    <span className="text-xs font-mono">
                      {Math.round(diagnosticResults.dnsResolution.responseTime)} ms
                    </span>
                  </div>

                  {diagnosticResults.dnsResolution.error && (
                    <div className="pl-6 mt-1">
                      <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">{t("错误:")}{diagnosticResults.dnsResolution.error}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!diagnosticResults && !isRunning && (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8 mb-2 text-blue-400 opacity-70" />
              <p className="text-sm">{t("点击\"运行诊断\"按钮开始网络连接测试")}</p>
              <p className="text-xs mt-1">{t("这将帮助诊断API连接问题")}</p>
            </div>
          )}

          {isRunning && !diagnosticResults && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <RefreshCw className="h-8 w-8 mb-3 text-blue-500 animate-spin" />
              <p className="text-sm">{t("正在运行网络诊断...")}</p>
              <p className="text-xs mt-1 text-muted-foreground">{t("请稍候，这可能需要几秒钟时间")}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between text-xs text-muted-foreground">
        <div>{diagnosticResults && <span>{t("诊断完成于")}{new Date().toLocaleTimeString()}</span>}</div>
        <div>
          {diagnosticResults && diagnosticResults.apiConnection.success ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              <span>{t("API服务器正常")}</span>
            </div>
          ) : diagnosticResults && !diagnosticResults.apiConnection.success ? (
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              <span>{t("API服务器连接失败")}</span>
            </div>
          ) : null}
        </div>
      </CardFooter>
    </Card>)
  );
}
