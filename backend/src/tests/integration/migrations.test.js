/**
 * 数据库迁移脚本测试
 */

// 引入Jest测试函数
const { describe, test, beforeAll, afterAll, beforeEach, expect } = require('@jest/globals');
const mysql = require('mysql2/promise');
const { initConfig, dbName } = require('../../db/config');
const { migrate: migrateShops, rollback: rollbackShops } = require('../../db/migrations/create_shops_table');
const { migrate: migrateShopOutputs, rollback: rollbackShopOutputs } = require('../../db/migrations/create_shop_outputs_table');

// 测试连接
let connection;

// 在所有测试前建立连接
beforeAll(async () => {
  connection = await mysql.createConnection({
    ...initConfig,
    database: dbName
  });
});

// 在所有测试后关闭连接
afterAll(async () => {
  // 清理测试数据 - 先删除shop_outputs表，再删除shops表
  try {
    await rollbackShopOutputs();
    await rollbackShops();
  } catch (error) {
    console.error('清理测试数据失败:', error);
  }
  
  // 关闭连接
  if (connection) {
    await connection.end();
  }
});

// 辅助函数：检查表是否存在
async function tableExists(tableName) {
  const [tables] = await connection.query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE 
      TABLE_SCHEMA = DATABASE() AND 
      TABLE_NAME = ?
  `, [tableName]);
  
  return tables && Array.isArray(tables) && tables.length > 0;
}

// 辅助函数：检查索引是否存在
async function indexExists(tableName, indexName) {
  const [indexes] = await connection.query(`
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE 
      TABLE_SCHEMA = DATABASE() AND 
      TABLE_NAME = ? AND 
      INDEX_NAME = ?
  `, [tableName, indexName]);
  
  return indexes && Array.isArray(indexes) && indexes.length > 0;
}

// 辅助函数：按顺序删除所有表
async function cleanupTables() {
  // 先删除子表，后删除父表
  if (await tableExists('shop_outputs')) {
    await connection.query('DROP TABLE shop_outputs');
  }
  if (await tableExists('shops')) {
    await connection.query('DROP TABLE shops');
  }
}

describe('数据库迁移脚本测试', () => {
  
  // 每次测试前确保表都不存在
  beforeEach(async () => {
    await cleanupTables();
  });
  
  describe('shops表迁移测试', () => {
    
    test('应该成功创建shops表', async () => {
      // 执行迁移
      await migrateShops();
      
      // 验证表是否创建成功
      const tableCreated = await tableExists('shops');
      expect(tableCreated).toBe(true);
      
      // 验证索引是否创建成功
      const isActiveIndexExists = await indexExists('shops', 'idx_shops_is_active');
      const sortOrderIndexExists = await indexExists('shops', 'idx_shops_sort_order');
      
      expect(isActiveIndexExists).toBe(true);
      expect(sortOrderIndexExists).toBe(true);
    });
    
    test('应该成功回滚shops表迁移', async () => {
      // 确保表存在
      await migrateShops();
      
      // 确保没有引用shops的表存在
      if (await tableExists('shop_outputs')) {
        await connection.query('DROP TABLE shop_outputs');
      }
      
      // 执行回滚
      await rollbackShops();
      
      // 验证表是否被删除
      const tableDeleted = !(await tableExists('shops'));
      expect(tableDeleted).toBe(true);
    });
    
  });
  
  describe('shop_outputs表迁移测试', () => {
    
    beforeEach(async () => {
      // 确保shops表存在
      if (!await tableExists('shops')) {
        await migrateShops();
      }
    });
    
    test('应该成功创建shop_outputs表', async () => {
      // 执行迁移
      await migrateShopOutputs();
      
      // 验证表是否创建成功
      const tableCreated = await tableExists('shop_outputs');
      expect(tableCreated).toBe(true);
      
      // 验证索引是否创建成功
      const outputDateIndexExists = await indexExists('shop_outputs', 'idx_shop_outputs_output_date');
      const shopIdIndexExists = await indexExists('shop_outputs', 'idx_shop_outputs_shop_id');
      const courierIdIndexExists = await indexExists('shop_outputs', 'idx_shop_outputs_courier_id');
      const compositeIndex1Exists = await indexExists('shop_outputs', 'idx_shop_outputs_shop_courier_date');
      const compositeIndex2Exists = await indexExists('shop_outputs', 'idx_shop_outputs_date_shop');
      
      expect(outputDateIndexExists).toBe(true);
      expect(shopIdIndexExists).toBe(true);
      expect(courierIdIndexExists).toBe(true);
      expect(compositeIndex1Exists).toBe(true);
      expect(compositeIndex2Exists).toBe(true);
    });
    
    test('应该成功回滚shop_outputs表迁移', async () => {
      // 确保表存在
      await migrateShopOutputs();
      
      // 执行回滚
      await rollbackShopOutputs();
      
      // 验证表是否被删除
      const tableDeleted = !(await tableExists('shop_outputs'));
      expect(tableDeleted).toBe(true);
    });
    
    test('应该正确处理外键约束', async () => {
      // 确保表存在
      await migrateShopOutputs();
      
      // 向shops表插入测试数据
      await connection.query(`
        INSERT INTO shops (name, is_active, sort_order, remark)
        VALUES ('测试店铺', 1, 0, '测试备注')
      `);
      
      // 获取新插入的店铺ID
      const [shops] = await connection.query('SELECT id FROM shops ORDER BY id DESC LIMIT 1');
      const shopId = shops[0].id;
      
      // 获取一个有效的courier_id
      const [couriers] = await connection.query('SELECT id FROM couriers LIMIT 1');
      let courierId;
      
      if (couriers && couriers.length > 0) {
        courierId = couriers[0].id;
        
        // 向shop_outputs表插入测试数据
        await connection.query(`
          INSERT INTO shop_outputs (shop_id, courier_id, output_date, quantity, notes)
          VALUES (?, ?, CURDATE(), 10, '测试备注')
        `, [shopId, courierId]);
        
        // 验证数据是否插入成功
        const [outputs] = await connection.query('SELECT * FROM shop_outputs WHERE shop_id = ?', [shopId]);
        expect(outputs.length).toBeGreaterThan(0);
        expect(outputs[0].shop_id).toBe(shopId);
        expect(outputs[0].courier_id).toBe(courierId);
      } else {
        console.log('警告: 无法测试外键约束，因为couriers表中没有数据');
      }
      
      // 清理测试数据
      await connection.query('DELETE FROM shop_outputs WHERE shop_id = ?', [shopId]);
      await connection.query('DELETE FROM shops WHERE id = ?', [shopId]);
    });
    
  });
  
}); 