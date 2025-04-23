/**
 * 日期工具函数，统一处理时区问题
 */

// 格式化日期为YYYY-MM-DD格式，不含时区信息
const formatDateString = (date) => {
  if (!date) return null;
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// 获取当前日期，格式为YYYY-MM-DD
const getCurrentDateString = () => {
  return formatDateString(new Date());
};

// 获取指定天数前/后的日期
const getOffsetDateString = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateString(date);
};

// 验证日期字符串是否为有效的YYYY-MM-DD格式
const isValidDateString = (dateStr) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

// 比较两个日期字符串 (YYYY-MM-DD)
const compareDateStrings = (dateStr1, dateStr2) => {
  return dateStr1.localeCompare(dateStr2);
};

/**
 * 获取指定年份和周数对应的日期范围
 * @param {number} year 年份
 * @param {number} week 周数 (1-53)
 * @returns {Object} 包含起始日期和结束日期的对象 {start: 'YYYY-MM-DD', end: 'YYYY-MM-DD'}
 */
const getWeekDateRange = (year, week) => {
  if (!year || !week || week < 1 || week > 53) {
    return { start: null, end: null };
  }
  
  // 创建指定年份的第一天
  const firstDayOfYear = new Date(year, 0, 1);
  // 计算从年初开始的偏移天数
  const daysOffset = (week - 1) * 7;
  // 找到那一周的第一天 (考虑到每年第一天不一定是周一)
  // 周一为一周的第一天
  const firstDayOfWeek = new Date(year, 0, 1 + daysOffset - firstDayOfYear.getDay() + 1);
  // 设置那一周的最后一天
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
  
  return {
    start: formatDateString(firstDayOfWeek),
    end: formatDateString(lastDayOfWeek)
  };
};

/**
 * 获取指定年份和月份的日期范围
 * @param {number} year 年份
 * @param {number} month 月份 (1-12)
 * @returns {Object} 包含起始日期和结束日期的对象 {start: 'YYYY-MM-DD', end: 'YYYY-MM-DD'}
 */
const getMonthDateRange = (year, month) => {
  if (!year || !month || month < 1 || month > 12) {
    return { start: null, end: null };
  }
  
  const monthStr = month.toString().padStart(2, '0');
  // 获取该月的第一天
  const start = `${year}-${monthStr}-01`;
  // 获取月的最后一天
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${monthStr}-${lastDay}`;
  
  return { start, end };
};

/**
 * 获取指定年份和季度的日期范围
 * @param {number} year 年份
 * @param {number} quarter 季度 (1-4)
 * @returns {Object} 包含起始日期和结束日期的对象 {start: 'YYYY-MM-DD', end: 'YYYY-MM-DD'}
 */
const getQuarterDateRange = (year, quarter) => {
  if (!year || !quarter || quarter < 1 || quarter > 4) {
    return { start: null, end: null };
  }
  
  const startMonth = ((quarter - 1) * 3 + 1).toString().padStart(2, '0');
  const endMonth = (quarter * 3).toString().padStart(2, '0');
  const start = `${year}-${startMonth}-01`;
  // 获取季度最后一个月的最后一天
  const lastDay = new Date(year, quarter * 3, 0).getDate();
  const end = `${year}-${endMonth}-${lastDay}`;
  
  return { start, end };
};

/**
 * 获取指定年份的日期范围
 * @param {number} year 年份
 * @returns {Object} 包含起始日期和结束日期的对象 {start: 'YYYY-MM-DD', end: 'YYYY-MM-DD'}
 */
const getYearDateRange = (year) => {
  if (!year) {
    return { start: null, end: null };
  }
  
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`
  };
};

module.exports = {
  formatDateString,
  getCurrentDateString,
  getOffsetDateString,
  isValidDateString,
  compareDateStrings,
  getWeekDateRange,
  getMonthDateRange,
  getQuarterDateRange,
  getYearDateRange
}; 