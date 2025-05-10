/**
 * 迁移脚本：创建快递类别表
 */

const mysql = require('mysql2/promise');
const { initConfig, dbName } = require('../config');

async function migrate() {
  let connection;

  try {
    console.log('开始执行迁移脚本: 创建快递类别表...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      ...initConfig,
      database: dbName
    });

    // 检查表是否已存在
    console.log('检查courier_categories表是否已存在...');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'courier_categories'
    `);

    if (tables && Array.isArray(tables) && tables.length > 0) {
      console.log('courier_categories表已存在，跳过创建');
    } else {
      // 创建courier_categories表
      console.log('创建courier_categories表...');
      await connection.query(`
        CREATE TABLE courier_categories (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(50) NOT NULL COMMENT '类别名称',
          sort_order INT NOT NULL DEFAULT 0 COMMENT '排序顺序',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='快递类别表';
      `);
      console.log('courier_categories表创建成功');

      // 添加索引以提高查询性能
      console.log('创建索引...');
      await connection.query(`
        CREATE INDEX idx_courier_categories_sort_order ON courier_categories(sort_order);
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