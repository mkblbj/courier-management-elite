import { format, parseISO, formatISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

// 获取环境变量中的时区配置，默认为Asia/Tokyo
export const APP_TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE || 'Asia/Tokyo';

// 获取环境变量中的日期格式，默认为yyyy-MM-dd
export const APP_DATE_FORMAT = process.env.NEXT_PUBLIC_DATE_FORMAT || 'yyyy-MM-dd';

/**
 * 将日期对象转换为应用时区的ISO日期字符串（仅日期部分）
 * 用于API请求参数
 * 
 * 时区处理：使用formatInTimeZone将日期对象按照应用配置的时区格式化
 * 这样无论用户浏览器时区如何，都会生成基于APP_TIMEZONE的日期字符串
 */
export function dateToApiString(date: Date): string {
  if (!date) return '';
  // 使用formatInTimeZone直接格式化为时区日期
  return formatInTimeZone(date, APP_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * 从API返回的日期字符串创建应用时区的日期对象
 * 
 * 时区处理：无论日期字符串本身是UTC还是其他时区，
 * 都将其解析后转换到APP_TIMEZONE，确保在界面上显示的是应用时区的日期
 */
export function apiStringToDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  // 确保日期字符串格式正确
  const isoString = dateString.includes('T') 
    ? dateString 
    : `${dateString}T00:00:00`;
    
  // 解析为日期对象，并转换为应用时区
  return toZonedTime(parseISO(isoString), APP_TIMEZONE);
}

/**
 * 格式化日期以在UI中显示
 * 
 * 时区处理：确保所有日期显示都使用APP_TIMEZONE，
 * 保证界面上显示的日期与后端数据库中存储的日期在同一时区下一致
 */
export function formatDisplayDate(date: Date | string, formatStr = APP_DATE_FORMAT): string {
  if (!date) return '';
  
  // 如果是字符串，先转换为日期对象
  const dateObj = typeof date === 'string' ? apiStringToDate(date) : date;
  
  // 格式化为显示用的字符串，使用应用配置的时区
  return formatInTimeZone(dateObj, APP_TIMEZONE, formatStr);
}

/**
 * 创建基于当前时区的今天日期（零点）
 * 
 * 时区处理：在应用配置的时区中获取"今天"的日期，
 * 确保不受用户本地时区影响
 */
export function getTodayInAppTimezone(): Date {
  const now = new Date();
  // 转换到应用时区
  const zonedDate = toZonedTime(now, APP_TIMEZONE);
  
  // 设置为当天的00:00:00
  zonedDate.setHours(0, 0, 0, 0);
  
  return zonedDate;
}

/**
 * 创建基于当前时区的明天日期（零点）
 * 
 * 时区处理：在应用配置的时区中获取"明天"的日期，
 * 确保不受用户本地时区影响
 */
export function getTomorrowInAppTimezone(): Date {
  const today = getTodayInAppTimezone();
  today.setDate(today.getDate() + 1);
  return today;
}

/**
 * 获取指定日期在应用时区的开始时间（当天00:00:00）
 * 
 * 时区处理：确保日期的开始时间是在应用配置的时区计算的，
 * 用于日期范围过滤的开始时间
 */
export function getStartOfDayInAppTimezone(date: Date): Date {
  // 转换到应用时区
  const zonedDate = toZonedTime(date, APP_TIMEZONE);
  
  // 设置为当天的00:00:00
  zonedDate.setHours(0, 0, 0, 0);
  
  return zonedDate;
}

/**
 * 获取指定日期在应用时区的结束时间（当天23:59:59.999）
 * 
 * 时区处理：确保日期的结束时间是在应用配置的时区计算的，
 * 用于日期范围过滤的结束时间
 */
export function getEndOfDayInAppTimezone(date: Date): Date {
  // 转换到应用时区
  const zonedDate = toZonedTime(date, APP_TIMEZONE);
  
  // 设置为当天的23:59:59.999
  zonedDate.setHours(23, 59, 59, 999);
  
  return zonedDate;
}

/**
 * 将本地日期对象转换为UTC日期对象，保留年月日信息
 * 
 * 时区处理：将任何时区的日期转换为标准UTC时间，
 * 用于需要UTC时间的场景
 */
export function toUtcDate(date: Date): Date {
  // 将日期转换为ISO日期字符串（仅日期部分），然后创建UTC零点时间
  const dateStr = formatISO(date, { representation: 'date' });
  return new Date(`${dateStr}T00:00:00Z`);
}

/**
 * 检查日期字符串是否为有效的ISO日期格式
 */
export function isValidISODateString(dateString: string): boolean {
  if (!dateString) return false;
  
  // 尝试解析日期
  const date = parseISO(dateString);
  return date.toString() !== 'Invalid Date';
}

/**
 * 比较两个日期是否为同一天（基于应用时区）
 * 
 * 时区处理：在应用配置的时区中比较两个日期是否是同一天，
 * 避免时区差异导致的日期比较错误
 */
export function isSameDayInAppTimezone(dateA: Date, dateB: Date): boolean {
  if (!dateA || !dateB) return false;
  
  // 转换到应用时区
  const zonedDateA = toZonedTime(dateA, APP_TIMEZONE);
  const zonedDateB = toZonedTime(dateB, APP_TIMEZONE);
  
  return (
    zonedDateA.getFullYear() === zonedDateB.getFullYear() &&
    zonedDateA.getMonth() === zonedDateB.getMonth() &&
    zonedDateA.getDate() === zonedDateB.getDate()
  );
}

/**
 * 将UTC时间转换为应用时区的时间
 * 
 * 时区处理：确保从UTC时间（如API返回的时间）正确转换到应用配置的时区
 */
export function utcToAppTimezone(utcDate: Date): Date {
  return toZonedTime(utcDate, APP_TIMEZONE);
}

/**
 * 将应用时区的时间转换为UTC时间
 * 
 * 时区处理：将应用时区的时间转换回UTC，用于需要发送UTC时间的API
 */
export function appTimezoneToUtc(date: Date): Date {
  // 获取应用时区的偏移量（分钟）
  const timeZoneOffset = new Date().getTimezoneOffset();
  
  // 创建UTC时间
  const utcDate = new Date(date);
  utcDate.setMinutes(utcDate.getMinutes() - timeZoneOffset);
  
  return utcDate;
} 