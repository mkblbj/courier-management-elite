"use client";
import { useTranslation } from "react-i18next";

import { useState } from "react"
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
import { shippingApi } from "@/services/shipping-api"

interface ExportDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timeRange: DateRange
  courierTypeFilter: string[]
}

type ExportStatus = "idle" | "processing" | "success" | "error"

export function ExportDataDialog({ open, onOpenChange, timeRange, courierTypeFilter }: ExportDataDialogProps) {
  const { t } = useTranslation();

  const { toast } = useToast()

  // 导出选项状态
  const [fileFormat, setFileFormat] = useState("csv")
  const [exportTimeRange, setExportTimeRange] = useState<DateRange>(timeRange)
  const [granularity, setGranularity] = useState("day")
  const [includeDetails, setIncludeDetails] = useState(true)
  const [selectedCourierTypes, setSelectedCourierTypes] = useState<string[]>(courierTypeFilter)
  const [fileName, setFileName] = useState(() => {
    const from = timeRange.from ? format(timeRange.from, "yyyy-MM-dd") : ""
    const to = timeRange.to ? format(timeRange.to, "yyyy-MM-dd") : ""
    return `发货统计_${from}_${to}`
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
      // 构建导出参数
      const exportParams = {
        format: fileFormat,
        date_from: exportTimeRange.from ? format(exportTimeRange.from, "yyyy-MM-dd") : "",
        date_to: exportTimeRange.to ? format(exportTimeRange.to, "yyyy-MM-dd") : "",
        granularity,
        include_details: includeDetails,
        courier_ids: selectedCourierTypes.length > 0 ? selectedCourierTypes.join(",") : undefined,
        filename: fileName,
        background_process: processInBackground,
        notification_email: processInBackground ? notificationEmail : undefined,
      }

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }

          // 计算剩余时间
          const remaining = Math.ceil((100 - prev) / 10) // 每10%大约需要1秒
          setEstimatedTime(remaining)

          return prev + 2 // 每次增加2%
        })
      }, 200)

      // 调用实际API
      const response = await shippingApi.exportData(exportParams)

      clearInterval(progressInterval)
      setProgress(100)
      setExportStatus("success")

      if (response && response.downloadUrl) {
        setDownloadUrl(response.downloadUrl)
      } else {
        throw new Error(t("导出成功但未获取到下载链接"))
      }

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

  // 处理下载
  const handleDownload = () => {
    // 实际应用中应该使用真实的下载URL
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = `${fileName}.${fileFormat}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

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
                      Excel
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

                  {/* 这里应该从API获取快递类型列表，目前使用模拟数据 */}
                  {["顺丰速运", "中通快递", "圆通速递", "韵达快递", "申通快递"].map((type, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2 ml-4">
                      <Checkbox
                        id={`type-${index}`}
                        checked={selectedCourierTypes.includes(index.toString())}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCourierTypes((prev) => [...prev, index.toString()])
                          } else {
                            setSelectedCourierTypes((prev) => prev.filter((id) => id !== index.toString()))
                          }
                        }}
                      />
                      <Label htmlFor={`type-${index}`}>{type}</Label>
                    </div>
                  ))}
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
              <p className="text-center">{t("文件名:")}{fileName}.{fileFormat}
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
