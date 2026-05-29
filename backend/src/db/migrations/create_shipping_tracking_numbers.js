const mysql = require('mysql2/promise');
const { initConfig, dbName } = require('../config');

async function tableExists(connection, tableName) {
  const [tables] = await connection.query(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return Array.isArray(tables) && tables.length > 0;
}

async function columnExists(connection, tableName, columnName) {
  const [columns] = await connection.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return Array.isArray(columns) && columns.length > 0;
}

async function indexExists(connection, tableName, indexName) {
  const [indexes] = await connection.query(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName]
  );
  return Array.isArray(indexes) && indexes.length > 0;
}

async function migrate() {
  let connection;

  try {
    console.log('开始执行迁移脚本: 创建shipping_tracking_numbers表...');
    connection = await mysql.createConnection({ ...initConfig, database: dbName });

    if (!(await columnExists(connection, 'couriers', 'barcode_rule_type'))) {
      await connection.query(`
        ALTER TABLE couriers
        ADD COLUMN barcode_rule_type ENUM('postal', 'sagawa', 'generic')
        NOT NULL DEFAULT 'generic'
        COMMENT '扫码条码规则：postal=邮政NW-7去首尾字母，sagawa=佐川NW-7去首尾字母，generic=通用字母数字'
        AFTER category_id
      `);
      console.log('couriers.barcode_rule_type 字段添加成功');
    } else {
      console.log('couriers.barcode_rule_type 字段已存在，跳过添加');
    }

    await connection.query(`
      UPDATE couriers
      SET barcode_rule_type = 'postal'
      WHERE barcode_rule_type = 'generic'
        AND (
          name LIKE '%ゆうパケット%'
          OR name LIKE '%ゆうパック%'
          OR name LIKE '%クリップポスト%'
          OR name LIKE '%クリックポスト%'
          OR name LIKE '%郵便%'
          OR name LIKE '%邮政%'
          OR code LIKE 'up%'
          OR code LIKE 'cp%'
        )
    `);

    await connection.query(`
      UPDATE couriers
      SET barcode_rule_type = 'sagawa'
      WHERE name LIKE '%佐川%' OR code LIKE '%sagawa%'
    `);

    if (!(await tableExists(connection, 'shipping_tracking_numbers'))) {
      await connection.query(`
        CREATE TABLE shipping_tracking_numbers (
          id INT PRIMARY KEY AUTO_INCREMENT,
          tracking_number VARCHAR(50) NOT NULL COMMENT '处理后的运单号',
          raw_input VARCHAR(100) NOT NULL COMMENT '扫码枪原始输入',
          courier_id INT NOT NULL COMMENT '快递类型ID',
          scan_date DATE NOT NULL COMMENT '扫描日期',
          batch_id VARCHAR(36) NOT NULL COMMENT '本轮扫描批次ID',
          notes TEXT DEFAULT NULL COMMENT '备注',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
          UNIQUE KEY uniq_tracking_number_per_day (scan_date, tracking_number),
          INDEX idx_shipping_tracking_date_courier (scan_date, courier_id),
          INDEX idx_shipping_tracking_batch (batch_id),
          INDEX idx_shipping_tracking_created_at (created_at),
          CONSTRAINT fk_shipping_tracking_courier
            FOREIGN KEY (courier_id) REFERENCES couriers(id)
            ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='扫码计数运单号记录表'
      `);
      console.log('shipping_tracking_numbers表创建成功');
    } else {
      console.log('shipping_tracking_numbers表已存在，跳过创建');
    }

    if (!(await indexExists(connection, 'shipping_tracking_numbers', 'idx_shipping_tracking_date_courier'))) {
      await connection.query(`
        CREATE INDEX idx_shipping_tracking_date_courier
        ON shipping_tracking_numbers(scan_date, courier_id)
      `);
    }

    console.log('迁移脚本执行完成');
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

async function rollback() {
  let connection;

  try {
    console.log('开始回滚扫码计数迁移...');
    connection = await mysql.createConnection({ ...initConfig, database: dbName });

    if (await tableExists(connection, 'shipping_tracking_numbers')) {
      await connection.query('DROP TABLE shipping_tracking_numbers');
      console.log('shipping_tracking_numbers表已删除');
    }

    if (await columnExists(connection, 'couriers', 'barcode_rule_type')) {
      await connection.query('ALTER TABLE couriers DROP COLUMN barcode_rule_type');
      console.log('couriers.barcode_rule_type字段已删除');
    }

    console.log('回滚脚本执行完成');
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

if (require.main === module) {
  const isRollback = process.argv.includes('--rollback');
  const runner = isRollback ? rollback : migrate;

  runner()
    .then(() => {
      console.log(isRollback ? '回滚脚本执行成功' : '迁移脚本执行成功');
      process.exit(0);
    })
    .catch((err) => {
      console.error(isRollback ? '回滚脚本执行失败:' : '迁移脚本执行失败:', err);
      process.exit(1);
    });
}

module.exports = { migrate, rollback };
