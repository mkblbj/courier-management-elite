"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ScanInputAreaProps = {
  isActive: boolean
  lastError?: string | null
  onSubmitScan: (value: string) => Promise<void>
}

export function ScanInputArea({ isActive, lastError, onSubmitScan }: ScanInputAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [buffer, setBuffer] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [manualInput, setManualInput] = useState("")

  useEffect(() => {
    if (!isActive) return

    inputRef.current?.focus()
    const timer = window.setInterval(() => {
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus()
      }
      setIsFocused(document.activeElement === inputRef.current)
    }, 500)

    return () => window.clearInterval(timer)
  }, [isActive])

  const submitValue = async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    await onSubmitScan(trimmed)
    setBuffer("")
    setManualInput("")
    inputRef.current?.focus()
  }

  return (
    <Card className={cn(isActive ? "border-green-500" : "border-muted", lastError && "border-red-500")}>
      <CardContent className="space-y-4 pt-6">
        <input
          ref={inputRef}
          value={buffer}
          onChange={(event) => setBuffer(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              submitValue(buffer)
            }
          }}
          className="sr-only"
          disabled={!isActive}
          aria-label="扫码枪输入"
        />

        <div className="rounded-lg border p-4 text-center">
          <div className={cn("text-2xl font-bold", isActive ? "text-green-700" : "text-muted-foreground")}>
            {isActive ? "扫码枪接收中" : "未开始计数"}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {isActive ? "请扫描运单号条形码，扫描后会自动保存" : "请选择快递类型后点击开始计数"}
          </div>
          {isActive && !isFocused && (
            <div className="mt-2 text-sm text-red-600">输入焦点丢失，正在自动恢复</div>
          )}
          {lastError && <div className="mt-2 text-sm font-medium text-red-600">{lastError}</div>}
        </div>

        <div className="flex gap-2">
          <Input
            value={manualInput}
            onChange={(event) => setManualInput(event.target.value)}
            placeholder="手动输入运单号"
            disabled={!isActive}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submitValue(manualInput)
              }
            }}
          />
          <Button type="button" variant="outline" disabled={!isActive || !manualInput.trim()} onClick={() => submitValue(manualInput)}>
            手动提交
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
