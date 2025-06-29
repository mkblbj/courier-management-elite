"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subtractShopOutput, mergeShopOutput, getOperationStats } from "@/lib/api/shop-output";
import { toast } from "@/components/ui/use-toast";

export default function TestPage() {
      const [loading, setLoading] = useState(false);
      const [stats, setStats] = useState<any>(null);

      const testSubtract = async () => {
            setLoading(true);
            try {
                  const result = await subtractShopOutput({
                        shop_id: 1,
                        courier_id: 1,
                        output_date: "2024-12-27",
                        quantity: 5,
                        notes: "前端测试减少操作"
                  });
                  console.log("减少操作结果:", result);
                  toast({
                        title: "测试成功",
                        description: "减少操作API调用成功",
                  });
            } catch (error) {
                  console.error("减少操作失败:", error);
                  toast({
                        title: "测试失败",
                        description: String(error),
                        variant: "destructive",
                  });
            } finally {
                  setLoading(false);
            }
      };

      const testMerge = async () => {
            setLoading(true);
            try {
                  const result = await mergeShopOutput({
                        shop_id: 1,
                        courier_id: 1,
                        output_date: "2024-12-27",
                        quantity: 8,
                        merge_note: "前端测试合单操作"
                  });
                  console.log("合单操作结果:", result);
                  toast({
                        title: "测试成功",
                        description: "合单操作API调用成功",
                  });
            } catch (error) {
                  console.error("合单操作失败:", error);
                  toast({
                        title: "测试失败",
                        description: String(error),
                        variant: "destructive",
                  });
            } finally {
                  setLoading(false);
            }
      };

      const testStats = async () => {
            setLoading(true);
            try {
                  const result = await getOperationStats({
                        date_from: "2024-12-27",
                        date_to: "2024-12-27"
                  });
                  console.log("统计数据结果:", result);
                  setStats(result);
                  toast({
                        title: "测试成功",
                        description: "统计数据API调用成功",
                  });
            } catch (error) {
                  console.error("统计数据失败:", error);
                  toast({
                        title: "测试失败",
                        description: String(error),
                        variant: "destructive",
                  });
            } finally {
                  setLoading(false);
            }
      };

      return (
            <div className="container mx-auto px-4 py-6">
                  <h1 className="text-2xl font-bold mb-6">API功能测试</h1>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Button onClick={testSubtract} disabled={loading} className="bg-red-600 hover:bg-red-700">
                              测试减少操作
                        </Button>
                        <Button onClick={testMerge} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                              测试合单操作
                        </Button>
                        <Button onClick={testStats} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                              测试统计数据
                        </Button>
                  </div>

                  {stats && (
                        <Card>
                              <CardHeader>
                                    <CardTitle>统计数据结果</CardTitle>
                              </CardHeader>
                              <CardContent>
                                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                                          {JSON.stringify(stats, null, 2)}
                                    </pre>
                              </CardContent>
                        </Card>
                  )}
            </div>
      );
} 