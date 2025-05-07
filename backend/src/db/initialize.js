/**
 * 数据库初始化脚本
 * 此脚本用于初始化数据库结构，会自动执行全部必要的表创建和索引添加操作
 */

const mysql = require('mysql2/promise');
const { initConfig, dbName } = require('./config');
const fs = require('fs');
const path = require('path');

// 导入迁移脚本
const shopsTableMigration = require('./migrations/create_shops_table');
const shopOutputsTableMigration = require('./migrations/create_shop_outputs_table');
const shopCategoriesMigration = require('./migrations/create_shop_categories');

async function initializeDatabase() {
  let connection;

  try {
    console.log('开始初始化数据库...');
    
    // 创建数据库连接（不指定数据库）
    connection = await mysql.createConnection(initConfig);

    // 创建数据库（如果不存在）
    console.log(`尝试创建数据库 ${dbName}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`数据库 ${dbName} 创建成功或已存在`);

    // 切换到指定数据库
    await connection.query(`USE ${dbName};`);
    
    // 创建必要的表
    console.log('创建所需的数据表...');

    // 快递类型表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS couriers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(50),
        remark TEXT DEFAULT NULL COMMENT '备注信息',
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('快递类型表 couriers 创建成功');

    // 发货记录表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS shipping_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        courier_id INT NOT NULL,
        quantity INT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (courier_id) REFERENCES couriers(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('发货记录表 shipping_records 创建成功');

    // 添加索引
    console.log('添加必要的索引和约束...');
    
    // 检查唯一约束是否已存在
    const checkConstraintSql = `
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'shipping_records' 
      AND CONSTRAINT_NAME = 'unique_date_courier'
    `;
    const [constraintResults] = await connection.query(checkConstraintSql);
    
    // 如果约束不存在，添加它
    if (constraintResults[0].count === 0) {
      // 添加日期和快递类型的唯一约束
      const addUniqueConstraintSql = `
        ALTER TABLE shipping_records
        ADD CONSTRAINT unique_date_courier UNIQUE (date, courier_id)
      `;
      await connection.query(addUniqueConstraintSql);
      console.log('唯一约束 unique_date_courier 添加成功');
    } else {
      console.log('唯一约束 unique_date_courier 已存在，跳过添加');
    }
    
    // 执行店铺相关的迁移脚本
    console.log('执行店铺相关的迁移脚本...');
    
    try {
      // 执行店铺表创建迁移
      console.log('执行店铺表创建迁移...');
      await shopsTableMigration.migrate();
      
      // 执行店铺类别表创建迁移
      console.log('执行店铺类别表创建迁移...');
      await shopCategoriesMigration.migrate();
      
      // 执行店铺出力表创建迁移
      console.log('执行店铺出力表创建迁移...');
      await shopOutputsTableMigration.migrate();
      
      console.log('所有迁移脚本执行完成');
    } catch (migrationError) {
      console.error('迁移脚本执行失败:', migrationError);
      console.log('继续初始化过程...');
    }
    
    // 检查是否需要添加测试数据
    const [courierRows] = await connection.query('SELECT COUNT(*) as count FROM couriers');
    if (courierRows[0].count === 0) {
      console.log('添加测试数据...');
      
      // 添加测试快递类型
      const couriersSql = `
        INSERT INTO couriers (name, code, remark, is_active, sort_order) VALUES
        ('ゆうパケット (1CM)', 'up1', '国内知名快递类型，速度快，价格较高', 1, 1),
        ('ゆうパケット (2CM)', 'up2', '全国性快递类型，性价比高', 1, 2),
        ('ゆうパケットパフ', 'ypp', '电商自营物流，配送稳定', 1, 3),
        ('クリップポスト (3CM)', 'cp3', '全国连锁快递企业', 1, 4),
        ('ゆうパック', 'upk', '全国性快递企业，服务范围广', 1, 5)
      `;
      await connection.query(couriersSql);
      console.log('测试快递类型数据添加成功');
      
      // 添加测试发货记录
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().slice(0, 10);
      
      const recordsSql = `
        INSERT INTO shipping_records (date, courier_id, quantity, notes) VALUES
        (?, 1, 5, '当日测试数据1'),
        (?, 2, 3, '当日测试数据2'),
        (?, 1, 6, '昨日测试数据'),
        (?, 1, 4, '前天测试数据')
      `;
      await connection.query(recordsSql, [today, today, yesterday, twoDaysAgo]);
      console.log('测试发货记录数据添加成功');
    } else {
      console.log('发现数据已存在，跳过测试数据添加');
    }
    
    console.log('数据库初始化完成！✅');

  } catch (error) {
    console.error('数据库初始化失败:', error);
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
  initializeDatabase()
    .then(() => {
      console.log('数据库初始化脚本执行成功');
      process.exit(0);
    })
    .catch(err => {
      console.error('数据库初始化脚本执行失败:', err);
      process.exit(1);
    });
}

module.exports = { initializeDatabase }; 