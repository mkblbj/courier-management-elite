const db = require('../db');

class Shop {
  constructor() {
    this.table = 'shops';
  }

  /**
   * 获取所有店铺
   * @param {Object} options 过滤和排序选项
   * @returns {Promise<Array>} 
   */
  async getAll(options = {}) {
    let sql = `
      SELECT s.*, c.name as category_name 
      FROM ${this.table} s 
      LEFT JOIN shop_categories c ON s.category_id = c.id
    `;
    const params = [];
    const whereClauses = [];

    // 添加过滤条件
    if (options.is_active !== null && options.is_active !== undefined) {
      whereClauses.push('s.is_active = ?');
      params.push(options.is_active ? 1 : 0);
    }

    if (options.category_id) {
      whereClauses.push('s.category_id = ?');
      params.push(options.category_id);
    }

    if (options.search) {
      whereClauses.push('(s.name LIKE ? OR s.remark LIKE ?)');
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm, searchTerm);
    }

    // 添加WHERE子句
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    // 添加排序
    const allowedSortFields = ['id', 'name', 'is_active', 'sort_order', 'created_at', 'updated_at'];
    const sortBy = allowedSortFields.includes(options.sort_by) ? `s.${options.sort_by}` : 's.sort_order';
    const sortOrder = options.sort_order === 'DESC' ? 'DESC' : 'ASC';
    
    sql += ` ORDER BY ${sortBy} ${sortOrder}`;

    return await db.query(sql, params);
  }

  /**
   * 根据ID获取店铺
   * @param {number} id 店铺ID
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    const sql = `
      SELECT s.*, c.name as category_name 
      FROM ${this.table} s 
      LEFT JOIN shop_categories c ON s.category_id = c.id
      WHERE s.id = ?
    `;
    const results = await db.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 添加店铺
   * @param {Object} data 店铺数据
   * @returns {Promise<number>} 新创建的ID
   */
  async add(data) {
    const fields = ['name', 'category_id', 'is_active', 'sort_order', 'remark'];
    const values = [
      data.name,
      data.category_id || null,
      (data.is_active !== undefined ? data.is_active : true) ? 1 : 0,
      data.sort_order !== undefined ? data.sort_order : 0,
      data.remark || null,
    ];
    if (data.mercari_access_token) {
      fields.push('mercari_access_token');
      values.push(data.mercari_access_token);
    }
    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.table} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await db.query(sql, values);

    return result.insertId;
  }

  /**
   * 更新店铺
   * @param {number} id 店铺ID
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
    
    if (data.category_id !== undefined) {
      setClauses.push("category_id = ?");
      params.push(data.category_id);
    }
    
    if (data.is_active !== undefined) {
      setClauses.push("is_active = ?");
      params.push(data.is_active ? 1 : 0);
    }
    
    if (data.sort_order !== undefined) {
      setClauses.push("sort_order = ?");
      params.push(data.sort_order);
    }
    
    if (data.remark !== undefined) {
      setClauses.push("remark = ?");
      params.push(data.remark);
    }
    if (data.mercari_access_token !== undefined) {
      setClauses.push("mercari_access_token = ?");
      params.push(data.mercari_access_token);
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
   * 删除店铺
   * @param {number} id 店铺ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    // 我们可能需要先检查是否有关联的出力数据
    // 但由于有外键约束，如果存在关联记录，数据库会拒绝删除
    const sql = `DELETE FROM ${this.table} WHERE id = ?`;
    const result = await db.query(sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * 切换店铺启用状态
   * @param {number} id 店铺ID
   * @returns {Promise<boolean>} 是否成功
   */
  async toggleActive(id) {
    const sql = `UPDATE ${this.table} SET is_active = NOT is_active WHERE id = ?`;
    const result = await db.query(sql, [id]);
    return result.affectedRows > 0;
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
}

module.exports = new Shop(); 