/**
 * 添加"未指定具体类型"的快递类型记录脚本
 * 
 * 运行方法: node src/scripts/createUnspecifiedCourierTypes.js
 * 
 * 这个脚本会为每个快递类别添加一个"未指定具体类型"的快递类型记录
 * 用于解决在录入出力数据时不能确定具体快递类型的问题
 */

// @ts-nocheck
const fs = require('fs');
const path = require('path');
const db = require('../db');

async function createUnspecifiedCourierTypes() {
  try {
    console.info('开始执行添加"未指定具体类型"快递类型的脚本...');
    
    // 读取SQL脚本文件
    const sqlFilePath = path.join(__dirname, '../db/scripts/create_unspecified_courier_types.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 分割SQL语句
    const statements = sqlScript.split(';').filter(stmt => stmt.trim() !== '');
    
    // 检查是否已存在未指定类型记录
    const checkResult = await db.query(statements[0]);
    let existingCount = 0;
    
    try {
      // 不同的数据库驱动返回结果格式不同，尝试不同的方式获取数据
      if (Array.isArray(checkResult) && checkResult.length > 0) {
        existingCount = checkResult[0].existing_count || 0;
      } else if (checkResult && typeof checkResult === 'object') {
        existingCount = checkResult.existing_count || 0;
      }
    } catch (err) {
      console.warn('无法获取已有记录数量', err);
    }
    
    if (existingCount > 0) {
      console.info(`系统中已存在 ${existingCount} 个"未指定具体类型"的记录`);
    }
    
    // 执行插入语句
    const insertResult = await db.query(statements[1]);
    let affectedRows = 0;
    
    try {
      // 尝试不同的方式获取受影响的行数
      if (insertResult && typeof insertResult === 'object') {
        if ('affectedRows' in insertResult) {
          affectedRows = insertResult.affectedRows;
        } else if (Array.isArray(insertResult) && insertResult[0] && 'affectedRows' in insertResult[0]) {
          affectedRows = insertResult[0].affectedRows;
        }
      }
    } catch (err) {
      console.warn('无法获取插入操作的影响行数', err);
    }
    
    if (affectedRows > 0) {
      console.info(`成功添加 ${affectedRows} 个"未指定具体类型"的快递类型记录`);
      
      // 查询并显示添加的记录
      const queryResult = await db.query(statements[2]);
      const records = Array.isArray(queryResult) ? queryResult : 
                     (queryResult && typeof queryResult === 'object') ? [queryResult] : [];
      
      console.info('新增的记录如下:');
      if (records.length > 0) {
        records.forEach(record => {
          console.info(`ID: ${record.id || '未知'}, 名称: ${record.name || '未知'}, 类别: ${record.category_name || '未知'}`);
        });
      } else {
        console.info('无法获取新增记录详情');
      }
    } else {
      console.info('没有需要添加的记录，所有类别可能已经有对应的未指定类型记录');
    }
    
    console.info('脚本执行完成!');
  } catch (error) {
    console.error('执行脚本时发生错误:', error);
    throw error;
  }
}

// 执行函数并在完成后关闭数据库连接
createUnspecifiedCourierTypes()
  .then(() => {
    console.info('脚本执行成功');
    process.exit(0);
  })
  .catch(err => {
    console.error('脚本执行失败:', err);
    process.exit(1);
  }); 