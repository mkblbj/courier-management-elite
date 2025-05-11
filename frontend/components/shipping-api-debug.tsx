"use client";
import { useTranslation } from "react-i18next";

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { shippingApi } from "@/services/shipping-api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useEnvStore } from "@/lib/env-config"

// 辅助函数：判断是否应该显示调试组件
const shouldShowDebugComponent = () => {
  // 在生产环境中不显示
  if (process.env.NODE_ENV === "production") return false

  // 根据环境配置判断
  return useEnvStore.getState().debug
}

// 通用API测试处理函数
const handleApiRequest = async <T,>(
  apiCall: () => Promise<T>,
  actionName: string,
  method: string,
  url: string,
  addLog: (action: string, method: string, url: string, data?: any, error?: string) => void,
  requestData: any,
  onSuccess?: (response: T) => void,
  onError?: (error: Error) => void
) => {
  try {
    addLog(actionName, method, url, requestData)
    const response = await apiCall()
    addLog("API响应", method, url, response)
    if (onSuccess) onSuccess(response)
    return response
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "API请求失败"
    addLog("API错误", method, url, null, errorMessage)
    if (onError) onError(err instanceof Error ? err : new Error(errorMessage))
    throw err
  }
}

export function ShippingApiDebug() {
  const { t } = useTranslation();

  // 将所有的useState hooks移到组件顶部，确保每次渲染的调用顺序一致
  const [isMounted, setIsMounted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requestLogs, setRequestLogs] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState("test");

  // 发货数据相关表单状态
  const [shippingDate, setShippingDate] = useState<Date | undefined>(new Date());
  const [shippingFormData, setShippingFormData] = useState({
    courier_id: "",
    quantity: "10",
    notes: "测试发货记录",
  });

  const [shippingUpdateFormData, setShippingUpdateFormData] = useState({
    id: "",
    date: new Date(),
    courier_id: "",
    quantity: "",
    notes: "",
  });

  const [shippingDeleteId, setShippingDeleteId] = useState("");
  const [batchShippingData, setBatchShippingData] = useState("");

  // 在挂载后设置isMounted为true
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 添加日志的辅助函数
  const addLog = (action: string, method: string, url: string, data?: any, error?: string) => {
    const log = {
      timestamp: new Date().toISOString(),
      action,
      method,
      url,
      data,
      error,
    }

    setRequestLogs((prev) => [log, ...prev].slice(0, 20)) // 保留最近20条日志
  }

  // 发货数据API测试函数
  const testShippingApiConnection = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await handleApiRequest(
        () => shippingApi.getShippingRecords(),
        t("测试发货数据API连接"),
        "GET",
        "/api/shipping",
        addLog,
        undefined,
        (response) => setResult(response),
        (error) => setError(error.message)
      )
    } finally {
      setIsLoading(false)
    }
  }

  const testAddShippingRecord = async () => {
    if (!shippingDate) {
      setError(t("请选择日期"))
      return
    }
    if (!shippingFormData.courier_id) {
      setError(t("请输入快递类型ID"))
      return
    }

    setIsLoading(true)
    setError(null)

    const requestData = {
      date: format(shippingDate, "yyyy-MM-dd"),
      courier_id: shippingFormData.courier_id,
      quantity: Number.parseInt(shippingFormData.quantity),
      notes: shippingFormData.notes,
    }

    try {
      await handleApiRequest(
        () => shippingApi.createShippingRecord(requestData),
        t("添加发货记录"),
        "POST",
        "/api/shipping",
        addLog,
        requestData,
        (response) => setResult(response),
        (error) => setError(error.message)
      )
    } finally {
      setIsLoading(false)
    }
  }

  const testUpdateShippingRecord = async () => {
    if (!shippingUpdateFormData.id) {
      setError(t("请输入要更新的发货记录ID"))
      return
    }
    if (!shippingUpdateFormData.date) {
      setError(t("请选择日期"))
      return
    }
    if (!shippingUpdateFormData.courier_id) {
      setError(t("请输入快递类型ID"))
      return
    }

    setIsLoading(true)
    setError(null)

    const requestData = {
      date: format(shippingUpdateFormData.date, "yyyy-MM-dd"),
      courier_id: shippingUpdateFormData.courier_id,
      quantity: Number.parseInt(shippingUpdateFormData.quantity || "0"),
      notes: shippingUpdateFormData.notes,
    }

    const url = `/api/shipping/${shippingUpdateFormData.id}`

    try {
      await handleApiRequest(
        () => shippingApi.updateShippingRecord(shippingUpdateFormData.id, requestData),
        t("更新发货记录"),
        "PUT",
        url,
        addLog,
        requestData,
        (response) => setResult(response),
        (error) => setError(error.message)
      )
    } finally {
      setIsLoading(false)
    }
  }

  const testDeleteShippingRecord = async () => {
    if (!shippingDeleteId) {
      setError(t("请输入要删除的发货记录ID"))
      return
    }

    setIsLoading(true)
    setError(null)

    const url = `/api/shipping/${shippingDeleteId}`

    try {
      await handleApiRequest(
        () => shippingApi.deleteShippingRecord(shippingDeleteId),
        t("删除发货记录"),
        "DELETE",
        url,
        addLog,
        undefined,
        () => setResult({ message: "删除成功" }),
        (error) => setError(error.message)
      )
    } finally {
      setIsLoading(false)
    }
  }

  const testBatchAddShippingRecords = async () => {
    if (!shippingDate) {
      setError(t("请选择日期"))
      return
    }
    if (!batchShippingData) {
      setError(t("请输入批量发货数据"))
      return
    }

    let parsedData
    try {
      parsedData = JSON.parse(batchShippingData)
      if (!Array.isArray(parsedData)) {
        setError(t("批量发货数据必须是数组格式"))
        return
      }
    } catch (err) {
      setError(t("批量发货数据格式错误，请输入有效的JSON数组"))
      return
    }

    setIsLoading(true)
    setError(null)

    const requestData = {
      date: format(shippingDate, "yyyy-MM-dd"),
      records: parsedData,
    }

    try {
      await handleApiRequest(
        () => shippingApi.batchCreateShippingRecords(requestData),
        t("批量添加发货记录"),
        "POST",
        "/api/shipping/batch",
        addLog,
        requestData,
        (response) => setResult(response),
        (error) => setError(error.message)
      )
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = () => {
    setRequestLogs([])
  }

  const handleShippingFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setShippingFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleShippingUpdateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setShippingUpdateFormData((prev) => ({ ...prev, [name]: value }))
  }

  // 在生产环境中直接返回null
  if (process.env.NODE_ENV === "production") {
    return null
  }

  // 非客户端或环境配置不支持调试时返回null
  if (!isMounted || !useEnvStore.getState().debug) {
    return null
  }

  return (
    (<Card className="mt-6">
      <CardHeader>
        <CardTitle>{t("发货数据API调试工具 (")}{useEnvStore.getState().env}{t("环境)")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="test">{t("基础测试")}</TabsTrigger>
            <TabsTrigger value="add">{t("添加")}</TabsTrigger>
            <TabsTrigger value="update">{t("更新")}</TabsTrigger>
            <TabsTrigger value="delete">{t("删除")}</TabsTrigger>
            <TabsTrigger value="batch">{t("批量添加")}</TabsTrigger>
            <TabsTrigger value="logs">{t("请求日志")}</TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="space-y-4">
            <Button onClick={testShippingApiConnection} disabled={isLoading}>
              {isLoading ? "测试中..." : "测试发货数据API连接"}
            </Button>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="shipping-date">{t("日期")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !shippingDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {shippingDate ? format(shippingDate, "yyyy-MM-dd") : <span>{t("选择日期")}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={shippingDate} onSelect={setShippingDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="shipping-courier-id">{t("快递类型ID")}</Label>
                <Input
                  id="shipping-courier-id"
                  name="courier_id"
                  value={shippingFormData.courier_id}
                  onChange={handleShippingFormChange}
                  placeholder={t("输入快递类型ID")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="shipping-quantity">{t("数量")}</Label>
                <Input
                  id="shipping-quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={shippingFormData.quantity}
                  onChange={handleShippingFormChange}
                  placeholder={t("输入发货数量")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="shipping-notes">{t("备注")}</Label>
                <Textarea
                  id="shipping-notes"
                  name="notes"
                  value={shippingFormData.notes || ""}
                  onChange={handleShippingFormChange}
                  placeholder={t("可选备注信息")}
                />
              </div>

              <Button onClick={testAddShippingRecord} disabled={isLoading}>
                {isLoading ? "添加中..." : "测试添加发货记录"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="update" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="shipping-update-id">ID</Label>
                <Input
                  id="shipping-update-id"
                  name="id"
                  value={shippingUpdateFormData.id}
                  onChange={handleShippingUpdateFormChange}
                  placeholder={t("请输入要更新的发货记录ID")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="shipping-update-date">{t("日期")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !shippingUpdateFormData.date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {shippingUpdateFormData.date ? (
                        format(shippingUpdateFormData.date, "yyyy-MM-dd")
                      ) : (
                        <span>{t("选择日期")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={shippingUpdateFormData.date}
                      onSelect={(date) => setShippingUpdateFormData((prev) => ({ ...prev, date: date || new Date() }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="shipping-update-courier-id">{t("快递类型ID")}</Label>
                <Input
                  id="shipping-update-courier-id"
                  name="courier_id"
                  value={shippingUpdateFormData.courier_id}
                  onChange={handleShippingUpdateFormChange}
                  placeholder={t("输入快递类型ID")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="shipping-update-quantity">{t("数量")}</Label>
                <Input
                  id="shipping-update-quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={shippingUpdateFormData.quantity}
                  onChange={handleShippingUpdateFormChange}
                  placeholder={t("输入发货数量")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="shipping-update-notes">{t("备注")}</Label>
                <Textarea
                  id="shipping-update-notes"
                  name="notes"
                  value={shippingUpdateFormData.notes || ""}
                  onChange={handleShippingUpdateFormChange}
                  placeholder={t("可选备注信息")}
                />
              </div>

              <Button onClick={testUpdateShippingRecord} disabled={isLoading}>
                {isLoading ? "更新中..." : "测试更新发货记录"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="delete" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="shipping-delete-id">ID</Label>
                <Input
                  id="shipping-delete-id"
                  value={shippingDeleteId}
                  onChange={(e) => setShippingDeleteId(e.target.value)}
                  placeholder={t("请输入要删除的发货记录ID")}
                />
              </div>

              <Button onClick={testDeleteShippingRecord} disabled={isLoading} variant="destructive">
                {isLoading ? "删除中..." : "测试删除发货记录"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="shipping-batch-date">{t("日期")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !shippingDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {shippingDate ? format(shippingDate, "yyyy-MM-dd") : <span>{t("选择日期")}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={shippingDate} onSelect={setShippingDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="shipping-batch-data">{t("批量发货数据 (JSON格式)")}</Label>
                <Textarea
                  id="shipping-batch-data"
                  value={batchShippingData}
                  onChange={(e) => setBatchShippingData(e.target.value)}
                  placeholder='[{"courier_id": 1, "quantity": 10, "notes": ""}, {"courier_id": 2, "quantity": 20, "notes": ""}]'
                  rows={5}
                />
              </div>

              <Button onClick={testBatchAddShippingRecords} disabled={isLoading}>
                {isLoading ? "添加中..." : "测试批量添加发货记录"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={clearLogs}>{t("清除日志")}</Button>
            </div>

            <div className="border rounded-md p-4 max-h-[400px] overflow-auto">
              {requestLogs.length === 0 ? (
                <p className="text-center text-muted-foreground">{t("暂无日志记录")}</p>
              ) : (
                <div className="space-y-4">
                  {requestLogs.map((log, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{log.action}</div>
                        <div className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                      <div className="text-sm mt-1">
                        <span className={`px-2 py-1 rounded text-xs ${getMethodColor(log.method)}`}>{log.method}</span>
                        <span className="ml-2">{log.url}</span>
                      </div>
                      {log.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                          {log.error}
                        </div>
                      )}
                      {log.data && (
                        <details className="mt-2">
                          <summary className="text-sm cursor-pointer">{t("查看数据")}</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 p-4 border border-red-200 bg-red-50 text-red-800 rounded-md">
            <h3 className="font-semibold">{t("错误:")}</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 border border-green-200 bg-green-50 text-green-800 rounded-md">
            <h3 className="font-semibold">{t("成功:")}</h3>
            <p>{t("API请求成功")}</p>
            <details className="mt-2">
              <summary className="cursor-pointer">{t("查看响应详情")}</summary>
              <pre className="mt-2 p-2 bg-gray-100 overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>)
  );
}

// 根据HTTP方法返回不同的颜色类名
function getMethodColor(method: string) {
  switch (method.toUpperCase()) {
    case "GET":
      return "bg-blue-100 text-blue-800"
    case "POST":
      return "bg-green-100 text-green-800"
    case "PUT":
      return "bg-yellow-100 text-yellow-800"
    case "DELETE":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}
