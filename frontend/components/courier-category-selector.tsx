"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
} from "@/components/ui/select"
import { api, type CourierCategory } from "@/services/api"
import { useTranslation } from "react-i18next"

interface CourierCategorySelectorProps {
      value?: string | number
      onChange: (value: string | number | undefined) => void
      label?: string
      placeholder?: string
      disabled?: boolean
      required?: boolean
}

export function CourierCategorySelector({
      value,
      onChange,
      label,
      placeholder,
      disabled = false,
      required = false,
}: CourierCategorySelectorProps) {
      const { t } = useTranslation(["common", "courier"])
      const [categories, setCategories] = useState<CourierCategory[]>([])
      const [isLoading, setIsLoading] = useState(false)

      // 获取类别列表
      useEffect(() => {
            const fetchCategories = async () => {
                  setIsLoading(true)
                  try {
                        const data = await api.getCourierCategories()
                        setCategories(data)
                  } catch (error) {
                        console.error("获取快递类别失败:", error)
                  } finally {
                        setIsLoading(false)
                  }
            }

            fetchCategories()
      }, [])

      // 处理选择变更
      const handleChange = (selectedValue: string) => {
            if (selectedValue === "none") {
                  onChange(undefined)
            } else {
                  onChange(selectedValue)
            }
      }

      return (
            <div className="space-y-2">
                  {label && <Label>{label}</Label>}
                  <Select
                        value={value?.toString() || "none"}
                        onValueChange={handleChange}
                        disabled={disabled || isLoading}
                  >
                        <SelectTrigger>
                              <SelectValue placeholder={placeholder || t("courier:select_category")} />
                        </SelectTrigger>
                        <SelectContent>
                              {!required && <SelectItem value="none">{t("courier:no_category")}</SelectItem>}
                              {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                          {category.name}
                                    </SelectItem>
                              ))}
                              {isLoading && <SelectItem value="loading" disabled>{t("common:loading")}</SelectItem>}
                              {!isLoading && categories.length === 0 && (
                                    <SelectItem value="empty" disabled>{t("courier:no_categories_available")}</SelectItem>
                              )}
                        </SelectContent>
                  </Select>
            </div>
      )
} 