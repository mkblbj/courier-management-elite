// 全局统计数据缓存服务 - 优化版本
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
  accessCount: number;
  lastAccessed: number;
  size: number; // 添加数据大小字段
}

interface CacheConfig {
  ttl: number; // 缓存生存时间（毫秒）
  maxSize: number; // 最大缓存条目数
  maxMemorySize: number; // 最大内存使用量（字节）
  enablePersistence: boolean; // 是否启用持久化
  storageKey: string; // localStorage 键名
  autoCleanupInterval: number; // 自动清理间隔（毫秒）
}

class StatsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private accessOrder: string[] = []; // LRU 访问顺序
  private currentMemorySize = 0; // 当前内存使用量
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: 3 * 60 * 1000, // 减少到3分钟
      maxSize: 50, // 减少到50个缓存项
      maxMemorySize: 50 * 1024 * 1024, // 50MB内存限制
      enablePersistence: false, // 默认关闭持久化以减少内存使用
      storageKey: 'stats_cache',
      autoCleanupInterval: 60 * 1000, // 1分钟清理一次
      ...config
    };

    // 启动自动清理
    this.startAutoCleanup();

    // 从 localStorage 恢复缓存（仅在启用时）
    if (this.config.enablePersistence && typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  /**
   * 启动自动清理定时器
   */
  private startAutoCleanup(): void {
    if (typeof window !== 'undefined') {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
        this.enforceMemoryLimit();
      }, this.config.autoCleanupInterval);
    }
  }

  /**
   * 停止自动清理定时器
   */
  public stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 计算数据大小
   */
  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // 估算字符串的字节大小
    } catch {
      return 1024; // 默认1KB
    }
  }

  /**
   * 强制执行内存限制
   */
  private enforceMemoryLimit(): void {
    while (this.currentMemorySize > this.config.maxMemorySize && this.cache.size > 0) {
      this.evictLRU();
    }
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T): void {
    const now = Date.now();
    const dataSize = this.calculateSize(data);
    
    // 检查单个数据是否超过内存限制的50%
    if (dataSize > this.config.maxMemorySize * 0.5) {
      console.warn(`数据过大，跳过缓存: ${key}, 大小: ${dataSize} bytes`);
      return;
    }

    // 如果是更新现有缓存，先移除旧的大小
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.currentMemorySize -= existingEntry.size;
    }

    // 确保有足够空间
    while ((this.currentMemorySize + dataSize > this.config.maxMemorySize || 
            this.cache.size >= this.config.maxSize) && 
           this.cache.size > 0 && 
           !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      key,
      accessCount: 1,
      lastAccessed: now,
      size: dataSize
    };

    this.cache.set(key, entry);
    this.currentMemorySize += dataSize;
    this.updateAccessOrder(key);
    
    // 持久化到 localStorage（仅在启用时）
    if (this.config.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    
    // 检查是否过期
    if (now - entry.timestamp > this.config.ttl) {
      this.delete(key);
      return null;
    }

    // 更新访问信息
    entry.accessCount++;
    entry.lastAccessed = now;
    this.updateAccessOrder(key);

    return entry.data;
  }

  /**
   * 删除单个缓存项
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.currentMemorySize -= entry.size;
    this.removeFromAccessOrder(key);
    
    if (this.config.enablePersistence) {
      this.saveToStorage();
    }
    
    return true;
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.currentMemorySize = 0;
    if (this.config.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * 按模式清除缓存
   */
  clearByPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const now = Date.now();
    let hitCount = 0;
    let expiredCount = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.config.ttl) {
        expiredCount++;
      } else {
        hitCount++;
      }
    }

    return {
      totalEntries: this.cache.size,
      hitCount,
      expiredCount,
      totalSize: this.currentMemorySize,
      maxSize: this.config.maxSize,
      maxMemorySize: this.config.maxMemorySize,
      memoryUsagePercent: (this.currentMemorySize / this.config.maxMemorySize) * 100,
      ttl: this.config.ttl,
      hitRate: this.cache.size > 0 ? (hitCount / this.cache.size) * 100 : 0
    };
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.config.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * LRU 淘汰策略
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const lruKey = this.accessOrder[0];
    this.delete(lruKey);
  }

  /**
   * 更新访问顺序
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * 从访问顺序中移除
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * 从 localStorage 加载缓存
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (!stored) return;

      const data = JSON.parse(stored);
      const now = Date.now();

      // 只加载未过期的数据
      for (const [key, entry] of Object.entries(data)) {
        const cacheEntry = entry as CacheEntry<any>;
        if (now - cacheEntry.timestamp <= this.config.ttl) {
          // 重新计算大小
          cacheEntry.size = this.calculateSize(cacheEntry.data);
          this.cache.set(key, cacheEntry);
          this.currentMemorySize += cacheEntry.size;
          this.accessOrder.push(key);
        }
      }

      // 确保不超过内存限制
      this.enforceMemoryLimit();
    } catch (error) {
      console.warn('加载缓存失败:', error);
      // 清除损坏的缓存
      localStorage.removeItem(this.config.storageKey);
    }
  }

  /**
   * 保存缓存到 localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data: Record<string, CacheEntry<any>> = {};
      for (const [key, entry] of this.cache) {
        data[key] = entry;
      }
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('保存缓存失败:', error);
      // 如果存储失败，禁用持久化
      this.config.enablePersistence = false;
    }
  }

  /**
   * 销毁缓存实例
   */
  destroy(): void {
    this.stopAutoCleanup();
    this.clear();
  }
}

// 缓存键生成器
export class CacheKeyGenerator {
  static generateStatsKey(
    dimension: string,
    params: Record<string, any>
  ): string {
    // 创建一个稳定的键，忽略undefined值
    const cleanParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    
    return `stats_${dimension}_${cleanParams}`;
  }

  static generateFilterKey(filters: Record<string, any>): string {
    const cleanFilters = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${Array.isArray(value) ? value.join(',') : value}`)
      .join('|');
    
    return `filter_${cleanFilters}`;
  }
}

// 缓存装饰器
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // 尝试从缓存获取
    const cached = statsCache.get(key);
    if (cached) {
      return cached;
    }
    
    // 执行函数并缓存结果
    const result = await fn(...args);
    
    // 创建临时缓存实例用于这个特定的TTL
    if (ttl) {
      const tempCache = new StatsCache({ ttl });
      tempCache.set(key, result);
      return result;
    }
    
    statsCache.set(key, result);
    return result;
  }) as T;
}

// 创建全局缓存实例
export const statsCache = new StatsCache({
  ttl: 3 * 60 * 1000, // 3分钟
  maxSize: 30, // 最多30个缓存项
  maxMemorySize: 30 * 1024 * 1024, // 30MB内存限制
  enablePersistence: false, // 关闭持久化
  autoCleanupInterval: 30 * 1000 // 30秒清理一次
});

// 页面卸载时清理缓存
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    statsCache.destroy();
  });
} 