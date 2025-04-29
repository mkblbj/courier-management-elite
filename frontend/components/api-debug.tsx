"use client";
import { useTranslation } from "react-i18next";

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/services/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useEnvStore } from "@/lib/env-config"

export function ApiDebug() {
  const {
    t: t
  } = useTranslation();

  // 使用useEnvStore钩子获取最新状态
  const { debug } = useEnvStore()

  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [requestLogs, setRequestLogs] = useState<any[]>([])
  const [selectedTab, setSelectedTab] = useState("courier")
  const [selectedCourierTab, setSelectedCourierTab] = useState("test")

  // 快递类型相关表单状态
  const [addFormData, setAddFormData] = useState({
    name: "测试快递",
    code: "TEST",
    remark: "这是一个测试快递类型",
    is_active: true,
  })

  const [updateFormData, setUpdateFormData] = useState({
    id: "",
    name: "",
    code: "",
    remark: "",
    is_active: true,
  })

  const [deleteId, setDeleteId] = useState("")
  const [toggleId, setToggleId] = useState("")
  const [sortData, setSortData] = useState("")

  // 在开发模式下且debug为true时才显示API调试工具
  // 添加NODE_ENV检查，确保在生产环境中不显示
  if (!debug || process.env.NODE_ENV === "production") {
    return null
  }

  // 快递类型API测试函数
  const testApiConnection = async () => {
    const {
      t: t
    } = useTranslation();

    setIsLoading(true)
    setError(null)
    addLog(t("测试API连接"), "GET", "/api/couriers")

    try {
      const response = await api.getCourierTypes()
      setResult(response)
      addLog(t("API响应"), "GET", "/api/couriers", response)
      console.log("API响应:", response)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "API连接测试失败"
      setError(errorMessage)
      addLog(t("API错误"), "GET", "/api/couriers", null, errorMessage)
      console.error("API连接测试失败:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const testAddCourier = async () => {
    const {
      t: t
    } = useTranslation();

    setIsLoading(true)
    setError(null)
    addLog(t("添加快递类型"), "POST", "/api/couriers", addFormData)

    try {
      const response = await api.createCourierType(addFormData)
      setResult(response)
      addLog(t("API响应"), "POST", "/api/couriers", response)
      console.log("添加成功:", response)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "添加快递类型失败"
      setError(errorMessage)
      addLog(t("API错误"), "POST", "/api/couriers", null, errorMessage)
      console.error("添加快递类型失败:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const testUpdateCourier = async () => {
    const {
      t: t
    } = useTranslation();

    if (!updateFormData.id) {
      setError(t("请输入要更新的快递类型ID"))
      return
    }

    setIsLoading(true)
    setError(null)
    addLog(t("更新快递类型"), "PUT", `/api/couriers/${updateFormData.id}`, updateFormData)

    try {
      const { id, ...data } = updateFormData
      const response = await api.updateCourierType(id, data)
      setResult(response)
      addLog(t("API响应"), "PUT", `/api/couriers/${id}`, response)
      console.log("更新成功:", response)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "更新快递类型失败"
      setError(errorMessage)
      addLog(t("API错误"), "PUT", `/api/couriers/${updateFormData.id}`, null, errorMessage)
      console.error("更新快递类型失败:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const testDeleteCourier = async () => {
    const {
      t: t
    } = useTranslation();

    if (!deleteId) {
      setError(t("请输入要删除的快递类型ID"))
      return
    }

    setIsLoading(true)
    setError(null)
    addLog(t("删除快递类型"), "DELETE", `/api/couriers/${deleteId}`)

    try {
      await api.deleteCourierType(deleteId)
      setResult({ message: "删除成功" })
      addLog("API响应", "DELETE", `/api/couriers/${deleteId}`, { message: "删除成功" })
      console.log("删除成功")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "删除快递类型失败"
      setError(errorMessage)
      addLog("API错误", "DELETE", `/api/couriers/${deleteId}`, null, errorMessage)
      console.error("删除快递类型失败:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const testToggleStatus = async () => {
    const {
      t: t
    } = useTranslation();

    if (!toggleId) {
      setError(t("请输入要切换状态的快递类型ID"))
      return
    }

    setIsLoading(true)
    setError(null)
    addLog(t("切换快递类型状态"), "PUT", `/api/couriers/${toggleId}/toggle`)

    try {
      const response = await api.toggleCourierTypeStatus(toggleId)
      setResult(response)
      addLog("API响应", "PUT", `/api/couriers/${toggleId}/toggle`, response)
      console.log("状态切换成功:", response)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "切换快递类型状态失败"
      setError(errorMessage)
      addLog("API错误", "PUT", `/api/couriers/${toggleId}/toggle`, null, errorMessage)
      console.error("切换快递类型状态失败:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const testUpdateSort = async () => {
    const {
      t: t
    } = useTranslation();

    if (!sortData) {
      setError(t("请输入排序数据"))
      return
    }

    let parsedData
    try {
      parsedData = JSON.parse(sortData)
      if (!Array.isArray(parsedData)) {
        setError(t("排序数据必须是数组格式"))
        return
      }
    } catch (err) {
      setError(t("排序数据格式错误，请输入有效的JSON数组"))
      return
    }

    setIsLoading(true)
    setError(null)
    addLog(t("更新快递类型排序"), "POST", "/api/couriers/sort", parsedData)

    try {
      await api.updateCourierTypesOrder(parsedData)
      setResult({ message: "排序更新成功" })
      addLog("API响应", "POST", "/api/couriers/sort", { message: "排序更新成功" })
      console.log("排序更新成功")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "更新快递类型排序失败"
      setError(errorMessage)
      addLog("API错误", "POST", "/api/couriers/sort", null, errorMessage)
      console.error("更新快递类型排序失败:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const addLog = (action: string, method: string, url: string, data?: any, error?: string) => {
    const {
      t: t
    } = useTranslation();

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

  const clearLogs = () => {
    const {
      t: t
    } = useTranslation();

    setRequestLogs([])
  }

  const handleAddFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      t: t
    } = useTranslation();

    const { name, value } = e.target
    setAddFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddFormSwitchChange = (checked: boolean) => {
    const {
      t: t
    } = useTranslation();

    setAddFormData((prev) => ({ ...prev, is_active: checked }))
  }

  const handleUpdateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      t: t
    } = useTranslation();

    const { name, value } = e.target
    setUpdateFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpdateFormSwitchChange = (checked: boolean) => {
    const {
      t: t
    } = useTranslation();

    setUpdateFormData((prev) => ({ ...prev, is_active: checked }))
  }

  return (
    (<Card className="mt-4">
      <CardHeader>
        <CardTitle>{t("API调试工具 (")}{process.env.NODE_ENV !== "production" ? "开发" : "生产"}{t("环境)")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="courier">{t("快递类型API")}</TabsTrigger>
            <TabsTrigger value="logs">{t("请求日志")}</TabsTrigger>
          </TabsList>

          <TabsContent value="courier">
            <Tabs value={selectedCourierTab} onValueChange={setSelectedCourierTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="test">{t("基础测试")}</TabsTrigger>
                <TabsTrigger value="add">{t("添加")}</TabsTrigger>
                <TabsTrigger value="update">{t("更新")}</TabsTrigger>
                <TabsTrigger value="delete">{t("删除")}</TabsTrigger>
                <TabsTrigger value="toggle">{t("状态切换")}</TabsTrigger>
                <TabsTrigger value="sort">{t("排序")}</TabsTrigger>
              </TabsList>

              <TabsContent value="test" className="space-y-4">
                <Button onClick={testApiConnection} disabled={isLoading}>
                  {isLoading ? "测试中..." : "测试API连接"}
                </Button>
              </TabsContent>

              <TabsContent value="add" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="add-name">{t("名称")}</Label>
                    <Input id="add-name" name="name" value={addFormData.name} onChange={handleAddFormChange} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="add-code">{t("代码")}</Label>
                    <Input id="add-code" name="code" value={addFormData.code} onChange={handleAddFormChange} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="add-remark">{t("备注")}</Label>
                    <Textarea
                      id="add-remark"
                      name="remark"
                      value={addFormData.remark || ""}
                      onChange={handleAddFormChange}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor="add-is_active">{t("激活状态")}</Label>
                    <Switch
                      id="add-is_active"
                      checked={addFormData.is_active}
                      onCheckedChange={handleAddFormSwitchChange}
                    />
                  </div>

                  <Button onClick={testAddCourier} disabled={isLoading}>
                    {isLoading ? "添加中..." : "测试添加快递类型"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="update" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="update-id">ID</Label>
                    <Input
                      id="update-id"
                      name="id"
                      value={updateFormData.id}
                      onChange={handleUpdateFormChange}
                      placeholder={t("请输入要更新的快递类型ID")}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="update-name">{t("名称")}</Label>
                    <Input id="update-name" name="name" value={updateFormData.name} onChange={handleUpdateFormChange} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="update-code">{t("代码")}</Label>
                    <Input id="update-code" name="code" value={updateFormData.code} onChange={handleUpdateFormChange} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="update-remark">{t("备注")}</Label>
                    <Textarea
                      id="update-remark"
                      name="remark"
                      value={updateFormData.remark || ""}
                      onChange={handleUpdateFormChange}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor="update-is_active">{t("激活状态")}</Label>
                    <Switch
                      id="update-is_active"
                      checked={updateFormData.is_active}
                      onChange={handleUpdateFormSwitchChange}
                    />
                  </div>

                  <Button onClick={testUpdateCourier} disabled={isLoading}>
                    {isLoading ? "更新中..." : "测试更新快递类型"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="delete" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="delete-id">ID</Label>
                    <Input
                      id="delete-id"
                      value={deleteId}
                      onChange={(e) => setDeleteId(e.target.value)}
                      placeholder={t("请输入要删除的快递类型ID")}
                    />
                  </div>

                  <Button onClick={testDeleteCourier} disabled={isLoading} variant="destructive">
                    {isLoading ? "删除中..." : "测试删除快递类型"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="toggle" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="toggle-id">ID</Label>
                    <Input
                      id="toggle-id"
                      value={toggleId}
                      onChange={(e) => setToggleId(e.target.value)}
                      placeholder={t("请输入要切换状态的快递类型ID")}
                    />
                  </div>

                  <Button onClick={testToggleStatus} disabled={isLoading}>
                    {isLoading ? "切换中..." : "测试切换状态"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="sort" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sort-data">{t("排序数据 (JSON格式)")}</Label>
                    <Textarea
                      id="sort-data"
                      value={sortData}
                      onChange={(e) => setSortData(e.target.value)}
                      placeholder='[{"id": 1, "sort_order": 1}, {"id": 2, "sort_order": 2}]'
                      rows={5}
                    />
                  </div>

                  <Button onClick={testUpdateSort} disabled={isLoading}>
                    {isLoading ? "更新中..." : "测试更新排序"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
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
  const {
    t: t
  } = useTranslation();

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
