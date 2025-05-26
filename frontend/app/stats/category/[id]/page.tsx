"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, AlertCircle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CategoryStatsItem } from '@/lib/types/stats';
import { getBaseApiUrl } from '@/services/api';
import { debugLog, debugError } from '@/lib/env-config';
import { statsCache, CacheKeyGenerator } from '@/lib/cache/stats-cache';

interface ShopDistribution {
      shop_id: number;
      shop_name: string;
      total_quantity: number;
      percentage: number;
}

interface CategoryDetailData extends CategoryStatsItem {
      days_count?: number;
      shop_distribution?: ShopDistribution[];
}

// API响应格式
interface ApiResponse<T> {
      code: number;
      message: string;
      data: T;
}

// 统一的API调用函数
const apiCall = async (endpoint: string): Promise<any> => {
      const url = `${getBaseApiUrl()}${endpoint}`;

      debugLog(`API请求: GET ${url}`);

      try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(url, {
                  method: 'GET',
                  headers: {
                        'Content-Type': 'application/json',
                  },
                  signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                  const errorText = await response.text();
                  debugError(`API响应错误: ${response.status} ${response.statusText}`, errorText);
                  throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }

            const result: ApiResponse<any> = await response.json();

            debugLog(`API响应: GET ${url}`, result);

            if (result.code === 0 && result.data !== undefined && result.data !== null) {
                  return result.data;
            }

            throw new Error(result.message || 'API请求失败');
      } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                  throw new Error('请求超时，请稍后重试');
            }
            debugError(`API请求失败 [${endpoint}]:`, error);
            throw error;
      }
};

const CategoryDetailPage = () => {
      const params = useParams();
      const router = useRouter();
      const { t } = useTranslation("stats");
      const categoryId = params.id as string;

      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [categoryData, setCategoryData] = useState<CategoryDetailData | null>(null);
      const [retryCount, setRetryCount] = useState(0);

      const fetchCategoryDetail = async () => {
            setIsLoading(true);
            setError(null);

            try {
                  debugLog(`开始获取类别详情: categoryId=${categoryId}`);

                  // 生成缓存键
                  const cacheKey = CacheKeyGenerator.generateStatsKey('category_detail', { categoryId });

                  // 尝试从缓存获取
                  const cachedData = statsCache.get<CategoryDetailData>(cacheKey);
                  if (cachedData) {
                        debugLog('从缓存获取类别详情数据:', cachedData);
                        setCategoryData(cachedData);
                        setIsLoading(false);
                        return;
                  }

                  // 并行获取所有需要的数据
                  const [categoryInfo, statsData, shopStatsData] = await Promise.all([
                        apiCall(`/api/courier-categories/${categoryId}`),
                        apiCall(`/api/courier-categories/${categoryId}/stats`),
                        apiCall(`/api/stats/shop-outputs/shops?category_id=${categoryId}`)
                  ]);

                  debugLog('获取到的数据:', { categoryInfo, statsData, shopStatsData });

                  // 组合数据
                  const combinedData: CategoryDetailData = {
                        category_id: categoryInfo.id,
                        category_name: categoryInfo.name,
                        total_quantity: statsData.total_quantity || 0,
                        shops_count: shopStatsData.length || 0,
                        days_count: 30, // 可以根据实际需求调整
                        mom_change_rate: 0,
                        mom_change_type: 'unchanged',
                        yoy_change_rate: 0,
                        yoy_change_type: 'unchanged',
                        percentage: 0,
                        shop_distribution: shopStatsData.map((shop: any) => ({
                              shop_id: shop.shop_id,
                              shop_name: shop.shop_name,
                              total_quantity: shop.total_quantity,
                              percentage: shop.percentage || 0
                        }))
                  };

                  // 存储到缓存
                  statsCache.set(cacheKey, combinedData);
                  setCategoryData(combinedData);
                  setRetryCount(0); // 重置重试计数
                  debugLog('类别详情数据设置成功:', combinedData);
            } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : t('common.fetchError');
                  debugError('获取类别详情失败:', error);
                  setError(errorMessage);
            } finally {
                  setIsLoading(false);
            }
      };

      useEffect(() => {
            if (categoryId) {
                  fetchCategoryDetail();
            }
      }, [categoryId]);

      const handleBack = () => {
            router.back();
      };

      const handleRetry = () => {
            setRetryCount(prev => prev + 1);
            fetchCategoryDetail();
      };

      const formatChangeRate = (rate: number, type: string) => {
            if (type === 'unchanged' || rate === 0) return t('common.noChange');
            const prefix = rate > 0 ? '+' : '';
            return `${prefix}${rate.toFixed(1)}%`;
      };

      const getChangeIcon = (type: string) => {
            switch (type) {
                  case 'increase':
                        return <TrendingUp className="h-4 w-4 text-green-600" />;
                  case 'decrease':
                        return <TrendingDown className="h-4 w-4 text-red-600" />;
                  default:
                        return null;
            }
      };

      const getChangeBadgeVariant = (type: string): "default" | "destructive" | "secondary" => {
            switch (type) {
                  case 'increase':
                        return 'default';
                  case 'decrease':
                        return 'destructive';
                  default:
                        return 'secondary';
            }
      };

      return (
            <div className="container mx-auto py-8 space-y-6">
                  <PageHeader
                        title={isLoading ? t('common.loading') : `${categoryData?.category_name} - ${t('category.detailStats')}`}
                        description={t('category.detailDescription')}
                        action={
                              <div className="flex items-center gap-2">
                                    {error && (
                                          <Button variant="outline" onClick={handleRetry} disabled={isLoading}>
                                                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                                {t('common.retry')}
                                          </Button>
                                    )}
                                    <Button variant="outline" onClick={handleBack}>
                                          <ArrowLeft className="mr-2 h-4 w-4" />
                                          {t('common.back')}
                                    </Button>
                              </div>
                        }
                  />

                  {isLoading ? (
                        <div className="flex justify-center items-center h-60">
                              <div className="text-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                                    <p className="text-muted-foreground">{t('common.loading')}...</p>
                                    {retryCount > 0 && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                                {t('重试次数')}: {retryCount}
                                          </p>
                                    )}
                              </div>
                        </div>
                  ) : error ? (
                        <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                    <div className="flex items-center justify-between">
                                          <span>{error}</span>
                                          <Button variant="outline" size="sm" onClick={handleRetry} className="ml-2">
                                                <RefreshCw className="h-4 w-4 mr-1" />
                                                {t('common.retry')}
                                          </Button>
                                    </div>
                              </AlertDescription>
                        </Alert>
                  ) : categoryData ? (
                        <>
                              {/* 统计概览 */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Card>
                                          <CardContent className="p-6">
                                                <div className="text-center">
                                                      <div className="text-2xl font-bold text-primary">
                                                            {categoryData.total_quantity.toLocaleString()}
                                                      </div>
                                                      <div className="text-sm text-muted-foreground">{t('stats.totalQuantity')}</div>
                                                </div>
                                          </CardContent>
                                    </Card>

                                    <Card>
                                          <CardContent className="p-6">
                                                <div className="text-center">
                                                      <div className="text-2xl font-bold">
                                                            {categoryData.shops_count}
                                                      </div>
                                                      <div className="text-sm text-muted-foreground">{t('stats.activeShops')}</div>
                                                </div>
                                          </CardContent>
                                    </Card>

                                    <Card>
                                          <CardContent className="p-6">
                                                <div className="text-center">
                                                      <div className="flex items-center justify-center gap-2">
                                                            {getChangeIcon(categoryData.mom_change_type)}
                                                            <Badge variant={getChangeBadgeVariant(categoryData.mom_change_type)}>
                                                                  {formatChangeRate(categoryData.mom_change_rate, categoryData.mom_change_type)}
                                                            </Badge>
                                                      </div>
                                                      <div className="text-sm text-muted-foreground mt-1">{t('stats.momChange')}</div>
                                                </div>
                                          </CardContent>
                                    </Card>

                                    <Card>
                                          <CardContent className="p-6">
                                                <div className="text-center">
                                                      <div className="flex items-center justify-center gap-2">
                                                            {getChangeIcon(categoryData.yoy_change_type)}
                                                            <Badge variant={getChangeBadgeVariant(categoryData.yoy_change_type)}>
                                                                  {formatChangeRate(categoryData.yoy_change_rate, categoryData.yoy_change_type)}
                                                            </Badge>
                                                      </div>
                                                      <div className="text-sm text-muted-foreground mt-1">{t('stats.yoyChange')}</div>
                                                </div>
                                          </CardContent>
                                    </Card>
                              </div>

                              {/* 店铺详细统计 */}
                              <Card>
                                    <CardHeader>
                                          <CardTitle className="text-lg">{t('category.shopOutputStats')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                          <div className="border rounded-md">
                                                <Table>
                                                      <TableHeader>
                                                            <TableRow>
                                                                  <TableHead>{t('shop.name')}</TableHead>
                                                                  <TableHead className="text-right">{t('stats.outputQuantity')}</TableHead>
                                                                  <TableHead className="text-right">{t('stats.percentage')}</TableHead>
                                                            </TableRow>
                                                      </TableHeader>
                                                      <TableBody>
                                                            {categoryData.shop_distribution?.map((shop) => (
                                                                  <TableRow key={shop.shop_id}>
                                                                        <TableCell className="font-medium">{shop.shop_name}</TableCell>
                                                                        <TableCell className="text-right font-mono">
                                                                              {shop.total_quantity.toLocaleString()}
                                                                        </TableCell>
                                                                        <TableCell className="text-right">
                                                                              {shop.percentage.toFixed(1)}%
                                                                        </TableCell>
                                                                  </TableRow>
                                                            ))}
                                                            {categoryData.shop_distribution && categoryData.shop_distribution.length > 0 && (
                                                                  <TableRow className="border-t-2">
                                                                        <TableCell className="font-bold">{t('common.total')}</TableCell>
                                                                        <TableCell className="text-right font-bold font-mono">
                                                                              {categoryData.total_quantity.toLocaleString()}
                                                                        </TableCell>
                                                                        <TableCell className="text-right font-bold">100.0%</TableCell>
                                                                  </TableRow>
                                                            )}
                                                      </TableBody>
                                                </Table>

                                                {(!categoryData.shop_distribution || categoryData.shop_distribution.length === 0) && (
                                                      <div className="text-center py-8 text-muted-foreground">
                                                            {t('common.noData')}
                                                      </div>
                                                )}
                                          </div>
                                    </CardContent>
                              </Card>
                        </>
                  ) : (
                        <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{t('category.notFound')}</AlertDescription>
                        </Alert>
                  )}
            </div>
      );
};

export default CategoryDetailPage; 