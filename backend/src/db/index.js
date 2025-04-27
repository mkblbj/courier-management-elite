const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// 从环境变量中构建数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'courier_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+09:00'
};

class Database {
  constructor() {
    this.pool = null;
  }

  async connect() {
    if (!this.pool) {
      try {
        this.pool = mysql.createPool(dbConfig);
        console.log('数据库连接池已创建');
      } catch (error) {
        console.error('创建数据库连接池失败:', error);
        throw error;
      }
    }
    return this.pool;
  }

  async query(sql, params = []) {
    try {
      const pool = await this.connect();
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('查询执行失败:', error);
      throw error;
    }
  }

  async transaction(callback) {
    const pool = await this.connect();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new Database(); 