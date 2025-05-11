const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// 导入自定义时区配置
const { DB_TIMEZONE } = require('../config/timezone');

// 基本配置
const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password'
};

// 连接池配置（用于常规连接）
const poolConfig = {
  ...baseConfig,
  database: process.env.DB_NAME || 'courier_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: DB_TIMEZONE
};

// 初始化配置（用于创建数据库）
const initConfig = {
  ...baseConfig,
  multipleStatements: true,
  timezone: DB_TIMEZONE
};

// 数据库名称
const dbName = process.env.DB_NAME || 'courier_db';

module.exports = {
  baseConfig,
  poolConfig,
  initConfig,
  dbName
}; 