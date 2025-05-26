import React, { useState, useEffect, useCallback, useRef } from 'react';
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
      const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics>(metrics);
      const intervalRef = useRef<NodeJS.Timeout | null>(null);

      // 只在开发模式下显示
      const isDevelopment = process.env.NODE_ENV === 'development';

      // 更新性能指标
      useEffect(() => {
            setCurrentMetrics(metrics);
      }, [metrics]);

      // 定期更新内存使用情况（仅在可见时）
      useEffect(() => {
            if (isVisible && isDevelopment && typeof window !== 'undefined' && 'performance' in window) {
                  const updateMemoryUsage = () => {
                        try {
                              // @ts-ignore - performance.memory 在某些浏览器中可用
                              if (performance.memory) {
                                    // @ts-ignore
                                    const memoryInfo = performance.memory;
                                    setCurrentMetrics(prev => ({
                                          ...prev,
                                          memoryUsage: memoryInfo.usedJSHeapSize
                                    }));
                              }
                        } catch (error) {
                              console.warn('获取内存使用情况失败:', error);
                        }
                  };

                  // 立即更新一次
                  updateMemoryUsage();

                  // 设置定时器，每5秒更新一次
                  intervalRef.current = setInterval(updateMemoryUsage, 5000);

                  return () => {
                        if (intervalRef.current) {
                              clearInterval(intervalRef.current);
                              intervalRef.current = null;
                        }
                  };
            } else {
                  // 如果不可见，清理定时器
                  if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                  }
            }
      }, [isVisible, isDevelopment]);

      // 组件卸载时清理定时器
      useEffect(() => {
            return () => {
                  if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                  }
            };
      }, []);

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

      const getMemoryLevel = (memoryUsage: number) => {
            const memoryMB = memoryUsage / (1024 * 1024);
            // 更合理的内存等级阈值
            if (memoryMB < 200) return { level: 'low', color: 'bg-green-500' };
            if (memoryMB < 400) return { level: 'medium', color: 'bg-yellow-500' };
            if (memoryMB < 600) return { level: 'high', color: 'bg-orange-500' };
            return { level: 'critical', color: 'bg-red-500' };
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

      const performanceLevel = getPerformanceLevel(currentMetrics.loadTime);
      const memoryLevel = currentMetrics.memoryUsage ? getMemoryLevel(currentMetrics.memoryUsage) : null;

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
                                    {memoryLevel && (
                                          <Badge variant="outline" className={`${memoryLevel.color} text-white`}>
                                                {memoryLevel.level}
                                          </Badge>
                                    )}
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
                                    <span>加载时间: {formatTime(currentMetrics.loadTime)}</span>
                              </div>
                              <div className="flex items-center">
                                    <Database className="h-3 w-3 mr-2 text-green-500" />
                                    <span>缓存命中: {currentMetrics.cacheHitRate.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center">
                                    <Zap className="h-3 w-3 mr-2 text-yellow-500" />
                                    <span>渲染时间: {formatTime(currentMetrics.renderTime)}</span>
                              </div>
                              <div className="flex items-center">
                                    <Activity className="h-3 w-3 mr-2 text-purple-500" />
                                    <span>数据大小: {formatSize(currentMetrics.dataSize)}</span>
                              </div>
                        </div>

                        {/* 内存使用情况 */}
                        {currentMetrics.memoryUsage && (
                              <div className="bg-slate-50 rounded-lg p-2">
                                    <div className="text-xs text-muted-foreground mb-1">内存使用情况</div>
                                    <div className="text-sm font-medium">
                                          {formatSize(currentMetrics.memoryUsage)}
                                    </div>
                              </div>
                        )}

                        {/* 详细指标 */}
                        {isExpanded && (
                              <div className="space-y-2 pt-2 border-t">
                                    <div className="text-xs text-muted-foreground">性能建议</div>

                                    {/* 性能建议 */}
                                    <div className="space-y-1 text-xs">
                                          {currentMetrics.loadTime > 2000 && (
                                                <div className="text-red-600">
                                                      • 加载时间过长 ({formatTime(currentMetrics.loadTime)})，建议启用虚拟滚动或数据分页
                                                </div>
                                          )}
                                          {currentMetrics.cacheHitRate < 50 && (
                                                <div className="text-yellow-600">
                                                      • 缓存命中率较低 ({currentMetrics.cacheHitRate.toFixed(1)}%)，建议优化缓存策略
                                                </div>
                                          )}
                                          {currentMetrics.dataSize > 5 * 1024 * 1024 && (
                                                <div className="text-orange-600">
                                                      • 数据量较大 ({formatSize(currentMetrics.dataSize)})，建议启用数据压缩或懒加载
                                                </div>
                                          )}
                                          {currentMetrics.renderTime > 100 && (
                                                <div className="text-blue-600">
                                                      • 渲染时间较长 ({formatTime(currentMetrics.renderTime)})，建议使用 React.memo 优化组件
                                                </div>
                                          )}
                                          {currentMetrics.memoryUsage && currentMetrics.memoryUsage > 600 * 1024 * 1024 && (
                                                <div className="text-red-600">
                                                      • 内存使用过高 ({formatSize(currentMetrics.memoryUsage)})，建议清理缓存或重新加载页面
                                                </div>
                                          )}
                                          {currentMetrics.memoryUsage && currentMetrics.memoryUsage > 400 * 1024 * 1024 && currentMetrics.memoryUsage <= 600 * 1024 * 1024 && (
                                                <div className="text-yellow-600">
                                                      • 内存使用较高 ({formatSize(currentMetrics.memoryUsage)})，建议定期清理缓存
                                                </div>
                                          )}
                                    </div>

                                    {/* 优化建议 */}
                                    <div className="bg-blue-50 rounded-lg p-2 mt-2">
                                          <div className="text-xs text-blue-800 font-medium mb-1">优化建议</div>
                                          <div className="text-xs text-blue-700 space-y-1">
                                                <div>• 定期清理缓存以释放内存</div>
                                                <div>• 使用虚拟滚动处理大数据集</div>
                                                <div>• 启用数据懒加载和分页</div>
                                                <div>• 避免在组件中创建大对象</div>
                                          </div>
                                    </div>
                              </div>
                        )}
                  </CardContent>
            </Card>
      );
};

export default PerformanceMonitor; 