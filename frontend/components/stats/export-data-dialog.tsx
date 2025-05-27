"use client";
import { useTranslation } from "react-i18next";

import { useState, useEffect } from "react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Download, FileSpreadsheet, FileText, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { DateRange } from "react-day-picker"
import { api, type CourierType, getBaseApiUrl } from "@/services/api"

interface ExportDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timeRange: DateRange
  courierTypeFilter: string[]
  statsType?: 'shipping' | 'shop-output' // 新增统计类型参数
}

type ExportStatus = "idle" | "processing" | "success" | "error"

export function ExportDataDialog({ open, onOpenChange, timeRange, courierTypeFilter, statsType = 'shipping' }: ExportDataDialogProps) {
  const { t } = useTranslation();

  const { toast } = useToast()

  // 快递类型列表状态
  const [courierTypes, setCourierTypes] = useState<CourierType[]>([])
  const [courierTypesLoading, setCourierTypesLoading] = useState(false)

  // 导出选项状态
  const [fileFormat, setFileFormat] = useState("csv")
  const [exportTimeRange, setExportTimeRange] = useState<DateRange>(timeRange)
  const [granularity, setGranularity] = useState("day")
  const [includeDetails, setIncludeDetails] = useState(true)
  const [selectedCourierTypes, setSelectedCourierTypes] = useState<string[]>(courierTypeFilter)
  const [fileName, setFileName] = useState(() => {
    const from = timeRange.from ? format(timeRange.from, "yyyy-MM-dd") : ""
    const to = timeRange.to ? format(timeRange.to, "yyyy-MM-dd") : ""
    const prefix = statsType === 'shipping' ? '发货统计' : '店铺出力统计'
    return `${prefix}_${from}_${to}`
  })

  // 高级选项状态
  const [processInBackground, setProcessInBackground] = useState(false)
  const [notificationEmail, setNotificationEmail] = useState("")

  // 导出状态
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [downloadUrl, setDownloadUrl] = useState("")

  // 获取快递类型列表
  const fetchCourierTypes = async () => {
    setCourierTypesLoading(true)
    try {
      const types = await api.getCourierTypes({ active_only: true })
      setCourierTypes(types)
    } catch (error) {
      console.error('获取快递类型列表失败:', error)
      toast({
        title: "获取快递类型失败",
        description: "无法加载快递类型列表，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setCourierTypesLoading(false)
    }
  }

  // 组件挂载时获取快递类型列表
  useEffect(() => {
    if (open) {
      fetchCourierTypes()
    }
  }, [open])

  // 更新时间范围时更新文件名
  useEffect(() => {
    const from = exportTimeRange.from ? format(exportTimeRange.from, "yyyy-MM-dd") : ""
    const to = exportTimeRange.to ? format(exportTimeRange.to, "yyyy-MM-dd") : ""
    const prefix = statsType === 'shipping' ? '发货统计' : '店铺出力统计'
    setFileName(`${prefix}_${from}_${to}`)
  }, [exportTimeRange, statsType])

  // 重置表单
  const resetForm = () => {
    setExportStatus("idle")
    setProgress(0)
    setEstimatedTime(0)
    setErrorMessage("")
    setDownloadUrl("")
  }

  // 关闭对话框时重置表单
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  // 修改 DateRangePicker 的 onChange 回调，处理可能的 undefined 值
  const handleDateRangeChange = (value: DateRange | undefined) => {
    if (value) {
      setExportTimeRange(value);
    }
  };

  // 处理导出过程，使用真实API
  const handleExport = async () => {
    // 验证表单
    if (!exportTimeRange.from || !exportTimeRange.to) {
      toast({
        title: "请选择时间范围",
        variant: "destructive",
      })
      return
    }

    if (processInBackground && !notificationEmail) {
      toast({
        title: "请输入通知邮箱",
        variant: "destructive",
      })
      return
    }

    // 开始导出
    setExportStatus("processing")
    setProgress(0)

    try {
      // 根据统计类型构建不同的导出参数和API端点
      let exportParams: Record<string, any>
      let apiEndpoint: string

      // 统一使用 export-data API，通过参数区分数据类型
      exportParams = {
        date_from: exportTimeRange.from ? format(exportTimeRange.from, "yyyy-MM-dd") : "",
        date_to: exportTimeRange.to ? format(exportTimeRange.to, "yyyy-MM-dd") : "",
        courier_id: selectedCourierTypes.length > 0 ? selectedCourierTypes.join(",") : undefined,
        data_type: statsType // 添加数据类型参数
      }
      apiEndpoint = '/api/stats/export-data'

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            return prev
          }
          const remaining = Math.ceil((100 - prev) / 10)
          setEstimatedTime(remaining)
          return prev + 5
        })
      }, 300)

      // 调用对应的导出数据API
      const apiBaseUrl = getBaseApiUrl()
      const response = await fetch(`${apiBaseUrl}${apiEndpoint}?${new URLSearchParams(exportParams).toString()}`)

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(`导出失败: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      if (result.code !== 0) {
        throw new Error(result.message || "导出失败")
      }

      setProgress(100)
      setExportStatus("success")

      // 生成下载数据
      const exportData = result.data
      console.log('API返回的数据:', exportData) // 调试信息
      const csvContent = generateCSVContent(exportData, fileFormat)
      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8'
      })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)

      toast({
        title: "导出成功",
        description: "数据已成功导出",
        variant: "default",
      })
    } catch (err) {
      setExportStatus("error")
      setErrorMessage(err instanceof Error ? err.message : "导出失败")

      toast({
        title: "导出失败",
        description: err instanceof Error ? err.message : "导出失败",
        variant: "destructive",
      })
    }
  }

  // 生成CSV内容
  const generateCSVContent = (data: any, format: string): string => {
    // 统一处理API返回的orders数据
    if (!data || !data.orders || !Array.isArray(data.orders)) {
      console.log('导出数据为空或格式不正确:', data)
      return ""
    }

    if (statsType === 'shipping') {
      // 发货数据格式
      const headers = [
        "订单编号",
        "店铺名称",
        "店铺类别",
        "快递类型",
        "订单日期",
        "数量",
        "状态",
        "创建时间",
        "更新时间"
      ]

      const rows = data.orders.map((order: any) => [
        order.orderId || "",
        order.shopName || "",
        order.shopCategory || "",
        order.courierType || "",
        order.orderDate || "",
        order.amount || 0,
        order.status || "",
        order.createTime || "",
        order.updateTime || ""
      ])

      // 统一CSV格式，添加BOM以确保Excel正确识别编码
      const csvRows = [headers, ...rows]
      const csvContent = csvRows.map(row =>
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      ).join('\n')
      return '\ufeff' + csvContent // 添加UTF-8 BOM
    } else {
      // 店铺出力数据格式
      const headers = [
        "订单编号",
        "店铺名称",
        "店铺类别",
        "快递类型",
        "订单日期",
        "数量",
        "状态",
        "创建时间",
        "更新时间"
      ]

      const rows = data.orders.map((order: any) => [
        order.orderId || "",
        order.shopName || "",
        order.shopCategory || "",
        order.courierType || "",
        order.orderDate || "",
        order.amount || 0,
        order.status || "",
        order.createTime || "",
        order.updateTime || ""
      ])

      // 统一CSV格式，添加BOM以确保Excel正确识别编码
      const csvRows = [headers, ...rows]
      const csvContent = csvRows.map(row =>
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      ).join('\n')
      return '\ufeff' + csvContent // 添加UTF-8 BOM
    }
  }

  // 处理下载
  const handleDownload = () => {
    if (!downloadUrl) return

    const link = document.createElement("a")
    link.href = downloadUrl
    // 根据文件格式设置正确的扩展名
    const fileExtension = 'csv'
    link.download = `${fileName}.${fileExtension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 清理URL对象
    URL.revokeObjectURL(downloadUrl)

    // 关闭对话框
    onOpenChange(false)
  }

  // 处理重试
  const handleRetry = () => {
    resetForm()
  }

  return (
    (<Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        {exportStatus === "idle" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{t("导出统计数据")}</DialogTitle>
              <DialogDescription>{t("配置导出选项，将统计数据导出为文件")}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* 文件格式 */}
              <div className="space-y-2">
                <Label>{t("文件格式")}</Label>
                <RadioGroup value={fileFormat} onValueChange={setFileFormat} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv" className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      CSV
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excel" id="excel" />
                    <Label htmlFor="excel" className="flex items-center">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel (CSV)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 时间范围 */}
              <div className="space-y-2">
                <Label>{t("时间范围")}</Label>
                <DateRangePicker value={exportTimeRange} onChange={handleDateRangeChange} />
              </div>

              {/* 数据粒度 */}
              <div className="space-y-2">
                <Label>{t("数据粒度")}</Label>
                <Select value={granularity} onValueChange={setGranularity}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("选择数据粒度")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">{t("按日")}</SelectItem>
                    <SelectItem value="week">{t("按周")}</SelectItem>
                    <SelectItem value="month">{t("按月")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 快递类型 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{t("快递类型")}</Label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => setSelectedCourierTypes([])}
                  >{t("清除选择")}</button>
                </div>
                <div className="border rounded-md p-4 max-h-[150px] overflow-y-auto">
                  {courierTypesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">{t("加载中...")}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id="all-types"
                          checked={selectedCourierTypes.length === 0}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedCourierTypes([])
                          }}
                        />
                        <Label htmlFor="all-types" className="font-medium">{t("全部类型")}</Label>
                      </div>

                      {courierTypes.map((type) => (
                        <div key={type.id} className="flex items-center space-x-2 mb-2 ml-4">
                          <Checkbox
                            id={`type-${type.id}`}
                            checked={selectedCourierTypes.includes(type.id.toString())}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCourierTypes((prev) => [...prev, type.id.toString()])
                              } else {
                                setSelectedCourierTypes((prev) => prev.filter((id) => id !== type.id.toString()))
                              }
                            }}
                          />
                          <Label htmlFor={`type-${type.id}`}>{type.name}</Label>
                        </div>
                      ))}

                      {courierTypes.length === 0 && (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          {t("暂无快递类型数据")}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 数据详细程度 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-details"
                  checked={includeDetails}
                  onCheckedChange={(checked) => setIncludeDetails(!!checked)}
                />
                <Label htmlFor="include-details">{t("包含详细记录")}</Label>
              </div>

              {/* 文件命名 */}
              <div className="space-y-2">
                <Label htmlFor="file-name">{t("文件命名")}</Label>
                <Input id="file-name" value={fileName} onChange={(e) => setFileName(e.target.value)} />
              </div>

              {/* 高级选项 */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">{t("高级选项")}</h3>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="background-process"
                    checked={processInBackground}
                    onCheckedChange={(checked) => setProcessInBackground(!!checked)}
                  />
                  <Label htmlFor="background-process">{t("在后台处理并通知我")}</Label>
                </div>

                {processInBackground && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="notification-email">{t("通知邮箱")}</Label>
                    <Input
                      id="notification-email"
                      type="email"
                      placeholder="example@company.com"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>{t("取消")}</Button>
              <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700">
                <Download className="mr-2 h-4 w-4" />{t("导出")}</Button>
            </DialogFooter>
          </>
        )}

        {exportStatus === "processing" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{t("正在导出数据")}</DialogTitle>
              <DialogDescription>{t("请稍候，正在处理您的导出请求")}</DialogDescription>
            </DialogHeader>

            <div className="py-8 space-y-6">
              <div className="flex justify-center">
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t("导出进度")}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">{t("预计剩余时间:")}{estimatedTime} 秒</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setExportStatus("idle")}>{t("取消导出")}</Button>
            </DialogFooter>
          </>
        )}

        {exportStatus === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-600" />{t("导出成功")}</DialogTitle>
              <DialogDescription>{t("您的数据已成功导出，可以下载文件")}</DialogDescription>
            </DialogHeader>

            <div className="py-8 flex flex-col items-center">
              <div className="bg-green-50 text-green-700 rounded-full p-6 mb-4">
                <CheckCircle className="h-12 w-12" />
              </div>
              <p className="text-center">{t("文件名:")}{fileName}.csv
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>{t("关闭")}</Button>
              <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
                <Download className="mr-2 h-4 w-4" />{t("下载文件")}</Button>
            </DialogFooter>
          </>
        )}

        {exportStatus === "error" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-red-600" />{t("导出失败")}</DialogTitle>
              <DialogDescription>{t("导出过程中发生错误")}</DialogDescription>
            </DialogHeader>

            <div className="py-8 flex flex-col items-center">
              <div className="bg-red-50 text-red-700 rounded-full p-6 mb-4">
                <X className="h-12 w-12" />
              </div>
              <p className="text-center text-red-600">{errorMessage || "未知错误，请重试"}</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>{t("关闭")}</Button>
              <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700">{t("重试")}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>)
  );
}
