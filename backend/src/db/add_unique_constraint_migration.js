/**
 * 为shipping_records表添加唯一约束的独立迁移脚本
 */

const db = require('./index');

/**
 * 添加唯一约束的主函数
 */
async function addUniqueConstraint() {
  try {
    await db.connect();
    console.log('开始为shipping_records表添加唯一约束...');
    
    // 检查唯一约束是否已存在
    const checkConstraintSql = `
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'shipping_records' 
      AND CONSTRAINT_NAME = 'unique_date_courier'
    `;
    const [constraintResults] = await db.pool.execute(checkConstraintSql);
    
    // 如果约束不存在，添加它
    if (constraintResults[0].count === 0) {
      // 添加日期和快递类型的唯一约束
      const addUniqueConstraintSql = `
        ALTER TABLE shipping_records
        ADD CONSTRAINT unique_date_courier UNIQUE (date, courier_id)
      `;
      await db.query(addUniqueConstraintSql);
      console.log('唯一约束 unique_date_courier 添加成功');
    } else {
      console.log('唯一约束 unique_date_courier 已存在，跳过添加');
    }
    
    console.log('唯一约束添加操作完成！');
    process.exit(0);
  } catch (error) {
    console.error('添加唯一约束失败:', error);
    console.error('错误详情:', error.message);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    try {
      await db.pool.end();
    } catch (err) {
      console.error('关闭数据库连接失败:', err);
    }
  }
}

// 执行迁移
addUniqueConstraint(); 