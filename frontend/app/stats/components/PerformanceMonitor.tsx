import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Clock, Database, Zap } from 'lucide-react';

interface PerformanceMetrics {
      loadTime: number;
      cacheHitRate: number;
      dataSize: number;
      renderTime: number;
      memoryUsage?: number;
}

interface PerformanceMonitorProps {
      metrics: PerformanceMetrics;
      isVisible?: boolean;
      onToggle?: () => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
      metrics,
      isVisible = false,
      onToggle
}) => {
      const [isExpanded, setIsExpanded] = useState(false);

      // 只在开发模式下显示
      const isDevelopment = process.env.NODE_ENV === 'development';

      if (!isDevelopment) {
            return null;
      }

      const formatTime = (ms: number) => {
            if (ms < 1000) return `${ms.toFixed(0)}ms`;
            return `${(ms / 1000).toFixed(2)}s`;
      };

      const formatSize = (bytes: number) => {
            if (bytes < 1024) return `${bytes}B`;
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
            return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
      };

      const getPerformanceLevel = (loadTime: number) => {
            if (loadTime < 500) return { level: 'excellent', color: 'bg-green-500' };
            if (loadTime < 1000) return { level: 'good', color: 'bg-blue-500' };
            if (loadTime < 2000) return { level: 'fair', color: 'bg-yellow-500' };
            return { level: 'poor', color: 'bg-red-500' };
      };

      if (!isVisible) {
            return (
                  <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggle}
                        className="fixed bottom-14 right-4 z-[60] shadow-lg"
                        title="性能监控 (仅开发模式)"
                  >
                        <Activity className="h-4 w-4 mr-2" />
                        性能监控
                  </Button>
            );
      }

      const performanceLevel = getPerformanceLevel(metrics.loadTime);

      return (
            <Card className="fixed bottom-20 right-4 z-[60] w-80 shadow-xl border-2 bg-background/95 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                              <div className="flex items-center">
                                    <Activity className="h-4 w-4 mr-2" />
                                    性能监控
                                    <Badge variant="secondary" className="ml-2 text-xs">DEV</Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className={`${performanceLevel.color} text-white`}>
                                          {performanceLevel.level}
                                    </Badge>
                                    <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setIsExpanded(!isExpanded)}
                                    >
                                          {isExpanded ? '收起' : '展开'}
                                    </Button>
                                    <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={onToggle}
                                    >
                                          ×
                                    </Button>
                              </div>
                        </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                        {/* 基础指标 */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-2 text-blue-500" />
                                    <span>加载时间: {formatTime(metrics.loadTime)}</span>
                              </div>
                              <div className="flex items-center">
                                    <Database className="h-3 w-3 mr-2 text-green-500" />
                                    <span>缓存命中: {metrics.cacheHitRate.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center">
                                    <Zap className="h-3 w-3 mr-2 text-yellow-500" />
                                    <span>渲染时间: {formatTime(metrics.renderTime)}</span>
                              </div>
                              <div className="flex items-center">
                                    <Activity className="h-3 w-3 mr-2 text-purple-500" />
                                    <span>数据大小: {formatSize(metrics.dataSize)}</span>
                              </div>
                        </div>

                        {/* 详细指标 */}
                        {isExpanded && (
                              <div className="space-y-2 pt-2 border-t">
                                    <div className="text-xs text-muted-foreground">详细指标</div>

                                    {/* 性能建议 */}
                                    <div className="space-y-1 text-xs">
                                          {metrics.loadTime > 2000 && (
                                                <div className="text-red-600">
                                                      • 加载时间较长，建议启用虚拟滚动或数据分页
                                                </div>
                                          )}
                                          {metrics.cacheHitRate < 50 && (
                                                <div className="text-yellow-600">
                                                      • 缓存命中率较低，建议优化缓存策略
                                                </div>
                                          )}
                                          {metrics.dataSize > 1024 * 1024 && (
                                                <div className="text-orange-600">
                                                      • 数据量较大，建议启用数据压缩或懒加载
                                                </div>
                                          )}
                                          {metrics.renderTime > 100 && (
                                                <div className="text-blue-600">
                                                      • 渲染时间较长，建议使用 React.memo 优化组件
                                                </div>
                                          )}
                                    </div>

                                    {/* 内存使用情况 */}
                                    {metrics.memoryUsage && (
                                          <div className="text-xs">
                                                内存使用: {formatSize(metrics.memoryUsage)}
                                          </div>
                                    )}
                              </div>
                        )}
                  </CardContent>
            </Card>
      );
};

export default PerformanceMonitor; 