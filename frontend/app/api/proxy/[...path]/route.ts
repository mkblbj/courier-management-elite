import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * 代理所有API请求到后端服务
 */
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params, 'POST');
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params, 'PUT');
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params, 'DELETE');
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleRequest(request, params, 'PATCH');
}

/**
 * 通用请求处理函数
 */
async function handleRequest(
  request: NextRequest, 
  { path }: { path: string[] }, 
  method: string
): Promise<NextResponse> {
  try {
    // 从URL参数中获取API路径
    const apiPath = path.join('/');
    
    // 构建后端API的完整URL
    const apiUrl = new URL(`/api/${apiPath}`, API_BASE_URL);
    
    // 保留原始的查询参数
    const searchParams = request.nextUrl.searchParams;
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.append(key, value);
    });

    // 创建请求头
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // 排除一些头信息
      if (!['host', 'connection'].includes(key.toLowerCase())) {
        headers.append(key, value);
      }
    });

    // 获取请求体 (如果有)
    let body = null;
    if (method !== 'GET' && method !== 'HEAD') {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = await request.json();
      } else if (contentType?.includes('multipart/form-data')) {
        body = await request.formData();
      } else {
        body = await request.text();
      }
    }

    console.log(`代理${method}请求到: ${apiUrl.toString()}`);

    // 执行请求
    const response = await fetch(apiUrl.toString(), {
      method,
      headers,
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null,
      redirect: 'follow',
    });

    // 创建响应头
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.append(key, value);
    });

    // 获取响应数据
    const responseData = await response.json();

    // 返回响应
    return NextResponse.json(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('API代理错误:', error);
    return NextResponse.json(
      {
        code: -1,
        message: '服务器代理请求失败',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 