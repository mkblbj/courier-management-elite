const mysql = require('mysql2/promise');
const { poolConfig } = require('./config');
const { getMySQLTimeZoneSetting } = require('../config/timezone');

class Database {
  constructor() {
    this.pool = null;
  }

  async connect() {
    if (!this.pool) {
      try {
        this.pool = mysql.createPool(poolConfig);
        console.log('数据库连接池已创建');
        
        // 确保连接使用正确的时区
        await this.query(getMySQLTimeZoneSetting());
        console.log('数据库时区设置成功');
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
      
      // 确保事务中也使用正确的时区设置
      await connection.execute(getMySQLTimeZoneSetting());
      
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