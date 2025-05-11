/**
 * 迁移脚本：创建shops表，存储店铺基本信息
 */

const mysql = require('mysql2/promise');
const { initConfig, dbName } = require('../config');

async function migrate() {
  let connection;

  try {
    console.log('开始执行迁移脚本: 创建shops表...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      ...initConfig,
      database: dbName
    });

    // 检查表是否已存在
    console.log('检查shops表是否已存在...');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'shops'
    `);

    if (tables && Array.isArray(tables) && tables.length > 0) {
      console.log('shops表已存在，跳过创建');
    } else {
      // 创建shops表
      console.log('创建shops表...');
      await connection.query(`
        CREATE TABLE shops (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL COMMENT '店铺名称',
          is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
          sort_order INT NOT NULL DEFAULT 0 COMMENT '排序顺序',
          remark TEXT COMMENT '备注',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='店铺基本信息表';
      `);
      console.log('shops表创建成功');

      // 添加索引以提高查询性能
      console.log('创建索引...');
      await connection.query(`
        CREATE INDEX idx_shops_is_active ON shops(is_active);
        CREATE INDEX idx_shops_sort_order ON shops(sort_order);
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

/**
 * 回滚函数：删除shops表
 */
async function rollback() {
  let connection;

  try {
    console.log('开始执行回滚: 删除shops表...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      ...initConfig,
      database: dbName
    });

    // 检查shop_outputs表是否存在，如果存在先删除
    const [shopOutputsExists] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'shop_outputs'
    `);
    
    if (shopOutputsExists && Array.isArray(shopOutputsExists) && shopOutputsExists.length > 0) {
      console.log('检测到shop_outputs表存在，先删除shop_outputs表...');
      await connection.query(`DROP TABLE shop_outputs`);
      console.log('shop_outputs表已删除');
    }

    // 检查shops表是否存在
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'shops'
    `);

    if (tables && Array.isArray(tables) && tables.length > 0) {
      // 执行删除表
      await connection.query(`DROP TABLE shops`);
      console.log('shops表已删除');
    } else {
      console.log('shops表不存在，无需回滚');
    }
    
    console.log('回滚脚本执行完成 ✅');

  } catch (error) {
    console.error('回滚脚本执行失败:', error);
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
  const isRollback = process.argv.includes('--rollback');
  
  if (isRollback) {
    rollback()
      .then(() => {
        console.log('回滚脚本执行成功');
        process.exit(0);
      })
      .catch(err => {
        console.error('回滚脚本执行失败:', err);
        process.exit(1);
      });
  } else {
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
}

module.exports = { migrate, rollback }; 