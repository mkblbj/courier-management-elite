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
      newErrors.name = "名称不能为空"
    } else if (formData.name.length > 50) {
      newErrors.name = "名称不能超过50个字符"
    } else if (existingCourierTypes.some((ct) => ct.name === formData.name && ct.id !== courierType?.id)) {
      newErrors.name = "该名称已存在，请使用其他名称"
    }

    // 代码验证
    if (!formData.code?.trim()) {
      newErrors.code = "代码不能为空"
    } else if (formData.code.length > 10) {
      newErrors.code = "代码不能超过10个字符"
    } else if (!/^[A-Za-z0-9]+$/.test(formData.code)) {
      newErrors.code = "代码只能包含字母和数字"
    } else if (existingCourierTypes.some((ct) => ct.code === formData.code && ct.id !== courierType?.id)) {
      newErrors.code = "该代码已存在，请使用其他代码"
    }

    // 备注验证
    if (formData.remark && formData.remark.length > 200) {
      newErrors.remark = "备注不能超过200个字符"
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
    setShowResetConfirm(true)
  }

  // 处理重置确认
  const handleResetConfirm = () => {
    resetForm()
  }

  // 处理重置取消
  const handleResetCancel = () => {
    setShowResetConfirm(false)
  }

  return (
    <>
      {/* 主对话框 */}
      <Dialog
        open={open}
        onOpenChange={(newOpen) => {
          if (!isSubmitting) {
            onOpenChange(newOpen)
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] animate-scale-in">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="animate-fade-in">{courierType ? "编辑快递类型" : "添加快递类型"}</DialogTitle>
              <DialogDescription className="animate-fade-in" style={{ animationDelay: "50ms" }}>
                填写以下信息来{courierType ? "更新" : "创建"}快递类型。
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* 名称字段 */}
              <div
                className="grid gap-2 transition-all duration-300"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(10px)",
                  transitionDelay: "100ms",
                }}
              >
                <Label htmlFor="name" className="flex items-center gap-1">
                  名称
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className={errors.name ? "border-red-500" : ""}
                  maxLength={50}
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-sm text-red-500 animate-fade-in">{errors.name}</p>}
                {!errors.name && <p className="text-xs text-muted-foreground">最多50个字符</p>}
              </div>

              {/* 代码字段 */}
              <div
                className="grid gap-2 transition-all duration-300"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(10px)",
                  transitionDelay: "150ms",
                }}
              >
                <Label htmlFor="code" className="flex items-center gap-1">
                  代码
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code || ""}
                  onChange={handleChange}
                  className={errors.code ? "border-red-500" : ""}
                  maxLength={10}
                  disabled={isSubmitting}
                />
                {errors.code && <p className="text-sm text-red-500 animate-fade-in">{errors.code}</p>}
                {!errors.code && <p className="text-xs text-muted-foreground">只能包含字母和数字，最多10个字符</p>}
              </div>

              {/* 备注字段 */}
              <div
                className="grid gap-2 transition-all duration-300"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(10px)",
                  transitionDelay: "200ms",
                }}
              >
                <Label htmlFor="remark">备注</Label>
                <Textarea
                  id="remark"
                  name="remark"
                  value={formData.remark || ""}
                  onChange={handleChange}
                  className={errors.remark ? "border-red-500" : ""}
                  placeholder="请输入备注信息（可选）"
                  rows={3}
                  maxLength={200}
                  disabled={isSubmitting}
                />
                {errors.remark && <p className="text-sm text-red-500 animate-fade-in">{errors.remark}</p>}
              </div>

              {/* 激活状态开关 */}
              <div
                className="flex items-center gap-2 transition-all duration-300"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(10px)",
                  transitionDelay: "250ms",
                }}
              >
                <Label htmlFor="is_active">激活状态</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={handleSwitchChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <DialogFooter
              className="transition-all duration-300"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(10px)",
                transitionDelay: "300ms",
              }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={handleResetClick}
                disabled={isSubmitting}
                className="transition-colors hover:bg-gray-100"
              >
                重置
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="transition-colors hover:bg-gray-100"
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 transition-colors hover:bg-blue-700">
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    保存中...
                  </>
                ) : (
                  "保存"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 重置确认对话框 - 完全独立于主对话框 */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle>确认重置表单</AlertDialogTitle>
            <AlertDialogDescription>您确定要重置表单吗？所有未保存的更改将会丢失。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleResetCancel}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetConfirm}
              className="bg-blue-600 transition-colors hover:bg-blue-700"
            >
              确认重置
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
