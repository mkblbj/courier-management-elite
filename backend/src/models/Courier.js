const db = require('../db');

class Courier {
  constructor() {
    this.table = 'couriers';
  }

  /**
   * 获取所有快递类型
   * @param {Object} options 过滤和排序选项
   * @returns {Promise<Array>} 
   */
  async getAll(options = {}) {
    let sql = `
      SELECT c.*, cc.name as category_name
      FROM ${this.table} c
      LEFT JOIN courier_categories cc ON c.category_id = cc.id
    `;
    const params = [];
    const whereClauses = [];

    // 添加过滤条件
    if (options.is_active !== null && options.is_active !== undefined) {
      whereClauses.push('c.is_active = ?');
      params.push(options.is_active ? 1 : 0);
    }

    if (options.search) {
      whereClauses.push('(c.name LIKE ? OR c.code LIKE ? OR c.remark LIKE ?)');
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // 添加类别过滤
    if (options.category_id !== undefined) {
      whereClauses.push('c.category_id = ?');
      params.push(options.category_id);
    }

    // 添加WHERE子句
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    // 添加排序
    const allowedSortFields = ['id', 'name', 'code', 'is_active', 'sort_order', 'created_at', 'updated_at'];
    const sortBy = allowedSortFields.includes(options.sort_by) ? options.sort_by : 'sort_order';
    const sortOrder = options.sort_order === 'DESC' ? 'DESC' : 'ASC';
    
    sql += ` ORDER BY ${sortBy} ${sortOrder}`;

    return await db.query(sql, params);
  }

  /**
   * 根据ID获取快递类型
   * @param {number} id 快递类型ID
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    const sql = `
      SELECT c.*, cc.name as category_name
      FROM ${this.table} c
      LEFT JOIN courier_categories cc ON c.category_id = cc.id
      WHERE c.id = ?
    `;
    const results = await db.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 添加快递类型
   * @param {Object} data 快递类型数据
   * @returns {Promise<number>} 新创建的ID
   */
  async add(data) {
    const sql = `INSERT INTO ${this.table} (name, code, remark, is_active, sort_order, category_id) VALUES (?, ?, ?, ?, ?, ?)`;
    
    const isActive = data.is_active !== undefined ? data.is_active : true;
    const sortOrder = data.sort_order !== undefined ? data.sort_order : 0;
    const remark = data.remark || null;
    const categoryId = data.category_id || null;

    const result = await db.query(sql, [
      data.name,
      data.code,
      remark,
      isActive ? 1 : 0,
      sortOrder,
      categoryId
    ]);

    return result.insertId;
  }

  /**
   * 更新快递类型
   * @param {number} id 快递类型ID
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
    
    if (data.code !== undefined) {
      setClauses.push("code = ?");
      params.push(data.code);
    }
    
    if (data.remark !== undefined) {
      setClauses.push("remark = ?");
      params.push(data.remark);
    }
    
    if (data.is_active !== undefined) {
      setClauses.push("is_active = ?");
      params.push(data.is_active ? 1 : 0);
    }
    
    if (data.sort_order !== undefined) {
      setClauses.push("sort_order = ?");
      params.push(data.sort_order);
    }
    
    if (data.category_id !== undefined) {
      setClauses.push("category_id = ?");
      params.push(data.category_id);
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
   * 删除快递类型
   * @param {number} id 快递类型ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    const sql = `DELETE FROM ${this.table} WHERE id = ?`;
    const result = await db.query(sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * 切换快递类型启用状态
   * @param {number} id 快递类型ID
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
  
  /**
   * 根据类别获取所有快递类型
   * @param {number} categoryId 类别ID
   * @returns {Promise<Array>} 快递类型列表
   */
  async getByCategoryId(categoryId) {
    return await this.getAll({ category_id: categoryId });
  }
}

module.exports = new Courier(); 