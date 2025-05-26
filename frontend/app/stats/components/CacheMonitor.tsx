import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Database, Trash2, RefreshCw, TrendingUp, Clock, HardDrive } from 'lucide-react';
import { statsCache } from '@/lib/cache/stats-cache';

interface CacheMonitorProps {
      isVisible?: boolean;
      onToggle?: () => void;
}

const CacheMonitor: React.FC<CacheMonitorProps> = ({
      isVisible = false,
      onToggle
}) => {
      const [stats, setStats] = useState<any>(null);
      const [isExpanded, setIsExpanded] = useState(false);
      const intervalRef = useRef<NodeJS.Timeout | null>(null);

      // 只在开发模式下显示
      const isDevelopment = process.env.NODE_ENV === 'development';

      useEffect(() => {
            if (isVisible && isDevelopment) {
                  const updateStats = () => {
                        try {
                              const cacheStats = statsCache.getStats();
                              setStats(cacheStats);
                        } catch (error) {
                              console.warn('获取缓存统计失败:', error);
                        }
                  };

                  // 立即更新一次
                  updateStats();

                  // 设置定时器
                  intervalRef.current = setInterval(updateStats, 3000); // 改为3秒更新一次，减少频率

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

      const formatSize = (bytes: number) => {
            if (bytes < 1024) return `${bytes}B`;
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
            return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
      };

      const formatTime = (ms: number) => {
            if (ms < 1000) return `${ms}ms`;
            return `${(ms / 1000).toFixed(1)}s`;
      };

      const handleClearCache = () => {
            try {
                  statsCache.clear();
                  setStats(statsCache.getStats());
            } catch (error) {
                  console.warn('清空缓存失败:', error);
            }
      };

      const handleCleanup = () => {
            try {
                  statsCache.cleanup();
                  setStats(statsCache.getStats());
            } catch (error) {
                  console.warn('清理缓存失败:', error);
            }
      };

      if (!isVisible) {
            return (
                  <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggle}
                        className="fixed bottom-4 right-4 z-[60] shadow-lg"
                        title="缓存监控 (仅开发模式)"
                  >
                        <Database className="h-4 w-4 mr-2" />
                        缓存监控
                  </Button>
            );
      }

      if (!stats) {
            return (
                  <Card className="fixed bottom-10 right-4 z-[60] w-80 shadow-xl border-2 bg-background/95 backdrop-blur-sm">
                        <CardContent className="p-4">
                              <div className="flex items-center justify-center">
                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                    加载缓存统计...
                              </div>
                        </CardContent>
                  </Card>
            );
      }

      const usagePercentage = (stats.totalEntries / stats.maxSize) * 100;
      const memoryUsagePercentage = stats.memoryUsagePercent || 0;
      const hitRateColor = stats.hitRate > 80 ? 'bg-green-500' : stats.hitRate > 50 ? 'bg-yellow-500' : 'bg-red-500';

      return (
            <Card className="fixed bottom-10 right-4 z-[60] w-80 shadow-xl border-2 bg-background/95 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                              <div className="flex items-center">
                                    <Database className="h-4 w-4 mr-2" />
                                    缓存监控
                                    <Badge variant="secondary" className="ml-2 text-xs">DEV</Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className={`${hitRateColor} text-white`}>
                                          {stats.hitRate.toFixed(1)}%
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
                                    <Database className="h-3 w-3 mr-2 text-blue-500" />
                                    <span>缓存条目: {stats.totalEntries}/{stats.maxSize}</span>
                              </div>
                              <div className="flex items-center">
                                    <TrendingUp className="h-3 w-3 mr-2 text-green-500" />
                                    <span>命中率: {stats.hitRate.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center">
                                    <HardDrive className="h-3 w-3 mr-2 text-purple-500" />
                                    <span>大小: {formatSize(stats.totalSize)}</span>
                              </div>
                              <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-2 text-orange-500" />
                                    <span>TTL: {formatTime(stats.ttl)}</span>
                              </div>
                        </div>

                        {/* 使用率进度条 */}
                        <div className="space-y-2">
                              <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                          <span>缓存使用率</span>
                                          <span>{usagePercentage.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={usagePercentage} className="h-2" />
                              </div>

                              {/* 内存使用率进度条 */}
                              <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                          <span>内存使用率</span>
                                          <span>{memoryUsagePercentage.toFixed(1)}%</span>
                                    </div>
                                    <Progress
                                          value={memoryUsagePercentage}
                                          className={`h-2 ${memoryUsagePercentage > 80 ? 'bg-red-100' : memoryUsagePercentage > 60 ? 'bg-yellow-100' : 'bg-green-100'}`}
                                    />
                              </div>
                        </div>

                        {/* 详细指标 */}
                        {isExpanded && (
                              <div className="space-y-2 pt-2 border-t">
                                    <div className="text-xs text-muted-foreground">详细统计</div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div>有效缓存: {stats.hitCount}</div>
                                          <div>过期缓存: {stats.expiredCount}</div>
                                          <div>内存限制: {formatSize(stats.maxMemorySize)}</div>
                                          <div>内存使用: {formatSize(stats.totalSize)}</div>
                                    </div>

                                    {/* 操作按钮 */}
                                    <div className="flex gap-2 pt-2">
                                          <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCleanup}
                                                className="flex-1 text-xs"
                                          >
                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                清理过期
                                          </Button>
                                          <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleClearCache}
                                                className="flex-1 text-xs"
                                          >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                清空缓存
                                          </Button>
                                    </div>

                                    {/* 性能建议 */}
                                    <div className="space-y-1 text-xs">
                                          {stats.hitRate < 50 && (
                                                <div className="text-yellow-600">
                                                      • 缓存命中率较低，考虑调整缓存策略
                                                </div>
                                          )}
                                          {usagePercentage > 90 && (
                                                <div className="text-red-600">
                                                      • 缓存使用率过高，建议增加缓存大小或清理
                                                </div>
                                          )}
                                          {memoryUsagePercentage > 80 && (
                                                <div className="text-red-600">
                                                      • 内存使用率过高，建议立即清理缓存
                                                </div>
                                          )}
                                          {stats.totalSize > 20 * 1024 * 1024 && (
                                                <div className="text-orange-600">
                                                      • 缓存占用内存较大，建议定期清理
                                                </div>
                                          )}
                                          {stats.expiredCount > stats.hitCount && (
                                                <div className="text-blue-600">
                                                      • 过期缓存较多，建议执行清理操作
                                                </div>
                                          )}
                                    </div>
                              </div>
                        )}
                  </CardContent>
            </Card>
      );
};

export default CacheMonitor; 