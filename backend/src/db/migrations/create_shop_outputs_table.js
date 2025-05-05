/**
 * 迁移脚本：创建shop_outputs表，存储店铺出力数据
 */

const mysql = require('mysql2/promise');
const { initConfig, dbName } = require('../config');

async function migrate() {
  let connection;

  try {
    console.log('开始执行迁移脚本: 创建shop_outputs表...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      ...initConfig,
      database: dbName
    });

    // 检查表是否已存在
    console.log('检查shop_outputs表是否已存在...');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'shop_outputs'
    `);

    if (tables && Array.isArray(tables) && tables.length > 0) {
      console.log('shop_outputs表已存在，跳过创建');
    } else {
      // 确保shops表存在
      const [shopsExists] = await connection.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE 
          TABLE_SCHEMA = DATABASE() AND 
          TABLE_NAME = 'shops'
      `);

      if (!shopsExists || !Array.isArray(shopsExists) || shopsExists.length === 0) {
        throw new Error('shops表不存在，请先创建shops表');
      }

      // 创建shop_outputs表
      console.log('创建shop_outputs表...');
      await connection.query(`
        CREATE TABLE shop_outputs (
          id INT PRIMARY KEY AUTO_INCREMENT,
          shop_id INT NOT NULL COMMENT '店铺ID',
          courier_id INT NOT NULL COMMENT '快递类型ID',
          output_date DATE NOT NULL COMMENT '出力日期',
          quantity INT NOT NULL DEFAULT 0 COMMENT '出力数量',
          notes TEXT COMMENT '备注说明',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
          FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
          FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='店铺出力数据表';
      `);
      console.log('shop_outputs表创建成功');

      // 添加索引以提高查询性能
      console.log('创建索引...');
      await connection.query(`
        CREATE INDEX idx_shop_outputs_output_date ON shop_outputs(output_date);
        CREATE INDEX idx_shop_outputs_shop_id ON shop_outputs(shop_id);
        CREATE INDEX idx_shop_outputs_courier_id ON shop_outputs(courier_id);
        CREATE INDEX idx_shop_outputs_shop_courier_date ON shop_outputs(shop_id, courier_id, output_date);
        CREATE INDEX idx_shop_outputs_date_shop ON shop_outputs(output_date, shop_id);
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
 * 回滚函数：删除shop_outputs表
 */
async function rollback() {
  let connection;

  try {
    console.log('开始执行回滚: 删除shop_outputs表...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      ...initConfig,
      database: dbName
    });

    // 检查表是否存在
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'shop_outputs'
    `);

    if (tables && Array.isArray(tables) && tables.length > 0) {
      // 执行删除表
      await connection.query(`DROP TABLE shop_outputs`);
      console.log('shop_outputs表已删除');
    } else {
      console.log('shop_outputs表不存在，无需回滚');
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