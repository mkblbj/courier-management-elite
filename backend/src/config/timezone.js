require('dotenv').config();

// 从环境变量获取配置的时区，默认为Asia/Tokyo
const APP_TIMEZONE = process.env.TIMEZONE || 'Asia/Tokyo';

// 从环境变量获取配置的数据库时区，默认为+09:00
const DB_TIMEZONE = process.env.DB_TIMEZONE || '+09:00';

/**
 * 格式化日期为指定的ISO格式
 * @param {Date} date 日期对象
 * @param {boolean} includeTime 是否包含时间部分
 * @returns {string} 格式化后的日期字符串
 */
function formatToISOString(date, includeTime = false) {
  if (includeTime) {
    return date.toISOString();
  } else {
    return date.toISOString().split('T')[0];
  }
}

/**
 * 从字符串解析日期，并设置为特定时区的午夜时间
 * @param {string} dateStr 日期字符串，格式为 YYYY-MM-DD
 * @returns {Date} 对应时区的午夜时间
 */
function parseDate(dateStr) {
  if (!dateStr) return new Date();
  
  // 如果日期字符串不包含时间部分，添加时区的零点时间
  if (!dateStr.includes('T')) {
    dateStr = `${dateStr}T00:00:00${DB_TIMEZONE}`;
  }
  
  return new Date(dateStr);
}

/**
 * 获取当前时区的今天日期（零点）
 * @returns {Date} 今天的日期对象
 */
function getToday() {
  const now = new Date();
  
  // 设置为当天的00:00:00
  now.setHours(0, 0, 0, 0);
  
  return now;
}

/**
 * 获取当前时区的明天日期（零点）
 * @returns {Date} 明天的日期对象
 */
function getTomorrow() {
  const today = getToday();
  today.setDate(today.getDate() + 1);
  return today;
}

/**
 * 获取 MySQL 时区设置语句
 * @returns {string} MySQL 时区设置 SQL 语句
 */
function getMySQLTimeZoneSetting() {
  return `SET time_zone = '${DB_TIMEZONE}';`;
}

module.exports = {
  APP_TIMEZONE,
  DB_TIMEZONE,
  formatToISOString,
  parseDate,
  getToday,
  getTomorrow,
  getMySQLTimeZoneSetting
}; 