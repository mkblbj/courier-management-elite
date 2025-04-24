"use client"

import { useEffect } from "react"
import { useEnvStore } from "@/lib/env-config"

export function EnvInitializer() {
  useEffect(() => {
    // 在组件挂载时重新初始化环境配置
    // 这确保了在客户端渲染时能够获取到正确的环境变量
    const env = process.env.NODE_ENV === "production" ? "production" : "development"
    useEnvStore.getState().setEnvironment(env)

    console.log("环境初始化完成:", {
      env: useEnvStore.getState().env,
      apiBaseUrl: useEnvStore.getState().apiBaseUrl,
      nodeEnv: process.env.NODE_ENV,
      apiEnvVar: process.env.NEXT_PUBLIC_API_BASE_URL,
    })
  }, [])

  return null
}
