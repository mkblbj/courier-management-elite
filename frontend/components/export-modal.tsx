import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { useShippingApi } from "@/hooks/use-shipping-api"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

// 导出功能中使用的接口
export interface ExportModalProps {
  timeRange?: { from: Date; to: Date }
  courierTypeFilter?: number[]
}

export function ExportModal({ timeRange, courierTypeFilter = [] }: ExportModalProps) {
  const {
    t: t
  } = useTranslation();

  const [open, setOpen] = useState(false)
  const [filename, setFilename] = useState(`快递数据导出_${format(new Date(), "yyyyMMdd")}`)
  const [isExporting, setIsExporting] = useState(false)
  const shippingApi = useShippingApi()

  const handleExport = async () => {
    const {
      t: t
    } = useTranslation();

    if (!filename.trim()) {
      toast({
        title: "错误",
        description: "请输入有效的文件名",
        variant: "destructive",
      })
      return
    }

    try {
      setIsExporting(true)

      // 构建导出参数
      const params: any = {}

      // 添加日期范围参数
      if (timeRange?.from && timeRange?.to) {
        params.date_from = format(timeRange.from, "yyyy-MM-dd")
        params.date_to = format(timeRange.to, "yyyy-MM-dd")
      }

      // 添加快递类型筛选参数
      if (courierTypeFilter && courierTypeFilter.length > 0) {
        params.courier_id = courierTypeFilter[0]
      }

      // 调用API导出数据
      const response = await shippingApi.exportShippingData({
        ...params,
        filename: filename.trim(),
      })

      if (response.success) {
        toast({
          title: "导出成功",
          description: "数据已成功导出到Excel文件",
        })
        
        // 创建下载链接（如果API返回了文件URL）
        if (response.file_url) {
          const link = document.createElement('a')
          link.href = response.file_url
          link.setAttribute('download', `${filename.trim()}.xlsx`)
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
        
        setOpen(false)
      } else {
        throw new Error(response.message || "导出失败")
      }
    } catch (error) {
      console.error("导出错误:", error)
      toast({
        title: "导出失败",
        description: error instanceof Error ? error.message : "无法导出数据，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    (<Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t("导出数据")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("导出数据")}</DialogTitle>
          <DialogDescription>{t("导出所选时间范围和快递类型的发货数据到Excel文件")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="filename" className="text-right">{t("文件名")}</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="col-span-3"
            />
          </div>
          {timeRange?.from && timeRange?.to && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t("时间范围")}</Label>
              <div className="col-span-3 text-sm">
                {format(timeRange.from, "yyyy-MM-dd")} 至 {format(timeRange.to, "yyyy-MM-dd")}
              </div>
            </div>
          )}
          {courierTypeFilter && courierTypeFilter.length > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t("快递类型")}</Label>
              <div className="col-span-3 text-sm">{t("已选择")}{courierTypeFilter.length}{t("种快递类型")}</div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{t("取消")}</Button>
          <Button type="submit" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("导出中...")}</>
            ) : (
              "导出"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>)
  );
} 