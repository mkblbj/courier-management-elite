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

module.exports = {
  formatDateString,
  getCurrentDateString,
  getOffsetDateString,
  isValidDateString,
  compareDateStrings
}; 