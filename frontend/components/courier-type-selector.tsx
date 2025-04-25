"use client"

import { useState, useEffect } from "react"
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import { api, type CourierType } from "@/services/api"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CourierTypeSelectorProps {
  value?: string | number
  onChange: (value: string | number | undefined) => void
  placeholder?: string
  className?: string
}

export function CourierTypeSelector({ 
  value, 
  onChange, 
  placeholder = "选择快递类型",
  className
}: CourierTypeSelectorProps) {
  const [courierTypes, setCourierTypes] = useState<CourierType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourierTypes = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // 只获取启用状态的快递类型
        const types = await api.getCourierTypes({ active_only: true })
        // 再次过滤，确保只保留激活的快递类型
        const activeTypes = types.filter(type => Boolean(type.is_active))
        setCourierTypes(activeTypes)
      } catch (err) {
        console.error("获取快递类型失败:", err)
        setError(err instanceof Error ? err.message : "获取快递类型失败")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourierTypes()
  }, [])

  const handleValueChange = (newValue: string) => {
    // 处理"所有"情况
    if (newValue === "all") {
      onChange(undefined)
    } else {
      onChange(newValue)
    }
  }

  return (
    <Select value={value?.toString() || "all"} onValueChange={handleValueChange}>
      <SelectTrigger className={cn("w-[180px]", className)}>
        {isLoading ? (
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>加载中...</span>
          </div>
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">所有快递类型</SelectItem>
          {courierTypes.map((type) => (
            <SelectItem key={type.id} value={type.id.toString()}>
              {type.name}
            </SelectItem>
          ))}
        </SelectGroup>
        {error && <div className="p-2 text-sm text-red-500">{error}</div>}
      </SelectContent>
    </Select>
  )
} 