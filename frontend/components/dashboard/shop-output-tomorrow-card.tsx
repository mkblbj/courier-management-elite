"use client";
import { useTranslation } from "react-i18next";
import { ShopOutputCard } from "./shop-output-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";

// 定义Shop类型
interface Shop {
      id: string;
      name: string;
      category: string;
      output: number;
}

// 定义Properties
interface ShopOutputTomorrowCardProps {
      title: string;
      data: Shop[];
      isLoading: boolean;
      onRefresh: () => void;
      confidenceScore?: number; // 预测置信度分数，0-100
}

export function ShopOutputTomorrowCard({
      title,
      data,
      isLoading,
      onRefresh,
      confidenceScore = 85  // 默认置信度
}: ShopOutputTomorrowCardProps) {
      const { t } = useTranslation();

      // 置信度等级
      const getConfidenceLevel = (score: number) => {
            if (score >= 90) return { text: t("很高"), color: "text-green-600" };
            if (score >= 75) return { text: t("较高"), color: "text-blue-600" };
            if (score >= 60) return { text: t("中等"), color: "text-amber-600" };
            return { text: t("较低"), color: "text-red-600" };
      };

      const confidenceLevel = getConfidenceLevel(confidenceScore);

      return (
            <div className="relative">
                  {/* 预测标识 */}
                  <div className="absolute -top-1 -right-1 z-10">
                        <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md border border-amber-200 text-xs flex items-center shadow-sm">
                              <CalendarClock className="h-3 w-3 mr-1" />
                              {t("预测数据")}
                        </div>
                  </div>

                  {/* 使用基础组件 */}
                  <div className="border-dashed border-2 border-amber-200 rounded-lg p-0.5">
                        <ShopOutputCard
                              title={title}
                              data={data}
                              isLoading={isLoading}
                              onRefresh={onRefresh}
                              isPrediction={true}
                        />

                        {/* 预测置信度信息 */}
                        {!isLoading && data && data.length > 0 && (
                              <div className="px-6 pb-4 flex items-center justify-end">
                                    <div className="flex items-center text-xs text-gray-500">
                                          <span className="mr-1">{t("预测置信度")}:</span>
                                          <span className={`font-medium ${confidenceLevel.color}`}>
                                                {confidenceScore}% ({confidenceLevel.text})
                                          </span>
                                    </div>
                              </div>
                        )}
                  </div>
            </div>
      );
} 