// @ts-nocheck
const db = require('../db');
const { formatToISOString, parseDate, getToday } = require('../config/timezone');

class ShopOutput {
  constructor() {
    this.table = 'shop_outputs';
  }

  /**
   * 获取所有店铺出力数据
   * @param {Object} options 过滤和排序选项
   * @returns {Promise<Array>} 
   */
  async getAll(options = {}) {
    let sql = `
      SELECT so.*, s.name as shop_name, c.name as courier_name 
      FROM ${this.table} so
      LEFT JOIN shops s ON so.shop_id = s.id
      LEFT JOIN couriers c ON so.courier_id = c.id
    `;
    const params = [];
    const whereClauses = [];

    // 添加过滤条件
    if (options.shop_id) {
      whereClauses.push('so.shop_id = ?');
      params.push(options.shop_id);
    }

    if (options.courier_id) {
      whereClauses.push('so.courier_id = ?');
      params.push(options.courier_id);
    }

    if (options.output_date) {
      whereClauses.push('so.output_date = ?');
      params.push(options.output_date);
    }

    if (options.date_from) {
      whereClauses.push('so.output_date >= ?');
      params.push(options.date_from);
    }

    if (options.date_to) {
      whereClauses.push('so.output_date <= ?');
      params.push(options.date_to);
    }

    if (options.search) {
      whereClauses.push('(s.name LIKE ? OR c.name LIKE ? OR so.notes LIKE ?)');
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // 添加WHERE子句
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    // 添加排序
    const allowedSortFields = ['id', 'shop_id', 'courier_id', 'output_date', 'quantity', 'created_at', 'updated_at'];
    const sortBy = allowedSortFields.includes(options.sort_by) ? options.sort_by : 'output_date';
    const sortOrder = options.sort_order === 'ASC' ? 'ASC' : 'DESC';
    
    sql += ` ORDER BY so.${sortBy} ${sortOrder}`;
    
    // 添加分页
    if (options.limit && options.limit > 0) {
      sql += ' LIMIT ?';
      params.push(parseInt(options.limit));
      
      if (options.offset && options.offset > 0) {
        sql += ' OFFSET ?';
        params.push(parseInt(options.offset));
      }
    }

    // 转换返回结果为数组
    const results = await db.query(sql, params);
    return Array.isArray(results) ? results : [];
  }

  /**
   * 根据ID获取出力数据
   * @param {number} id 出力数据ID
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    const sql = `
      SELECT so.*, s.name as shop_name, c.name as courier_name 
      FROM ${this.table} so
      LEFT JOIN shops s ON so.shop_id = s.id
      LEFT JOIN couriers c ON so.courier_id = c.id
      WHERE so.id = ?
    `;
    const results = await db.query(sql, [id]);
    // 确保返回数组并处理第一个元素
    const rows = Array.isArray(results) ? results : [];
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * 添加出力数据
   * @param {Object} data 出力数据
   * @returns {Promise<number>} 新创建的ID
   */
  async add(data) {
    // 支持新的操作类型字段
    const sql = `INSERT INTO ${this.table} (shop_id, courier_id, output_date, quantity, operation_type, original_quantity, merge_note, related_record_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const quantity = data.quantity || 0;
    const notes = data.notes || null;
    const operationType = data.operation_type || 'add';
    const originalQuantity = data.original_quantity || null;
    const mergeNote = data.merge_note || null;
    const relatedRecordId = data.related_record_id || null;

    const result = await db.query(sql, [
      data.shop_id,
      data.courier_id,
      data.output_date,
      quantity,
      operationType,
      originalQuantity,
      mergeNote,
      relatedRecordId,
      notes
    ]);

    // 处理不同类型的返回结果以获取insertId
    return result && result.insertId ? result.insertId : 
           (Array.isArray(result) && result[0] && result[0].insertId ? result[0].insertId : 0);
  }

  /**
   * 更新出力数据
   * @param {number} id 出力数据ID
   * @param {Object} data 更新的数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  async update(id, data) {
    const setClauses = [];
    const params = [];
    
    // 构建SET子句
    if (data.shop_id !== undefined) {
      setClauses.push("shop_id = ?");
      params.push(data.shop_id);
    }
    
    if (data.courier_id !== undefined) {
      setClauses.push("courier_id = ?");
      params.push(data.courier_id);
    }
    
    if (data.output_date !== undefined) {
      setClauses.push("output_date = ?");
      params.push(data.output_date);
    }
    
    if (data.quantity !== undefined) {
      setClauses.push("quantity = ?");
      params.push(data.quantity);
    }
    
    if (data.operation_type !== undefined) {
      setClauses.push("operation_type = ?");
      params.push(data.operation_type);
    }
    
    if (data.original_quantity !== undefined) {
      setClauses.push("original_quantity = ?");
      params.push(data.original_quantity);
    }
    
    if (data.merge_note !== undefined) {
      setClauses.push("merge_note = ?");
      params.push(data.merge_note);
    }
    
    if (data.related_record_id !== undefined) {
      setClauses.push("related_record_id = ?");
      params.push(data.related_record_id);
    }
    
    if (data.notes !== undefined) {
      setClauses.push("notes = ?");
      params.push(data.notes);
    }
    
    // 如果没有需要更新的字段，直接返回成功
    if (setClauses.length === 0) {
      return true;
    }
    
    // 将ID添加到参数数组末尾
    params.push(id);
    
    const sql = `UPDATE ${this.table} SET ${setClauses.join(", ")} WHERE id = ?`;
    
    const result = await db.query(sql, params);
    // 处理不同类型的返回结果以获取affectedRows
    return result && result.affectedRows ? result.affectedRows > 0 : 
           (Array.isArray(result) && result[0] && result[0].affectedRows ? result[0].affectedRows > 0 : false);
  }

  /**
   * 删除出力数据
   * @param {number} id 出力数据ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    const sql = `DELETE FROM ${this.table} WHERE id = ?`;
    const result = await db.query(sql, [id]);
    // 处理不同类型的返回结果以获取affectedRows
    return result && result.affectedRows ? result.affectedRows > 0 : 
           (Array.isArray(result) && result[0] && result[0].affectedRows ? result[0].affectedRows > 0 : false);
  }

  /**
   * 获取最近录入的出力数据
   * @param {number} limit 限制返回记录数
   * @returns {Promise<Array>} 出力数据列表
   */
  async getRecent(limit = 10) {
    const sql = `
      SELECT so.*, s.name as shop_name, c.name as courier_name 
      FROM ${this.table} so
      LEFT JOIN shops s ON so.shop_id = s.id
      LEFT JOIN couriers c ON so.courier_id = c.id
      ORDER BY so.created_at DESC
      LIMIT ?
    `;
    const results = await db.query(sql, [limit]);
    // 转换返回结果为数组
    return Array.isArray(results) ? results : [];
  }

  /**
   * 获取今日出力数据
   * @returns {Promise<Array>} 今日出力数据列表
   */
  async getTodayOutputs() {
    const today = new Date().toISOString().split('T')[0]; // 获取当前日期 YYYY-MM-DD
    
    const sql = `
      SELECT so.*, s.name as shop_name, c.name as courier_name 
      FROM ${this.table} so
      LEFT JOIN shops s ON so.shop_id = s.id
      LEFT JOIN couriers c ON so.courier_id = c.id
      WHERE so.output_date = ?
      ORDER BY so.shop_id, so.courier_id
    `;
    
    const results = await db.query(sql, [today]);
    // 转换返回结果为数组
    return Array.isArray(results) ? results : [];
  }

  /**
   * 获取指定日期的出力数据
   * @param {string} date 日期 YYYY-MM-DD
   * @returns {Promise<Array>} 出力数据列表
   */
  async getOutputsByDate(date) {
    // 确保日期格式正确
    const formattedDate = typeof date === 'string' ? date : formatToISOString(date, false);
    
    const sql = `
      SELECT so.*, s.name as shop_name, c.name as courier_name 
      FROM ${this.table} so
      LEFT JOIN shops s ON so.shop_id = s.id
      LEFT JOIN couriers c ON so.courier_id = c.id
      WHERE so.output_date = ?
      ORDER BY s.name, c.name
    `;
    
    const results = await db.query(sql, [formattedDate]);
    // 转换返回结果为数组
    return Array.isArray(results) ? results : [];
  }

  /**
   * 获取指定店铺和日期范围的数据总量
   * @param {number} shopId 店铺ID
   * @param {string} dateFrom 开始日期 YYYY-MM-DD
   * @param {string} dateTo 结束日期 YYYY-MM-DD
   * @returns {Promise<number>} 总量
   */
  async getTotalQuantityByShopAndDateRange(shopId, dateFrom, dateTo) {
    // 确保日期格式正确
    const formattedDateFrom = typeof dateFrom === 'string' ? dateFrom : formatToISOString(dateFrom, false);
    const formattedDateTo = typeof dateTo === 'string' ? dateTo : formatToISOString(dateTo, false);
    
    const sql = `
      SELECT SUM(quantity) as total
      FROM ${this.table}
      WHERE shop_id = ? AND output_date BETWEEN ? AND ?
    `;
    
    const results = await db.query(sql, [shopId, formattedDateFrom, formattedDateTo]);
    // 处理结果，确保有返回值
    const rows = Array.isArray(results) ? results : [];
    return rows[0]?.total || 0;
  }

  /**
   * 获取指定快递类型和日期范围的数据总量
   * @param {number} courierId 快递类型ID
   * @param {string} dateFrom 开始日期 YYYY-MM-DD
   * @param {string} dateTo 结束日期 YYYY-MM-DD
   * @returns {Promise<number>} 总量
   */
  async getTotalQuantityByCourierAndDateRange(courierId, dateFrom, dateTo) {
    // 确保日期格式正确
    const formattedDateFrom = typeof dateFrom === 'string' ? dateFrom : formatToISOString(dateFrom, false);
    const formattedDateTo = typeof dateTo === 'string' ? dateTo : formatToISOString(dateTo, false);
    
    const sql = `
      SELECT SUM(quantity) as total
      FROM ${this.table}
      WHERE courier_id = ? AND output_date BETWEEN ? AND ?
    `;
    
    const results = await db.query(sql, [courierId, formattedDateFrom, formattedDateTo]);
    // 处理结果，确保有返回值
    const rows = Array.isArray(results) ? results : [];
    return rows[0]?.total || 0;
  }

  /**
   * 根据店铺ID、快递类型ID和日期获取出力记录
   * @param {number} shopId 店铺ID
   * @param {number} courierId 快递类型ID
   * @param {string} date 日期 YYYY-MM-DD
   * @returns {Promise<Object|null>} 出力记录
   */
  async getByShopCourierDate(shopId, courierId, date) {
    // 确保日期格式正确
    const formattedDate = typeof date === 'string' ? date : formatToISOString(date, false);
    
    const sql = `
      SELECT so.*, s.name as shop_name, c.name as courier_name 
      FROM ${this.table} so
      LEFT JOIN shops s ON so.shop_id = s.id
      LEFT JOIN couriers c ON so.courier_id = c.id
      WHERE so.shop_id = ? AND so.courier_id = ? AND so.output_date = ?
    `;
    
    const results = await db.query(sql, [shopId, courierId, formattedDate]);
    // 处理结果，确保有返回值
    const rows = Array.isArray(results) ? results : [];
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * 获取已累加的今日出力数据
   * @returns {Promise<Array>} 今日出力数据列表（已按店铺和快递类型分组累加）
   */
  async getAggregatedTodayOutputs() {
    // 使用时区配置中的方法获取今天的日期
    const today = formatToISOString(getToday(), false);
    return this.getAggregatedOutputsByDate(today);
  }

  /**
   * 获取指定日期的已累加出力数据
   * @param {string} date 日期 YYYY-MM-DD
   * @returns {Promise<Array>} 出力数据列表（已按店铺和快递类型分组累加）
   */
  async getAggregatedOutputsByDate(date) {
    // 首先获取原始数据
    const outputs = await this.getOutputsByDate(date);
    
    // 用于按shop_id和courier_id分组的对象
    const groupedOutputs = {};
    
    // 按shop_id和courier_id分组并累加quantity
    outputs.forEach(output => {
      const key = `${output.shop_id}-${output.courier_id}`;
      if (!groupedOutputs[key]) {
        // 创建一个新对象，保留原始记录的所有属性
        groupedOutputs[key] = {
          ...output,
          original_id: output.id, // 保存原始ID供参考
          quantity: 0 // 重置数量，准备累加
        };
      }
      // 累加数量
      groupedOutputs[key].quantity += output.quantity;
    });
    
    // 将分组结果转换为数组
    return Object.values(groupedOutputs);
  }

  /**
   * 根据操作类型获取出力数据
   * @param {string} operationType 操作类型 ('add', 'subtract', 'merge')
   * @param {Object} options 其他过滤选项
   * @returns {Promise<Array>} 出力数据列表
   */
  async getByOperationType(operationType, options = {}) {
    let sql = `
      SELECT so.*, s.name as shop_name, c.name as courier_name 
      FROM ${this.table} so
      LEFT JOIN shops s ON so.shop_id = s.id
      LEFT JOIN couriers c ON so.courier_id = c.id
      WHERE so.operation_type = ?
    `;
    const params = [operationType];

    // 添加其他过滤条件
    if (options.output_date) {
      sql += ' AND so.output_date = ?';
      params.push(options.output_date);
    }

    if (options.date_from) {
      sql += ' AND so.output_date >= ?';
      params.push(options.date_from);
    }

    if (options.date_to) {
      sql += ' AND so.output_date <= ?';
      params.push(options.date_to);
    }

    if (options.shop_id) {
      sql += ' AND so.shop_id = ?';
      params.push(options.shop_id);
    }

    if (options.courier_id) {
      sql += ' AND so.courier_id = ?';
      params.push(options.courier_id);
    }

    // 添加排序
    sql += ' ORDER BY so.created_at DESC';

    // 添加分页
    if (options.limit && options.limit > 0) {
      sql += ' LIMIT ?';
      params.push(parseInt(options.limit));
      
      if (options.offset && options.offset > 0) {
        sql += ' OFFSET ?';
        params.push(parseInt(options.offset));
      }
    }

    const results = await db.query(sql, params);
    return Array.isArray(results) ? results : [];
  }

  /**
   * 获取按操作类型分组的统计数据
   * @param {Object} options 过滤选项
   * @returns {Promise<Array>} 统计数据
   */
  async getStatsByOperationType(options = {}) {
    let sql = `
      SELECT 
        so.operation_type,
        COUNT(*) as record_count,
        SUM(so.quantity) as total_quantity,
        AVG(so.quantity) as avg_quantity
      FROM ${this.table} so
    `;
    const params = [];
    const whereClauses = [];

    // 添加过滤条件
    if (options.output_date) {
      whereClauses.push('so.output_date = ?');
      params.push(options.output_date);
    }

    if (options.date_from) {
      whereClauses.push('so.output_date >= ?');
      params.push(options.date_from);
    }

    if (options.date_to) {
      whereClauses.push('so.output_date <= ?');
      params.push(options.date_to);
    }

    if (options.shop_id) {
      whereClauses.push('so.shop_id = ?');
      params.push(options.shop_id);
    }

    if (options.courier_id) {
      whereClauses.push('so.courier_id = ?');
      params.push(options.courier_id);
    }

    // 添加WHERE子句
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    sql += ' GROUP BY so.operation_type ORDER BY total_quantity DESC';

    const results = await db.query(sql, params);
    return Array.isArray(results) ? results : [];
  }

  /**
   * 计算指定条件下的净增长量
   * @param {Object} options 过滤选项
   * @returns {Promise<Object>} 净增长统计
   */
  async getNetGrowthStats(options = {}) {
    let sql = `
      SELECT 
        SUM(CASE WHEN so.operation_type = 'add' THEN so.quantity ELSE 0 END) as add_total,
        SUM(CASE WHEN so.operation_type = 'subtract' THEN ABS(so.quantity) ELSE 0 END) as subtract_total,
        SUM(CASE WHEN so.operation_type = 'merge' THEN so.quantity ELSE 0 END) as merge_total,
        COUNT(CASE WHEN so.operation_type = 'add' THEN 1 END) as add_count,
        COUNT(CASE WHEN so.operation_type = 'subtract' THEN 1 END) as subtract_count,
        COUNT(CASE WHEN so.operation_type = 'merge' THEN 1 END) as merge_count
      FROM ${this.table} so
    `;
    const params = [];
    const whereClauses = [];

    // 添加过滤条件
    if (options.output_date) {
      whereClauses.push('so.output_date = ?');
      params.push(options.output_date);
    }

    if (options.date_from) {
      whereClauses.push('so.output_date >= ?');
      params.push(options.date_from);
    }

    if (options.date_to) {
      whereClauses.push('so.output_date <= ?');
      params.push(options.date_to);
    }

    if (options.shop_id) {
      whereClauses.push('so.shop_id = ?');
      params.push(options.shop_id);
    }

    if (options.courier_id) {
      whereClauses.push('so.courier_id = ?');
      params.push(options.courier_id);
    }

    // 添加WHERE子句
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    const results = await db.query(sql, params);
    const data = Array.isArray(results) && results.length > 0 ? results[0] : {};
    
    // 计算净增长量（合单参与净增长计算）
    const addTotal = parseInt(data.add_total) || 0;
    const subtractTotal = parseInt(data.subtract_total) || 0;
    const mergeTotal = parseInt(data.merge_total) || 0;
    // 净增长 = 新增 - 减少 + 合单（合单为负数，表示减少）
    // 例如：新增3单(+3) + 合2单(-1) + 减少0单(0) = 2单
    const netGrowth = addTotal - subtractTotal + mergeTotal;

    return {
      add_total: addTotal,
      subtract_total: subtractTotal,
      merge_total: mergeTotal,
      net_growth: netGrowth,
      add_count: parseInt(data.add_count) || 0,
      subtract_count: parseInt(data.subtract_count) || 0,
      merge_count: parseInt(data.merge_count) || 0,
      total_operations: (parseInt(data.add_count) || 0) + (parseInt(data.subtract_count) || 0) + (parseInt(data.merge_count) || 0)
    };
  }
}

module.exports = new ShopOutput(); 