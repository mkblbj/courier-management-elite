"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft } from 'lucide-react';

const CategoryDetailPage = () => {
      const params = useParams();
      const router = useRouter();
      const categoryId = params.id as string;
      const [isLoading, setIsLoading] = useState(true);
      const [categoryData, setCategoryData] = useState<{
            id: string;
            name: string;
            shops: {
                  id: number;
                  name: string;
                  total_quantity: number;
                  percentage: number;
            }[];
            total_quantity: number;
      } | null>(null);

      useEffect(() => {
            // 这里可以从API获取数据
            // 目前使用模拟数据
            const fetchCategoryDetail = async () => {
                  setIsLoading(true);
                  try {
                        // 模拟API请求延迟
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        // 模拟数据
                        setCategoryData({
                              id: categoryId,
                              name: `类别 ${categoryId}`,
                              shops: [
                                    { id: 1, name: '东京旗舰店', total_quantity: 156, percentage: 45 },
                                    { id: 2, name: '大阪分店', total_quantity: 98, percentage: 28 },
                                    { id: 3, name: '名古屋分店', total_quantity: 94, percentage: 27 },
                              ],
                              total_quantity: 348
                        });
                  } catch (error) {
                        console.error('获取类别详情失败:', error);
                  } finally {
                        setIsLoading(false);
                  }
            };

            fetchCategoryDetail();
      }, [categoryId]);

      const handleBack = () => {
            router.back();
      };

      return (
            <div className="container mx-auto py-8 space-y-6">
                  <PageHeader
                        title={isLoading ? '加载中...' : `${categoryData?.name} - 详细统计`}
                        description="按店铺查看该类别的详细出力数据"
                        action={
                              <Button variant="outline" onClick={handleBack}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    返回
                              </Button>
                        }
                  />

                  {isLoading ? (
                        <div className="flex justify-center items-center h-60">
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                  ) : (
                        <>
                              <Card>
                                    <CardHeader>
                                          <CardTitle className="text-lg">店铺出力统计</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                          <div className="border rounded-md">
                                                <Table>
                                                      <TableHeader>
                                                            <TableRow>
                                                                  <TableHead>店铺名称</TableHead>
                                                                  <TableHead className="text-right">出力量</TableHead>
                                                                  <TableHead className="text-right">占比</TableHead>
                                                            </TableRow>
                                                      </TableHeader>
                                                      <TableBody>
                                                            {categoryData?.shops.map((shop) => (
                                                                  <TableRow key={shop.id}>
                                                                        <TableCell>{shop.name}</TableCell>
                                                                        <TableCell className="text-right font-medium">{shop.total_quantity}</TableCell>
                                                                        <TableCell className="text-right">{shop.percentage}%</TableCell>
                                                                  </TableRow>
                                                            ))}
                                                            <TableRow>
                                                                  <TableCell className="font-bold">总计</TableCell>
                                                                  <TableCell className="text-right font-bold">{categoryData?.total_quantity}</TableCell>
                                                                  <TableCell className="text-right font-bold">100%</TableCell>
                                                            </TableRow>
                                                      </TableBody>
                                                </Table>
                                          </div>
                                    </CardContent>
                              </Card>
                        </>
                  )}
            </div>
      );
};

export default CategoryDetailPage; 