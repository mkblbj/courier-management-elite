import { NextRequest, NextResponse } from 'next/server';

/**
 * 从环境变量获取内部API地址
 * 这会在服务器端执行，可以访问非NEXT_PUBLIC_前缀的环境变量
 */
function getInternalApiUrl(): string {
  // 优先使用INTERNAL_API_URL，如果未设置则尝试使用NEXT_PUBLIC_API_BASE_URL
  let apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
  
  if (!apiUrl) {
    console.error('[API Proxy] 错误: 未设置API环境变量，请在.env文件中配置INTERNAL_API_URL或NEXT_PUBLIC_API_BASE_URL');
  }
  
  return apiUrl;
}

/**
 * API代理路由 - 将请求转发到内部HTTP API
 * 解决HTTPS前端访问HTTP API的混合内容问题
 */
export async function GET(
  request: NextRequest,
  context: { params: { path: string | string[] } }
) {
  try {
    // 先获取path参数的值
    const paramsObj = await context.params;
    const pathValue = paramsObj.path;
    
    // 然后处理pathArray
    const pathArray = Array.isArray(pathValue) 
      ? pathValue 
      : [pathValue];
    
    // 构建API URL
    const path = pathArray.join('/');
    
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    
    // 内部API服务器地址 - 从环境变量获取
    const apiBaseUrl = getInternalApiUrl();
    if (!apiBaseUrl) {
      throw new Error('未配置内部API地址，请检查环境变量');
    }
    
    // 避免路径中出现重复的/api/
    const apiPath = path.startsWith('api/') ? path : `api/${path}`;
    const apiUrl = `${apiBaseUrl}/${apiPath}${queryString}`;
    
    console.log(`[API Proxy] 转发GET请求到: ${apiUrl}`);
    
    // 发送请求
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // 获取响应数据
    const data = await response.json();
    
    // 返回结果
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[API Proxy] 错误:`, error);
    return NextResponse.json(
      { code: 500, message: '代理请求失败', error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * 处理POST请求
 */
export async function POST(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  try {
    // 正确处理动态路由参数 - 在Next.js新版本中
    const pathArray = Array.isArray(context.params.path) 
      ? context.params.path 
      : [context.params.path];
    
    // 构建API URL
    const path = pathArray.join('/');
    
    // 获取请求体
    const body = await request.json();
    
    // 内部API服务器地址 - 从环境变量获取
    const apiBaseUrl = getInternalApiUrl();
    if (!apiBaseUrl) {
      throw new Error('未配置内部API地址，请检查环境变量');
    }
    
    // 避免路径中出现重复的/api/
    const apiPath = path.startsWith('api/') ? path : `api/${path}`;
    const apiUrl = `${apiBaseUrl}/${apiPath}`;
    
    console.log(`[API Proxy] 转发POST请求到: ${apiUrl}`);
    
    // 发送请求
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // 获取响应数据
    const data = await response.json();
    
    // 返回结果
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[API Proxy] 错误:`, error);
    return NextResponse.json(
      { code: 500, message: '代理请求失败', error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * 处理PUT请求
 */
export async function PUT(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  try {
    // 正确处理动态路由参数 - 在Next.js新版本中
    const pathArray = Array.isArray(context.params.path) 
      ? context.params.path 
      : [context.params.path];
    
    // 构建API URL
    const path = pathArray.join('/');
    
    // 获取请求体
    const body = await request.json();
    
    // 内部API服务器地址 - 从环境变量获取
    const apiBaseUrl = getInternalApiUrl();
    if (!apiBaseUrl) {
      throw new Error('未配置内部API地址，请检查环境变量');
    }
    
    // 避免路径中出现重复的/api/
    const apiPath = path.startsWith('api/') ? path : `api/${path}`;
    const apiUrl = `${apiBaseUrl}/${apiPath}`;
    
    console.log(`[API Proxy] 转发PUT请求到: ${apiUrl}`);
    
    // 发送请求
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // 获取响应数据
    const data = await response.json();
    
    // 返回结果
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[API Proxy] 错误:`, error);
    return NextResponse.json(
      { code: 500, message: '代理请求失败', error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * 处理DELETE请求
 */
export async function DELETE(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  try {
    // 正确处理动态路由参数 - 在Next.js新版本中
    const pathArray = Array.isArray(context.params.path) 
      ? context.params.path 
      : [context.params.path];
    
    // 构建API URL
    const path = pathArray.join('/');
    
    // 内部API服务器地址 - 从环境变量获取
    const apiBaseUrl = getInternalApiUrl();
    if (!apiBaseUrl) {
      throw new Error('未配置内部API地址，请检查环境变量');
    }
    
    // 避免路径中出现重复的/api/
    const apiPath = path.startsWith('api/') ? path : `api/${path}`;
    const apiUrl = `${apiBaseUrl}/${apiPath}`;
    
    console.log(`[API Proxy] 转发DELETE请求到: ${apiUrl}`);
    
    // 发送请求
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // 获取响应数据
    const data = await response.json();
    
    // 返回结果
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[API Proxy] 错误:`, error);
    return NextResponse.json(
      { code: 500, message: '代理请求失败', error: (error as Error).message },
      { status: 500 }
    );
  }
} 