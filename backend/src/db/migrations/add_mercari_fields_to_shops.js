/**
 * 迁移脚本：为 shops 表添加 Mercari 字段
 * - mercari_access_token TEXT NULL (加密存储 PAT)
 * - last_synced_at DATETIME NULL
 */

const mysql = require('mysql2/promise');
const { initConfig, dbName } = require('../config');

async function migrate() {
  let connection;
  try {
    console.log('开始执行迁移脚本: 为shops表添加 Mercari 字段...');
    connection = await mysql.createConnection({ ...initConfig, database: dbName });

    // 确认 shops 表存在
    const [tables] = await connection.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shops'
    `);
    const tablesArr = Array.isArray(tables) ? tables : [];
    if (tablesArr.length === 0) {
      throw new Error('shops表不存在，请先创建shops表');
    }

    // mercari_access_token
    const [tokenCol] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'mercari_access_token'
    `);
    const tokenArr = Array.isArray(tokenCol) ? tokenCol : [];
    if (tokenArr.length === 0) {
      console.log('添加 mercari_access_token 字段...');
      await connection.query(`
        ALTER TABLE shops ADD COLUMN mercari_access_token TEXT NULL COMMENT '加密存储 Mercari PAT'
      `);
      console.log('mercari_access_token 添加成功');
    } else {
      console.log('mercari_access_token 已存在，跳过');
    }

    // last_synced_at
    const [syncCol] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shops' AND COLUMN_NAME = 'last_synced_at'
    `);
    const syncArr = Array.isArray(syncCol) ? syncCol : [];
    if (syncArr.length === 0) {
      console.log('添加 last_synced_at 字段...');
      await connection.query(`
        ALTER TABLE shops ADD COLUMN last_synced_at DATETIME NULL COMMENT '上次同步时间'
      `);
      console.log('last_synced_at 添加成功');
    } else {
      console.log('last_synced_at 已存在，跳过');
    }

    console.log('迁移脚本执行完成 ✅');
  } catch (e) {
    console.error('迁移脚本执行失败:', String(e));
    throw e;
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
    console.log('开始执行回滚: 移除 shops 表的 Mercari 字段...');
    connection = await mysql.createConnection({ ...initConfig, database: dbName });

    const fields = ['mercari_access_token', 'last_synced_at'];
    for (const field of fields) {
      // 检查字段是否存在
      // eslint-disable-next-line no-await-in-loop
      const [col] = await connection.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shops' AND COLUMN_NAME = ?
      `, [field]);
      if (col && Array.isArray(col) && col.length > 0) {
        console.log(`删除字段 ${field} ...`);
        // eslint-disable-next-line no-await-in-loop
        await connection.query(`ALTER TABLE shops DROP COLUMN ${field}`);
      } else {
        console.log(`字段 ${field} 不存在，跳过`);
      }
    }

    console.log('回滚脚本执行完成 ✅');
  } catch (e) {
    console.error('回滚脚本执行失败:', String(e));
    throw e;
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 直接运行支持
if (require.main === module) {
  const isRollback = process.argv.includes('--rollback');
  const runner = isRollback ? rollback : migrate;
  runner()
    .then(() => { console.log(isRollback ? '回滚脚本执行成功' : '迁移脚本执行成功'); process.exit(0); })
    .catch(err => { console.error(isRollback ? '回滚脚本执行失败:' : '迁移脚本执行失败:', String(err)); process.exit(1); });
}

module.exports = { migrate, rollback };


