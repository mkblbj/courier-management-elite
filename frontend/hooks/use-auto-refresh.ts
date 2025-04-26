import { useState, useEffect, useCallback } from 'react';

export type RefreshInterval = 30 | 60 | 300 | 600 | null;

// 从localStorage加载自动刷新设置或使用默认值
const loadSavedInterval = (): RefreshInterval => {
  if (typeof window === 'undefined') return 30;
  
  const savedInterval = localStorage.getItem('dashboard-refresh-interval');
  if (!savedInterval) return 30;
  
  const interval = parseInt(savedInterval, 10);
  if (isValidInterval(interval)) {
    return interval as RefreshInterval;
  }
  
  return 30;
};

// 判断是否为有效的刷新间隔
function isValidInterval(interval: number): boolean {
  return [30, 60, 300, 600, null].includes(interval as RefreshInterval);
}

export const useAutoRefresh = (refreshCallback: () => Promise<void> | void) => {
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [nextRefreshTime, setNextRefreshTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // 执行刷新操作
  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      await refreshCallback();
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Auto refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshCallback, isRefreshing]);

  // 更新刷新间隔
  const updateRefreshInterval = useCallback((interval: RefreshInterval) => {
    if (isValidInterval(interval as number)) {
      localStorage.setItem('dashboard-refresh-interval', interval ? interval.toString() : 'null');
      setRefreshInterval(interval);
    }
  }, []);

  // 初始化时加载保存的刷新间隔
  useEffect(() => {
    const savedInterval = loadSavedInterval();
    setRefreshInterval(savedInterval);
  }, []);

  // 设置自动刷新计时器
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (refreshInterval) {
      // 设置下次刷新时间
      const next = new Date();
      next.setSeconds(next.getSeconds() + refreshInterval);
      setNextRefreshTime(next);
      
      // 定时刷新
      timer = setInterval(() => {
        refresh();
        
        // 更新下次刷新时间
        const nextTime = new Date();
        nextTime.setSeconds(nextTime.getSeconds() + refreshInterval);
        setNextRefreshTime(nextTime);
      }, refreshInterval * 1000);
      
      // 更新倒计时
      const countdownTimer = setInterval(() => {
        if (nextRefreshTime) {
          const now = new Date();
          const diff = Math.max(0, Math.floor((nextRefreshTime.getTime() - now.getTime()) / 1000));
          setTimeRemaining(diff);
        }
      }, 1000);
      
      return () => {
        if (timer) clearInterval(timer);
        clearInterval(countdownTimer);
      };
    } else {
      // 如果间隔为null，则禁用自动刷新
      setNextRefreshTime(null);
      setTimeRemaining(null);
      return () => {};
    }
  }, [refreshInterval, refresh]);

  // 格式化显示时间
  const getFormattedTimeRemaining = useCallback(() => {
    if (timeRemaining === null) return null;
    
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    }
    
    return `${seconds}秒`;
  }, [timeRemaining]);

  // 格式化显示刷新间隔
  const getFormattedInterval = useCallback(() => {
    if (refreshInterval === null) return '已禁用';
    if (refreshInterval === 60) return '1分钟';
    if (refreshInterval > 60) return `${refreshInterval / 60}分钟`;
    return `${refreshInterval}秒`;
  }, [refreshInterval]);

  return {
    refreshInterval,
    updateRefreshInterval,
    isRefreshing,
    lastRefreshTime,
    nextRefreshTime,
    timeRemaining,
    refresh,
    getFormattedTimeRemaining,
    getFormattedInterval,
  };
}; 