const db = require('../db');

class CourierCategory {
  constructor() {
    this.table = 'courier_categories';
  }

  /**
   * 获取所有快递类别
   * @param {Object} options 过滤和排序选项
   * @returns {Promise<Array>} 
   */
  async getAll(options = {}) {
    let sql = `SELECT * FROM ${this.table}`;
    const params = [];
    const whereClauses = [];

    // 添加搜索过滤条件
    if (options.search) {
      whereClauses.push('name LIKE ?');
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm);
    }

    // 添加WHERE子句
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    // 添加排序
    const allowedSortFields = ['id', 'name', 'sort_order', 'created_at', 'updated_at'];
    const sortBy = allowedSortFields.includes(options.sort_by) ? options.sort_by : 'sort_order';
    const sortOrder = options.sort_order === 'DESC' ? 'DESC' : 'ASC';
    
    sql += ` ORDER BY ${sortBy} ${sortOrder}`;

    return await db.query(sql, params);
  }

  /**
   * 根据ID获取快递类别
   * @param {number} id 快递类别ID
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    const sql = `SELECT * FROM ${this.table} WHERE id = ?`;
    const results = await db.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 添加快递类别
   * @param {Object} data 快递类别数据
   * @returns {Promise<number>} 新创建的ID
   */
  async add(data) {
    const sql = `INSERT INTO ${this.table} (name, sort_order) VALUES (?, ?)`;
    
    const sortOrder = data.sort_order !== undefined ? data.sort_order : 0;

    const result = await db.query(sql, [
      data.name,
      sortOrder
    ]);

    return result.insertId;
  }

  /**
   * 更新快递类别
   * @param {number} id 快递类别ID
   * @param {Object} data 更新的数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  async update(id, data) {
    const setClauses = [];
    const params = [];
    
    // 构建SET子句
    if (data.name !== undefined) {
      setClauses.push("name = ?");
      params.push(data.name);
    }
    
    if (data.sort_order !== undefined) {
      setClauses.push("sort_order = ?");
      params.push(data.sort_order);
    }
    
    // 如果没有需要更新的字段，直接返回成功
    if (setClauses.length === 0) {
      return true;
    }
    
    // 将ID添加到参数数组末尾
    params.push(id);
    
    const sql = `UPDATE ${this.table} SET ${setClauses.join(", ")} WHERE id = ?`;
    
    const result = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  /**
   * 删除快递类别
   * @param {number} id 快递类别ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    // 由于有外键约束，如果存在关联快递类型，数据库会拒绝删除
    const sql = `DELETE FROM ${this.table} WHERE id = ?`;
    const result = await db.query(sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * 检查类别是否被快递类型使用
   * @param {number} id 类别ID
   * @returns {Promise<boolean>} 是否被使用
   */
  async isBeingUsed(id) {
    const sql = `SELECT COUNT(*) as count FROM couriers WHERE category_id = ?`;
    const rows = await db.query(sql, [id]);
    return rows[0].count > 0;
  }

  /**
   * 更新排序
   * @param {Array<Object>} sortData 排序数据 [{'id': 1, 'sort_order': 3}, ...]
   * @returns {Promise<boolean>} 是否成功
   */
  async updateSort(sortData) {
    if (!sortData || !sortData.length) {
      return true;
    }
    
    return await db.transaction(async (connection) => {
      for (const item of sortData) {
        if (!item.id || item.sort_order === undefined) {
          continue;
        }
        
        const sql = `UPDATE ${this.table} SET sort_order = ? WHERE id = ?`;
        await connection.execute(sql, [item.sort_order, item.id]);
      }
      
      return true;
    });
  }

  /**
   * 获取类别的统计数据
   * @param {number} categoryId 类别ID
   * @param {Object} options 过滤选项
   * @returns {Promise<Object>} 类别的统计数据
   */
  async getCategoryStats(categoryId, options = {}) {
    // 构造基础SQL
    let sql = `
      SELECT 
        cc.id as category_id,
        cc.name as category_name,
        SUM(so.quantity) as total_quantity
      FROM ${this.table} cc
      LEFT JOIN couriers c ON c.category_id = cc.id
      LEFT JOIN shop_outputs so ON so.courier_id = c.id
      WHERE cc.id = ?
    `;
    const params = [categoryId];

    // 添加日期过滤
    if (options.start_date && options.end_date) {
      sql += ` AND so.output_date BETWEEN ? AND ?`;
      params.push(options.start_date, options.end_date);
    } else if (options.start_date) {
      sql += ` AND so.output_date >= ?`;
      params.push(options.start_date);
    } else if (options.end_date) {
      sql += ` AND so.output_date <= ?`;
      params.push(options.end_date);
    }

    // 添加店铺过滤
    if (options.shop_id) {
      sql += ` AND so.shop_id = ?`;
      params.push(options.shop_id);
    }

    sql += ` GROUP BY cc.id, cc.name`;

    const rows = await db.query(sql, params);
    if (rows && rows.length > 0) {
      return rows[0];
    }
    
    const category = await this.getById(categoryId);
    return { 
      category_id: categoryId, 
      category_name: category ? category.name : 'Unknown',
      total_quantity: 0 
    };
  }
}

module.exports = new CourierCategory(); 