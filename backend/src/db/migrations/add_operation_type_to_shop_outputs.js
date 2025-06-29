/**
 * 迁移脚本：为shop_outputs表添加操作类型相关字段
 * 支持新增、减少、合单三种操作类型
 */

const mysql = require('mysql2/promise');
const { initConfig, dbName } = require('../config');

async function migrate() {
  let connection;

  try {
    console.log('开始执行迁移脚本: 为shop_outputs表添加操作类型字段...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      ...initConfig,
      database: dbName
    });

    // 检查表是否存在
    console.log('检查shop_outputs表是否存在...');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'shop_outputs'
    `);

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      throw new Error('shop_outputs表不存在，请先创建shop_outputs表');
    }

    // 检查字段是否已存在
    console.log('检查operation_type字段是否已存在...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'shop_outputs' AND 
        COLUMN_NAME = 'operation_type'
    `);

    if (columns && Array.isArray(columns) && columns.length > 0) {
      console.log('operation_type字段已存在，跳过添加');
    } else {
      // 添加operation_type字段
      console.log('添加operation_type字段...');
      await connection.query(`
        ALTER TABLE shop_outputs 
        ADD COLUMN operation_type ENUM('add', 'subtract', 'merge') 
        DEFAULT 'add' 
        COMMENT '操作类型：add-新增，subtract-减少，merge-合单'
        AFTER quantity
      `);
      console.log('operation_type字段添加成功');
    }

    // 检查并添加original_quantity字段
    console.log('检查original_quantity字段是否已存在...');
    const [originalQuantityColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'shop_outputs' AND 
        COLUMN_NAME = 'original_quantity'
    `);

    if (originalQuantityColumns && Array.isArray(originalQuantityColumns) && originalQuantityColumns.length > 0) {
      console.log('original_quantity字段已存在，跳过添加');
    } else {
      console.log('添加original_quantity字段...');
      await connection.query(`
        ALTER TABLE shop_outputs 
        ADD COLUMN original_quantity INT DEFAULT NULL 
        COMMENT '原始数量（用于减少操作记录）'
        AFTER operation_type
      `);
      console.log('original_quantity字段添加成功');
    }

    // 检查并添加merge_note字段
    console.log('检查merge_note字段是否已存在...');
    const [mergeNoteColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'shop_outputs' AND 
        COLUMN_NAME = 'merge_note'
    `);

    if (mergeNoteColumns && Array.isArray(mergeNoteColumns) && mergeNoteColumns.length > 0) {
      console.log('merge_note字段已存在，跳过添加');
    } else {
      console.log('添加merge_note字段...');
      await connection.query(`
        ALTER TABLE shop_outputs 
        ADD COLUMN merge_note TEXT DEFAULT NULL 
        COMMENT '合单备注信息'
        AFTER original_quantity
      `);
      console.log('merge_note字段添加成功');
    }

    // 检查并添加related_record_id字段
    console.log('检查related_record_id字段是否已存在...');
    const [relatedRecordColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'shop_outputs' AND 
        COLUMN_NAME = 'related_record_id'
    `);

    if (relatedRecordColumns && Array.isArray(relatedRecordColumns) && relatedRecordColumns.length > 0) {
      console.log('related_record_id字段已存在，跳过添加');
    } else {
      console.log('添加related_record_id字段...');
      await connection.query(`
        ALTER TABLE shop_outputs 
        ADD COLUMN related_record_id INT DEFAULT NULL 
        COMMENT '关联记录ID（用于减少操作）'
        AFTER merge_note
      `);
      console.log('related_record_id字段添加成功');
    }

    // 添加新的索引以提高查询性能
    console.log('创建新的索引...');
    
    // 检查索引是否已存在
    const [operationTypeIndex] = await connection.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'shop_outputs' AND 
        INDEX_NAME = 'idx_shop_outputs_operation_type'
    `);

    if (!operationTypeIndex || !Array.isArray(operationTypeIndex) || operationTypeIndex.length === 0) {
      await connection.query(`
        CREATE INDEX idx_shop_outputs_operation_type ON shop_outputs(operation_type)
      `);
      console.log('operation_type索引创建成功');
    } else {
      console.log('operation_type索引已存在，跳过创建');
    }

    // 检查复合索引是否已存在
    const [dateOperationIndex] = await connection.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'shop_outputs' AND 
        INDEX_NAME = 'idx_shop_outputs_output_date_operation'
    `);

    if (!dateOperationIndex || !Array.isArray(dateOperationIndex) || dateOperationIndex.length === 0) {
      await connection.query(`
        CREATE INDEX idx_shop_outputs_output_date_operation ON shop_outputs(output_date, operation_type)
      `);
      console.log('output_date_operation复合索引创建成功');
    } else {
      console.log('output_date_operation复合索引已存在，跳过创建');
    }

    // 更新现有记录的operation_type为'add'（确保数据一致性）
    console.log('更新现有记录的operation_type为add...');
    await connection.query(`
      UPDATE shop_outputs 
      SET operation_type = 'add' 
      WHERE operation_type IS NULL OR operation_type = ''
    `);
    console.log('现有记录更新完成');
    
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
 * 回滚函数：删除添加的字段和索引
 */
async function rollback() {
  let connection;

  try {
    console.log('开始执行回滚: 删除operation_type相关字段...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      ...initConfig,
      database: dbName
    });

    // 删除索引
    console.log('删除索引...');
    try {
      await connection.query(`DROP INDEX idx_shop_outputs_operation_type ON shop_outputs`);
      console.log('operation_type索引已删除');
    } catch (error) {
      console.log('operation_type索引不存在或删除失败:', error.message);
    }

    try {
      await connection.query(`DROP INDEX idx_shop_outputs_output_date_operation ON shop_outputs`);
      console.log('output_date_operation索引已删除');
    } catch (error) {
      console.log('output_date_operation索引不存在或删除失败:', error.message);
    }

    // 删除字段
    console.log('删除字段...');
    const fieldsToRemove = ['related_record_id', 'merge_note', 'original_quantity', 'operation_type'];
    
    for (const field of fieldsToRemove) {
      try {
        // 检查字段是否存在
        const [columns] = await connection.query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE 
            TABLE_SCHEMA = DATABASE() AND 
            TABLE_NAME = 'shop_outputs' AND 
            COLUMN_NAME = ?
        `, [field]);

        if (columns && Array.isArray(columns) && columns.length > 0) {
          await connection.query(`ALTER TABLE shop_outputs DROP COLUMN ${field}`);
          console.log(`${field}字段已删除`);
        } else {
          console.log(`${field}字段不存在，跳过删除`);
        }
      } catch (error) {
        console.log(`删除${field}字段失败:`, error.message);
      }
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