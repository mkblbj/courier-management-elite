// 环境配置工具
import { create } from "zustand"

// 环境类型
export type Environment = "development" | "production" | "test"

// 环境配置接口
export interface EnvConfig {
  apiBaseUrl: string
  env: Environment
  isDev: boolean
  isProd: boolean
  isTest: boolean
  debug: boolean
}

// 获取当前环境
function getEnvironment(): Environment {
  // 从环境变量获取环境
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === "production") return "production"
  if (nodeEnv === "test") return "test"
  return "development"
}

// 创建环境配置
function createEnvConfig(env: Environment = getEnvironment()): EnvConfig {
  const isDev = env === "development"
  const isProd = env === "production"
  const isTest = env === "test"

  // 从环境变量获取API基础URL
  // 确保始终使用当前环境的API URL，而不是缓存的值
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (isProd ? process.env.NEXT_PUBLIC_PROD_API_URL || "" : process.env.NEXT_PUBLIC_DEV_API_URL || "")

  // 检查API URL是否有效
  if (!apiBaseUrl) {
    console.warn(
      `API基础URL未设置。请在环境变量中设置NEXT_PUBLIC_API_BASE_URL或对应环境的NEXT_PUBLIC_${env.toUpperCase()}_API_URL。`,
    )
  }

  // 调试模式只在开发环境启用
  const debug = isDev && process.env.NODE_ENV !== "production"

  return {
    apiBaseUrl,
    env,
    isDev,
    isProd,
    isTest,
    debug,
  }
}

// 创建环境配置存储
interface EnvStore extends EnvConfig {
  setEnvironment: (env: Environment) => void
  resetToDefault: () => void
}

export const useEnvStore = create<EnvStore>((set) => {
  // 初始化时根据当前NODE_ENV创建配置
  const defaultConfig = createEnvConfig(getEnvironment())

  return {
    ...defaultConfig,
    setEnvironment: (env: Environment) => {
      // 确保在生产环境中不能启用调试模式
      if (process.env.NODE_ENV === "production") {
        set(() => {
          const config = createEnvConfig(env)
          return { ...config, debug: false }
        })
      } else {
        set(() => createEnvConfig(env))
      }
    },
    resetToDefault: () => set(() => createEnvConfig(getEnvironment())),
  }
})

// 导出环境配置 (兼容旧代码)
export const envConfig = useEnvStore.getState()

// 调试日志函数 - 只在调试模式下输出
export function debugLog(...args: any[]): void {
  if (useEnvStore.getState().debug && process.env.NODE_ENV !== "production") {
    console.log("[DEBUG]", ...args)
  }
}

// 调试错误日志函数 - 只在调试模式下输出
export function debugError(...args: any[]): void {
  if (useEnvStore.getState().debug && process.env.NODE_ENV !== "production") {
    console.error("[ERROR]", ...args)
  }
}

// 调试警告日志函数 - 只在调试模式下输出
export function debugWarn(...args: any[]): void {
  if (useEnvStore.getState().debug && process.env.NODE_ENV !== "production") {
    console.warn("[WARN]", ...args)
  }
}
