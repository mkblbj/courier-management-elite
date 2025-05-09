/**
 * API基础URL
 */
export const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api` || '/api';

/**
 * 分页默认值
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * 日期格式
 */
export const DATE_FORMAT = 'yyyy-MM-dd';

/**
 * 带星期的日期格式
 */
export const DATE_WITH_WEEKDAY_FORMAT = 'yyyy-MM-dd EEEE';

/**
 * 日期时间格式（精确到秒）
 */
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

/**
 * 更易读的日期时间格式
 */
export const FRIENDLY_DATETIME_FORMAT = 'yyyy年MM月dd日 HH:mm:ss';

/**
 * 响应成功代码
 */
export const API_SUCCESS_CODE = 0; 