import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 获取环境变量
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const USE_API_PROXY = process.env.NEXT_PUBLIC_USE_API_PROXY === 'true';

/**
 * 中间件函数，处理请求拦截和代理
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只处理API代理路径
  if (pathname.startsWith('/api/proxy') && USE_API_PROXY) {
    // 从路径中提取实际的API路径 (/api/proxy/xxx -> /xxx)
    const apiPath = pathname.replace('/api/proxy', '');

    // 创建目标URL
    const targetUrl = new URL(apiPath, API_BASE_URL);

    // 保留原始查询参数
    const searchParams = request.nextUrl.searchParams;
    searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });

    // 创建代理请求选项
    const requestHeaders = new Headers(request.headers);
    
    // 移除一些可能导致问题的头部
    requestHeaders.delete('host');

    // 创建代理请求
    const requestInit: RequestInit = {
      method: request.method,
      headers: requestHeaders,
      body: request.body,
      redirect: 'follow',
      // 传递cookies
      credentials: 'include',
    };

    // 返回重写的请求，转发到实际的API服务器
    return NextResponse.rewrite(targetUrl, requestInit);
  }

  // 对于非API代理请求，返回原始响应
  return NextResponse.next();
}

/**
 * 配置匹配的路径
 */
export const config = {
  // 只匹配 /api/proxy 路径下的请求
  matcher: '/api/proxy/:path*',
}; 