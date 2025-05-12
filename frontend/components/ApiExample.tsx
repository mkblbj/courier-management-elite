'use client';

import { useEffect, useState } from 'react';
import { apiClient, isUsingProxy } from '@/services/api';
import { shippingApi } from '@/services/shipping-api';

interface ApiExampleProps {
      title?: string;
}

export default function ApiExample({ title = '代理API示例' }: ApiExampleProps) {
      const [data, setData] = useState<any>(null);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);

      // 使用API客户端或直接调用的示例
      const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                  // 使用apiClient实例
                  const response = await apiClient.get('/api/dashboard/shop-outputs/today');
                  setData(response);
            } catch (err) {
                  setError(err instanceof Error ? err.message : '请求失败');
                  console.error('API请求错误:', err);
            } finally {
                  setLoading(false);
            }
      };

      // 使用服务方法的示例
      const fetchShippingData = async () => {
            setLoading(true);
            setError(null);

            try {
                  // 使用shippingApi服务
                  const response = await shippingApi.getShippingListWithApiClient({
                        page: 1,
                        perPage: 10
                  });
                  setData(response);
            } catch (err) {
                  setError(err instanceof Error ? err.message : '请求失败');
                  console.error('API请求错误:', err);
            } finally {
                  setLoading(false);
            }
      };

      return (
            <div className="api-example p-4 border rounded-lg">
                  <h2 className="text-lg font-semibold mb-4">{title}</h2>

                  <div className="mb-4">
                        <p className="text-sm text-gray-600">
                              当前API模式: {isUsingProxy() ? '使用代理' : '直接请求'}
                        </p>
                  </div>

                  <div className="flex space-x-4 mb-4">
                        <button
                              onClick={fetchData}
                              disabled={loading}
                              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                              {loading ? '加载中...' : '请求仪表盘数据'}
                        </button>

                        <button
                              onClick={fetchShippingData}
                              disabled={loading}
                              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                        >
                              {loading ? '加载中...' : '请求快递数据'}
                        </button>
                  </div>

                  {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded mb-4">
                              错误: {error}
                        </div>
                  )}

                  {data && (
                        <div className="mt-4">
                              <h3 className="text-md font-medium mb-2">响应数据:</h3>
                              <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-96">
                                    {JSON.stringify(data, null, 2)}
                              </pre>
                        </div>
                  )}
            </div>
      );
} 