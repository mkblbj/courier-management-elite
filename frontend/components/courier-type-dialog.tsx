"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { CourierType } from "@/services/api"
import { useTranslation } from "react-i18next"

interface CourierTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courierType: CourierType | null
  onSave: (courierType: {
    name: string
    code: string
    remark?: string
    is_active: boolean
  }) => void
  existingCourierTypes: CourierType[]
}

export function CourierTypeDialog({
  open,
  onOpenChange,
  courierType,
  onSave,
  existingCourierTypes,
}: CourierTypeDialogProps) {
  const { t } = useTranslation(['common', 'courier'])
  
  // 表单数据状态
  const [formData, setFormData] = useState<{
    name: string
    code: string
    remark?: string
    is_active: boolean
  }>({
    name: "",
    code: "",
    remark: "",
    is_active: true,
  })

  // 其他状态
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // 当对话框打开或关闭时设置可见性
  useEffect(() => {
    if (open) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [open])

  // 当courierType或open状态变化时重置表单
  useEffect(() => {
    if (open) {
      if (courierType) {
        setFormData({
          name: courierType.name,
          code: courierType.code,
          remark: courierType.remark || "",
          is_active: Boolean(courierType.is_active),
        })
      } else {
        setFormData({
          name: "",
          code: "",
          remark: "",
          is_active: true,
        })
      }
      setErrors({})
      setIsSubmitting(false)
    }
  }, [courierType, open])

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // 清除错误
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // 处理开关变化
  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: checked }))
  }

  // 重置表单函数
  const resetForm = () => {
    if (courierType) {
      setFormData({
        name: courierType.name,
        code: courierType.code,
        remark: courierType.remark || "",
        is_active: Boolean(courierType.is_active),
      })
    } else {
      setFormData({
        name: "",
        code: "",
        remark: "",
        is_active: true,
      })
    }
    setErrors({})
    // 关闭重置确认对话框
    setShowResetConfirm(false)
  }

  // 表单验证
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 名称验证
    if (!formData.name?.trim()) {
      newErrors.name = t('courier:courier_name_required')
    } else if (formData.name.length > 50) {
      newErrors.name = t('courier:name_too_long')
    } else if (existingCourierTypes.some((ct) => ct.name === formData.name && ct.id !== courierType?.id)) {
      newErrors.name = t('courier:name_already_exists')
    }

    // 代码验证
    if (!formData.code?.trim()) {
      newErrors.code = t('courier:courier_code_required')
    } else if (formData.code.length > 10) {
      newErrors.code = t('courier:code_too_long')
    } else if (!/^[A-Za-z0-9]+$/.test(formData.code)) {
      newErrors.code = t('courier:code_format_invalid')
    } else if (existingCourierTypes.some((ct) => ct.code === formData.code && ct.id !== courierType?.id)) {
      newErrors.code = t('courier:code_already_exists')
    }

    // 备注验证
    if (formData.remark && formData.remark.length > 200) {
      newErrors.remark = t('courier:remark_too_long')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate() || isSubmitting) return

    try {
      setIsSubmitting(true)
      console.log("提交表单数据:", formData)
      await onSave({
        name: formData.name,
        code: formData.code,
        remark: formData.remark,
        is_active: formData.is_active,
      })
    } catch (error) {
      console.error("保存失败:", error)
      // 错误已在父组件处理
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理重置按钮点击
  const handleResetClick = () => {
    // 检查表单是否有更改
    const hasChanges =
      courierType &&
      (formData.name !== courierType.name ||
        formData.code !== courierType.code ||
        formData.remark !== (courierType.remark || "") ||
        Boolean(formData.is_active) !== Boolean(courierType.is_active))

    // 如果有更改或是新建记录（没有courierType），则显示确认对话框
    if (hasChanges || !courierType) {
      setShowResetConfirm(true)
    }
  }

  // 确认重置表单
  const handleResetConfirm = () => {
    resetForm()
  }

  // 取消重置表单
  const handleResetCancel = () => {
    setShowResetConfirm(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {courierType ? t('courier:edit_courier') : t('courier:add_courier')}
            </DialogTitle>
            <DialogDescription>
              {courierType
                ? t('courier:edit_courier_description')
                : t('courier:add_courier_description')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4 py-2">
              {/* 快递公司名称 */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('courier:courier_name')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('courier:enter_courier_name')}
                  className={errors.name ? "border-red-500" : ""}
                  disabled={isSubmitting}
                  maxLength={50}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>

              {/* 快递公司代码 */}
              <div className="space-y-2">
                <Label htmlFor="code">
                  {t('courier:courier_code')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder={t('courier:enter_courier_code')}
                  className={errors.code ? "border-red-500" : ""}
                  disabled={isSubmitting}
                  maxLength={10}
                />
                {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
                <p className="text-xs text-muted-foreground">
                  {t('courier:code_description')}
                </p>
              </div>

              {/* 备注信息 */}
              <div className="space-y-2">
                <Label htmlFor="remark">{t('courier:remark')}</Label>
                <Textarea
                  id="remark"
                  name="remark"
                  value={formData.remark}
                  onChange={handleChange}
                  placeholder={t('courier:enter_remark')}
                  className={errors.remark ? "border-red-500" : ""}
                  disabled={isSubmitting}
                  maxLength={200}
                />
                {errors.remark && <p className="text-red-500 text-sm">{errors.remark}</p>}
              </div>

              {/* 启用状态 */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={handleSwitchChange}
                  disabled={isSubmitting}
                />
                <Label htmlFor="is_active">{t('courier:courier_status_active')}</Label>
              </div>
            </div>

            <DialogFooter className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetClick}
                disabled={isSubmitting}
              >
                {t('common:reset')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('common:cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common:saving') : t('common:save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 重置确认对话框 */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:confirm_reset')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common:reset_warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleResetCancel}>
              {t('common:cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm}>
              {t('common:confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
