/**
 * 迁移脚本：添加parent_id字段到couriers表，实现母子类型关系
 */

const mysql = require('mysql2/promise');
const { initConfig, dbName } = require('../config');

async function migrate() {
  let connection;

  try {
    console.log('开始执行迁移脚本: 添加parent_id字段...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      ...initConfig,
      database: dbName
    });

    // 检查字段是否已存在
    console.log('检查parent_id字段是否已存在...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'couriers' AND 
        COLUMN_NAME = 'parent_id'
    `);

    // 修改判断逻辑，避免使用length属性
    if (columns && Array.isArray(columns) && columns.length > 0) {
      console.log('parent_id字段已存在，跳过创建');
    } else {
      // 添加parent_id字段
      console.log('添加parent_id字段...');
      await connection.query(`
        ALTER TABLE couriers
        ADD COLUMN parent_id INT NULL,
        ADD FOREIGN KEY (parent_id) REFERENCES couriers(id)
      `);
      console.log('parent_id字段添加成功');

      // 添加索引以提高查询性能
      console.log('创建索引...');
      await connection.query(`
        CREATE INDEX idx_couriers_parent_id ON couriers(parent_id)
      `);
      console.log('索引创建成功');
    }
    
    console.log('迁移脚本执行完成 ✅');

  } catch (error) {
    console.error('迁移脚本执行失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 可以从命令行直接调用
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('迁移脚本执行成功');
      process.exit(0);
    })
    .catch(err => {
      console.error('迁移脚本执行失败:', err);
      process.exit(1);
    });
}

module.exports = { migrate }; 