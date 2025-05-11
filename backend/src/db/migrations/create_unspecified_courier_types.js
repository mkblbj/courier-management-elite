/**
 * 为每个快递类别添加"未指定"的快递类型记录
 * 用于解决在录入出力数据时不能确定具体快递类型的问题
 */

const db = require('../../db');

module.exports = {
  /**
   * 执行迁移
   */
  async migrate() {
    try {
      console.log('执行创建"未指定"快递类型记录迁移...');
      
      // 为每个类别添加一个特殊的"未指定"记录
      const insertSql = `
        INSERT INTO couriers (name, code, category_id, is_active, sort_order, remark)
        SELECT 
          CONCAT(name, '-未指定'), 
          CONCAT('UNSPECIFIED-', id), 
          id, 
          1, 
          9999, 
          '录入数据时无法确定具体类型时使用'
        FROM courier_categories cc
        WHERE NOT EXISTS (
          -- 避免重复添加
          SELECT 1 FROM couriers c 
          WHERE c.category_id = cc.id AND c.name LIKE CONCAT(cc.name, '%未指定%')
        )
      `;
      
      const result = await db.query(insertSql);
      
      // 处理不同类型的返回结果
      let affectedRows = 0;
      if (result && typeof result === 'object') {
        if ('affectedRows' in result) {
          affectedRows = result.affectedRows;
        } else if (Array.isArray(result) && result[0] && 'affectedRows' in result[0]) {
          affectedRows = result[0].affectedRows;
        }
      }
      
      if (affectedRows > 0) {
        console.log(`迁移成功: 添加了 ${affectedRows} 个"未指定"快递类型记录`);
      } else {
        console.log('迁移成功: 没有需要添加的"未指定"快递类型记录');
      }
      
      return true;
    } catch (error) {
      console.error('执行"未指定"快递类型记录迁移失败:', error);
      return false;
    }
  },
  
  /**
   * 回滚迁移（如果需要）
   */
  async rollback() {
    try {
      console.log('回滚"未指定"快递类型记录迁移...');
      
      // 删除所有名称中包含"未指定"的快递类型记录
      const deleteSql = `
        DELETE FROM couriers 
        WHERE name LIKE '%-未指定'
      `;
      
      await db.query(deleteSql);
      console.log('回滚成功: 已删除所有"未指定"快递类型记录');
      
      return true;
    } catch (error) {
      console.error('回滚"未指定"快递类型记录迁移失败:', error);
      return false;
    }
  }
}; 