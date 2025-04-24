// 网络连接测试工具

/**
 * 测试API连接
 * @param url 要测试的URL
 * @returns 测试结果对象
 */
export async function testApiConnection(url: string): Promise<{
  success: boolean
  status?: number
  statusText?: string
  responseTime: number
  error?: string
}> {
  const startTime = performance.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      mode: "cors",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const endTime = performance.now()

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime: endTime - startTime,
    }
  } catch (error) {
    const endTime = performance.now()

    return {
      success: false,
      responseTime: endTime - startTime,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * 测试网络连接
 * @returns 测试结果对象
 */
export async function testNetworkConnection(): Promise<{
  online: boolean
  latency?: number
}> {
  if (typeof navigator !== "undefined" && "onLine" in navigator) {
    if (!navigator.onLine) {
      return { online: false }
    }
  }

  try {
    const startTime = performance.now()
    await fetch("https://www.google.com/favicon.ico", {
      mode: "no-cors",
      cache: "no-cache",
    })
    const endTime = performance.now()

    return {
      online: true,
      latency: endTime - startTime,
    }
  } catch (error) {
    return { online: false }
  }
}

/**
 * 测试DNS解析
 * @param hostname 要解析的主机名
 * @returns 测试结果对象
 */
export async function testDnsResolution(hostname: string): Promise<{
  success: boolean
  responseTime: number
  error?: string
}> {
  const startTime = performance.now()

  try {
    // 由于浏览器无法直接进行DNS解析，我们通过尝试加载一个小资源来测试
    const url = `https://${hostname}/favicon.ico`
    await fetch(url, {
      mode: "no-cors",
      cache: "no-cache",
    })

    const endTime = performance.now()
    return {
      success: true,
      responseTime: endTime - startTime,
    }
  } catch (error) {
    const endTime = performance.now()
    return {
      success: false,
      responseTime: endTime - startTime,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * 运行完整的网络诊断
 * @param apiBaseUrl API基础URL
 * @returns 诊断结果对象
 */
export async function runNetworkDiagnostics(apiBaseUrl: string): Promise<{
  networkStatus: {
    online: boolean
    latency?: number
  }
  apiConnection: {
    success: boolean
    status?: number
    statusText?: string
    responseTime: number
    error?: string
  }
  dnsResolution?: {
    success: boolean
    responseTime: number
    error?: string
  }
}> {
  const networkStatus = await testNetworkConnection()

  if (!networkStatus.online) {
    return {
      networkStatus,
      apiConnection: {
        success: false,
        responseTime: 0,
        error: "网络离线",
      },
    }
  }

  const apiConnection = await testApiConnection(apiBaseUrl)

  let dnsResolution
  try {
    const url = new URL(apiBaseUrl)
    dnsResolution = await testDnsResolution(url.hostname)
  } catch (error) {
    // URL解析失败，跳过DNS测试
  }

  return {
    networkStatus,
    apiConnection,
    dnsResolution,
  }
}
