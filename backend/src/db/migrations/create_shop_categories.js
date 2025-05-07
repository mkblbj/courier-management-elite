/**
 * 迁移脚本：创建shop_categories表，并修改shops表添加category_id字段
 */

const mysql = require('mysql2/promise');
const { initConfig, dbName } = require('../config');

async function migrate() {
  let connection;

  try {
    console.log('开始执行迁移脚本: 创建shop_categories表...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      ...initConfig,
      database: dbName
    });

    // 检查表是否已存在
    console.log('检查shop_categories表是否已存在...');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'shop_categories'
    `);

    if (tables && Array.isArray(tables) && tables.length > 0) {
      console.log('shop_categories表已存在，跳过创建');
    } else {
      // 创建shop_categories表
      console.log('创建shop_categories表...');
      await connection.query(`
        CREATE TABLE shop_categories (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(50) NOT NULL COMMENT '类别名称',
          sort_order INT NOT NULL DEFAULT 0 COMMENT '排序顺序',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='店铺类别表';
      `);
      console.log('shop_categories表创建成功');

      // 添加索引以提高查询性能
      console.log('创建索引...');
      await connection.query(`
        CREATE INDEX idx_shop_categories_sort_order ON shop_categories(sort_order);
      `);
      console.log('索引创建成功');
    }

    // 检查shops表中是否已存在category_id字段
    console.log('检查shops表中是否存在category_id字段...');
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM shops LIKE 'category_id'
    `);

    if (columns && Array.isArray(columns) && columns.length > 0) {
      console.log('shops表中已存在category_id字段，跳过添加');
    } else {
      // 修改shops表，添加category_id字段
      console.log('修改shops表，添加category_id字段...');
      await connection.query(`
        ALTER TABLE shops ADD COLUMN category_id INT COMMENT '店铺类别ID',
        ADD CONSTRAINT fk_shop_category FOREIGN KEY (category_id) REFERENCES shop_categories(id) ON DELETE SET NULL;
      `);
      console.log('shops表修改成功');
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
 * 回滚函数：删除shop_categories表并移除shops表中的category_id字段
 */
async function rollback() {
  let connection;

  try {
    console.log('开始执行回滚: 移除外键并删除shop_categories表...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      ...initConfig,
      database: dbName
    });

    // 检查shops表中是否有category_id字段
    const [columnsResult] = await connection.query(`
      SHOW COLUMNS FROM shops LIKE 'category_id'
    `);
    
    if (columnsResult && Array.isArray(columnsResult) && columnsResult.length > 0) {
      console.log('移除shops表中的外键约束和category_id字段...');
      // 先移除外键约束
      try {
        await connection.query(`
          ALTER TABLE shops DROP FOREIGN KEY fk_shop_category;
        `);
        console.log('外键约束已移除');
      } catch (error) {
        console.log('移除外键约束失败，可能不存在:', error.message);
      }
      
      // 然后移除字段
      await connection.query(`
        ALTER TABLE shops DROP COLUMN category_id;
      `);
      console.log('category_id字段已移除');
    } else {
      console.log('shops表中不存在category_id字段，无需移除');
    }

    // 检查shop_categories表是否存在
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'shop_categories'
    `);

    if (tables && Array.isArray(tables) && tables.length > 0) {
      // 执行删除表
      await connection.query(`DROP TABLE shop_categories`);
      console.log('shop_categories表已删除');
    } else {
      console.log('shop_categories表不存在，无需回滚');
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