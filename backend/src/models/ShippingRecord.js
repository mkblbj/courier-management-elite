const db = require('../db');
const dateUtils = require('../utils/dateUtils');

class ShippingRecord {
  constructor() {
    this.table = 'shipping_records';
  }

  /**
   * 获取发货记录列表（带分页和筛选）
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 发货记录列表
   */
  async getAll(options = {}) {
    let sql = `SELECT sr.*, c.name as courier_name 
              FROM ${this.table} sr
              LEFT JOIN couriers c ON sr.courier_id = c.id`;

    const params = [];
    const whereClauses = [];

    // 按日期筛选
    if (options.date) {
      // 使用DATE函数比较日期，忽略时区影响
      whereClauses.push("DATE(sr.date) = DATE(?)");
      params.push(options.date);
    }

    // 按日期范围筛选
    if (options.date_from) {
      whereClauses.push("DATE(sr.date) >= DATE(?)");
      params.push(options.date_from);
    }

    if (options.date_to) {
      whereClauses.push("DATE(sr.date) <= DATE(?)");
      params.push(options.date_to);
    }

    // 按快递类型筛选
    if (options.courier_id) {
      whereClauses.push("sr.courier_id = ?");
      params.push(parseInt(options.courier_id, 10));
    }

    // 按多个快递类型筛选
    if (options.courier_ids && Array.isArray(options.courier_ids) && options.courier_ids.length > 0) {
      const placeholders = options.courier_ids.map(() => '?').join(',');
      whereClauses.push(`sr.courier_id IN (${placeholders})`);
      params.push(...options.courier_ids.map(id => parseInt(id, 10)));
    }

    // 按数量范围筛选
    if (options.min_quantity !== undefined && options.min_quantity !== null) {
      whereClauses.push("sr.quantity >= ?");
      params.push(parseInt(options.min_quantity, 10));
    }

    if (options.max_quantity !== undefined && options.max_quantity !== null) {
      whereClauses.push("sr.quantity <= ?");
      params.push(parseInt(options.max_quantity, 10));
    }

    // 按备注关键词搜索
    if (options.notes_search) {
      whereClauses.push("sr.notes LIKE ?");
      params.push(`%${options.notes_search}%`);
    }

    // 组合WHERE子句
    if (whereClauses.length > 0) {
      sql += " WHERE " + whereClauses.join(" AND ");
    }

    // 排序
    const sortBy = this.validateSortField(options.sort_by) || 'date';
    const sortOrder = (options.sort_order || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY sr.${sortBy} ${sortOrder}`;

    // 分页
    if (options.page && options.per_page) {
      const page = Math.max(1, parseInt(options.page, 10));
      const perPage = Math.max(1, parseInt(options.per_page, 10));
      const offset = (page - 1) * perPage;

      // 使用整数值而不是占位符
      sql += ` LIMIT ${offset}, ${perPage}`;
    }

    const results = await db.query(sql, params);
    return results;
  }

  /**
   * 静态版本的获取发货记录列表方法
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 发货记录列表
   */
  static async getAll(options = {}) {
    const instance = new ShippingRecord();
    return await instance.getAll(options);
  }

  /**
   * 验证排序字段是否合法
   * @param {string} field 字段名
   * @returns {string|null} 合法字段名或null
   */
  validateSortField(field) {
    const allowedSortFields = ['id', 'date', 'courier_id', 'quantity', 'created_at', 'updated_at'];
    return allowedSortFields.includes(field) ? field : null;
  }

  /**
   * 获取记录总数（用于分页）
   * @param {Object} options 查询选项
   * @returns {Promise<number>} 记录总数
   */
  async count(options = {}) {
    let sql = `SELECT COUNT(*) as total FROM ${this.table} sr`;

    const params = [];
    const whereClauses = [];

    // 按日期筛选
    if (options.date) {
      // 使用DATE函数比较日期，忽略时区影响
      whereClauses.push("DATE(sr.date) = DATE(?)");
      params.push(options.date);
    }

    // 按日期范围筛选
    if (options.date_from) {
      whereClauses.push("DATE(sr.date) >= DATE(?)");
      params.push(options.date_from);
    }

    if (options.date_to) {
      whereClauses.push("DATE(sr.date) <= DATE(?)");
      params.push(options.date_to);
    }

    // 按快递类型筛选
    if (options.courier_id) {
      whereClauses.push("sr.courier_id = ?");
      params.push(parseInt(options.courier_id, 10));
    }

    // 按多个快递类型筛选
    if (options.courier_ids && Array.isArray(options.courier_ids) && options.courier_ids.length > 0) {
      const placeholders = options.courier_ids.map(() => '?').join(',');
      whereClauses.push(`sr.courier_id IN (${placeholders})`);
      params.push(...options.courier_ids.map(id => parseInt(id, 10)));
    }

    // 按数量范围筛选
    if (options.min_quantity !== undefined && options.min_quantity !== null) {
      whereClauses.push("sr.quantity >= ?");
      params.push(parseInt(options.min_quantity, 10));
    }

    if (options.max_quantity !== undefined && options.max_quantity !== null) {
      whereClauses.push("sr.quantity <= ?");
      params.push(parseInt(options.max_quantity, 10));
    }

    // 按备注关键词搜索
    if (options.notes_search) {
      whereClauses.push("sr.notes LIKE ?");
      params.push(`%${options.notes_search}%`);
    }

    // 组合WHERE子句
    if (whereClauses.length > 0) {
      sql += " WHERE " + whereClauses.join(" AND ");
    }

    const result = await db.query(sql, params);
    return result[0] ? parseInt(result[0].total, 10) : 0;
  }

  /**
   * 根据ID获取发货记录
   * @param {number} id 发货记录ID
   * @returns {Promise<Object|null>} 发货记录对象或null
   */
  async getById(id) {
    const sql = `SELECT sr.*, c.name as courier_name 
                FROM ${this.table} sr
                LEFT JOIN couriers c ON sr.courier_id = c.id
                WHERE sr.id = ?`;
    const results = await db.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 根据日期获取发货记录
   * @param {string} date 日期，格式为YYYY-MM-DD
   * @returns {Promise<Array>} 发货记录数组
   */
  async getByDate(date) {
    const sql = `SELECT sr.*, c.name as courier_name 
                FROM ${this.table} sr
                LEFT JOIN couriers c ON sr.courier_id = c.id
                WHERE DATE(sr.date) = DATE(?)`;
    const results = await db.query(sql, [date]);
    return results;
  }

  /**
   * 根据日期和快递类型ID检查记录是否存在
   * @param {string} date 日期，格式为YYYY-MM-DD
   * @param {number} courierId 快递类型ID
   * @returns {Promise<Object|null>} 存在返回记录对象，不存在返回null
   */
  async getByDateAndCourierId(date, courierId) {
    const sql = `SELECT sr.*, c.name as courier_name 
                FROM ${this.table} sr
                LEFT JOIN couriers c ON sr.courier_id = c.id
                WHERE DATE(sr.date) = DATE(?) AND sr.courier_id = ?`;
    const results = await db.query(sql, [date, courierId]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 获取按快递类型分组的统计数据
   * @param {Object} options 查询选项，支持时间筛选
   * @returns {Promise<Array>} 统计数据数组
   */
  async getStatsByCourier(options = {}) {
    try {
      // 首先获取所有激活状态的快递类型，确保即使没有数据也能返回所有快递类型
      const allCouriersQuery = `SELECT id, name FROM couriers WHERE is_active = 1 ORDER BY sort_order ASC, name ASC`;
      const allCouriers = await db.query(allCouriersQuery);

      // 构建按快递类型分组的统计查询
      let sql = `SELECT c.id as courier_id, c.name as courier_name, 
                 SUM(sr.quantity) as total, 
                 COUNT(sr.id) as record_count 
                 FROM ${this.table} sr
                 LEFT JOIN couriers c ON sr.courier_id = c.id`;

      const params = [];
      const whereClauses = [];

      // 添加时间筛选条件
      if (options.date) {
        whereClauses.push("DATE(sr.date) = DATE(?)");
        params.push(options.date);
      }

      if (options.date_from) {
        whereClauses.push("DATE(sr.date) >= DATE(?)");
        params.push(options.date_from);
      }

      if (options.date_to) {
        whereClauses.push("DATE(sr.date) <= DATE(?)");
        params.push(options.date_to);
      }

      // 按快递类型ID筛选
      if (options.courier_id) {
        whereClauses.push("sr.courier_id = ?");
        params.push(parseInt(options.courier_id, 10));
      }

      // 组合WHERE子句
      if (whereClauses.length > 0) {
        sql += " WHERE " + whereClauses.join(" AND ");
      }

      // 按快递类型分组
      sql += " GROUP BY sr.courier_id";

      // 按总数排序
      sql += " ORDER BY total DESC";

      const statsResults = await db.query(sql, params);

      // 将结果转换为键值对，以便于合并
      const courierStatsMap = {};
      statsResults.forEach(stat => {
        courierStatsMap[stat.courier_id] = stat;
      });

      // 合并所有快递类型信息，为没有数据的快递类型添加零值
      const finalResults = allCouriers.map(courier => {
        return courierStatsMap[courier.id] || {
          courier_id: courier.id,
          courier_name: courier.name,
          total: 0,
          record_count: 0
        };
      });

      return finalResults;
    } catch (error) {
      console.error('获取快递类型统计数据失败:', error);
      return []; // 返回空数组作为默认值
    }
  }

  /**
   * 获取按日期分组的统计数据
   * @param {Object} options 查询选项，支持时间筛选和快递类型筛选
   * @returns {Promise<Array>} 统计数据数组
   */
  async getStatsByDate(options = {}) {
    let sql = `SELECT DATE(sr.date) as date, 
               SUM(sr.quantity) as total, 
               COUNT(sr.id) as record_count 
               FROM ${this.table} sr`;

    const params = [];
    const whereClauses = [];

    // 添加时间筛选条件
    if (options.date) {
      whereClauses.push("DATE(sr.date) = DATE(?)");
      params.push(options.date);
    }

    if (options.date_from) {
      whereClauses.push("DATE(sr.date) >= DATE(?)");
      params.push(options.date_from);
    }

    if (options.date_to) {
      whereClauses.push("DATE(sr.date) <= DATE(?)");
      params.push(options.date_to);
    }

    // 按快递类型ID筛选
    if (options.courier_id) {
      whereClauses.push("sr.courier_id = ?");
      params.push(parseInt(options.courier_id, 10));
    }

    // 组合WHERE子句
    if (whereClauses.length > 0) {
      sql += " WHERE " + whereClauses.join(" AND ");
    }

    // 按日期分组
    sql += " GROUP BY DATE(sr.date)";

    // 按日期排序
    sql += " ORDER BY date ASC";

    const results = await db.query(sql, params);
    return results;
  }

  /**
   * 获取按日期和快递类型分组的统计数据
   * @param {Object} options 查询选项，支持时间筛选
   * @returns {Promise<Array>} 统计数据数组
   */
  async getStatsByDateAndCourier(options = {}) {
    let sql = `SELECT DATE(sr.date) as date, 
               sr.courier_id, 
               c.name as courier_name,
               SUM(sr.quantity) as total 
               FROM ${this.table} sr
               LEFT JOIN couriers c ON sr.courier_id = c.id`;

    const params = [];
    const whereClauses = [];

    // 添加时间筛选条件
    if (options.date) {
      whereClauses.push("DATE(sr.date) = DATE(?)");
      params.push(options.date);
    }

    if (options.date_from) {
      whereClauses.push("DATE(sr.date) >= DATE(?)");
      params.push(options.date_from);
    }

    if (options.date_to) {
      whereClauses.push("DATE(sr.date) <= DATE(?)");
      params.push(options.date_to);
    }

    // 按快递类型ID筛选
    if (options.courier_id) {
      whereClauses.push("sr.courier_id = ?");
      params.push(parseInt(options.courier_id, 10));
    }

    // 组合WHERE子句
    if (whereClauses.length > 0) {
      sql += " WHERE " + whereClauses.join(" AND ");
    }

    // 按日期和快递类型分组
    sql += " GROUP BY DATE(sr.date), sr.courier_id";

    // 按日期和总数排序
    sql += " ORDER BY date ASC, total DESC";

    const results = await db.query(sql, params);
    return results;
  }

  /**
   * 获取总计统计数据
   * @param {Object} options 查询选项，支持时间筛选和快递类型筛选
   * @returns {Promise<Object>} 统计数据对象
   */
  async getStatsTotal(options = {}) {
    let sql = `SELECT SUM(sr.quantity) as total, 
               COUNT(DISTINCT DATE(sr.date)) as days_count, 
               COUNT(sr.id) as record_count 
               FROM ${this.table} sr`;

    const params = [];
    const whereClauses = [];

    // 添加时间筛选条件
    if (options.date) {
      whereClauses.push("DATE(sr.date) = DATE(?)");
      params.push(options.date);
    }

    if (options.date_from) {
      whereClauses.push("DATE(sr.date) >= DATE(?)");
      params.push(options.date_from);
    }

    if (options.date_to) {
      whereClauses.push("DATE(sr.date) <= DATE(?)");
      params.push(options.date_to);
    }

    // 按快递类型ID筛选
    if (options.courier_id) {
      whereClauses.push("sr.courier_id = ?");
      params.push(parseInt(options.courier_id, 10));
    }

    // 组合WHERE子句
    if (whereClauses.length > 0) {
      sql += " WHERE " + whereClauses.join(" AND ");
    }

    const results = await db.query(sql, params);
    return results[0] || { total: 0, days_count: 0, record_count: 0 };
  }

  /**
   * 获取按类别分组的发货统计数据
   * @param {Object} options 查询选项，支持时间筛选
   * @returns {Promise<Array>} 统计数据数组
   */
  async getStatsByCategory(options = {}) {
    try {
      // 首先获取所有快递类别，确保即使没有数据也能返回所有类别
      const allCategoriesQuery = `SELECT id, name FROM courier_categories ORDER BY sort_order ASC, name ASC`;
      const allCategories = await db.query(allCategoriesQuery);

      // 构建按类别分组的统计查询
      let sql = `SELECT 
                  cc.id as category_id, 
                  cc.name as category_name, 
                  SUM(sr.quantity) as total, 
                  COUNT(sr.id) as record_count 
                FROM ${this.table} sr
                JOIN couriers c ON sr.courier_id = c.id
                JOIN courier_categories cc ON c.category_id = cc.id`;

      const params = [];
      const whereClauses = [];

      // 添加时间筛选条件
      if (options.date) {
        whereClauses.push("DATE(sr.date) = DATE(?)");
        params.push(options.date);
      }

      if (options.date_from) {
        whereClauses.push("DATE(sr.date) >= DATE(?)");
        params.push(options.date_from);
      }

      if (options.date_to) {
        whereClauses.push("DATE(sr.date) <= DATE(?)");
        params.push(options.date_to);
      }

      // 按类别ID筛选
      if (options.category_id) {
        whereClauses.push("c.category_id = ?");
        params.push(parseInt(options.category_id, 10));
      }

      // 组合WHERE子句
      if (whereClauses.length > 0) {
        sql += " WHERE " + whereClauses.join(" AND ");
      }

      // 按类别分组
      sql += " GROUP BY cc.id, cc.name";

      // 按总数排序
      sql += " ORDER BY total DESC";

      const statsResults = await db.query(sql, params);

      // 将结果转换为键值对，以便于合并
      const categoryStatsMap = {};
      statsResults.forEach(stat => {
        categoryStatsMap[stat.category_id] = stat;
      });

      // 合并所有类别信息，为没有数据的类别添加零值
      const finalResults = allCategories.map(category => {
        return categoryStatsMap[category.id] || {
          category_id: category.id,
          category_name: category.name,
          total: 0,
          record_count: 0
        };
      });

      return finalResults;
    } catch (error) {
      console.error('获取类别统计数据失败:', error);
      return []; // 返回空数组作为默认值
    }
  }

  /**
   * 添加发货记录
   * @param {Object} data 发货记录数据
   * @returns {Promise<number>} 新创建的记录ID
   */
  async add(data) {
    // 存储时使用DATE函数，确保日期不受时区影响
    const sql = `INSERT INTO ${this.table} (date, courier_id, quantity, notes) VALUES (DATE(?), ?, ?, ?)`;

    const notes = data.notes || null;

    const result = await db.query(sql, [
      data.date,
      data.courier_id,
      data.quantity,
      notes
    ]);

    return result.insertId;
  }

  /**
   * 批量添加发货记录
   * @param {string} date 日期
   * @param {Array<Object>} records 记录数据数组
   * @returns {Promise<Object>} 添加结果
   */
  async batchAdd(date, records) {
    if (!records || !records.length) {
      return { success: true, created: 0, records: [] };
    }

    try {
      return await db.transaction(async (connection) => {
        const createdRecords = [];
        let created = 0;

        for (const record of records) {
          // 组合完整记录数据
          const recordData = {
            date,
            courier_id: record.courier_id,
            quantity: record.quantity,
            notes: record.notes || null
          };

          // 添加记录时使用DATE函数，只保存日期部分
          const [result] = await connection.execute(
            `INSERT INTO ${this.table} (date, courier_id, quantity, notes) VALUES (DATE(?), ?, ?, ?)`,
            [recordData.date, recordData.courier_id, recordData.quantity, recordData.notes]
          );

          if (result.insertId) {
            created++;

            // 获取完整记录信息
            const [rows] = await connection.execute(
              `SELECT sr.*, c.name as courier_name 
               FROM ${this.table} sr
               LEFT JOIN couriers c ON sr.courier_id = c.id
               WHERE sr.id = ?`,
              [result.insertId]
            );

            if (rows.length > 0) {
              createdRecords.push(rows[0]);
            }
          }
        }

        return {
          success: true,
          created,
          records: createdRecords
        };
      });
    } catch (error) {
      return {
        success: false,
        message: '批量添加失败: ' + error.message
      };
    }
  }

  /**
   * 更新发货记录
   * @param {number} id 发货记录ID
   * @param {Object} data 要更新的数据
   * @returns {Promise<boolean>} 更新是否成功
   */
  async update(id, data) {
    const setClauses = [];
    const params = [];

    // 构建SET子句
    if (data.date !== undefined) {
      // 更新时只存储日期部分
      setClauses.push("date = DATE(?)");
      params.push(data.date);
    }

    if (data.courier_id !== undefined) {
      setClauses.push("courier_id = ?");
      params.push(data.courier_id);
    }

    if (data.quantity !== undefined) {
      setClauses.push("quantity = ?");
      params.push(data.quantity);
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
    return result.affectedRows > 0;
  }

  /**
   * 删除发货记录
   * @param {number} id 发货记录ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  async delete(id) {
    const sql = `DELETE FROM ${this.table} WHERE id = ?`;
    const result = await db.query(sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * 获取按日期统计的图表数据
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 适合折线图的数据格式
   */
  async getChartDataByDate(options = {}) {
    try {
      // 获取按日期统计的数据
      const statsByDate = await this.getStatsByDate(options);

      // 转换为适合折线图的格式
      return {
        labels: statsByDate.map(item => item.date),
        datasets: [{
          label: '发货总数',
          data: statsByDate.map(item => item.total)
        }]
      };
    } catch (error) {
      console.error('获取按日期统计的图表数据失败:', error);
      // 返回默认空图表数据
      return {
        labels: [],
        datasets: [{
          label: '发货总数',
          data: []
        }]
      };
    }
  }

  /**
   * 获取按快递类型统计的图表数据
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 适合饼图的数据格式
   */
  async getChartDataByCourier(options = {}) {
    try {
      console.log('正在获取按快递类型统计的饼图数据，参数:', options);

      // 获取按快递类型统计的数据
      const statsByCourier = await this.getStatsByCourier(options);

      // 记录统计数据
      console.log('获取到的原始统计数据:', JSON.stringify(statsByCourier));

      // 数据为空时处理
      if (!statsByCourier || !statsByCourier.length) {
        console.log('没有找到快递类型统计数据，返回空数据');
        return {
          labels: [],
          datasets: [{
            data: []
          }]
        };
      }

      // 过滤掉数量为0的记录以避免饼图显示问题
      const validStats = statsByCourier.filter(item => item.total > 0);

      // 所有记录都是0的情况
      if (!validStats.length) {
        console.log('所有快递数量均为0，返回空数据');
        return {
          labels: [],
          datasets: [{
            data: []
          }]
        };
      }

      // 转换为适合饼图的格式
      const chartData = {
        labels: validStats.map(item => item.courier_name),
        datasets: [{
          data: validStats.map(item => Number(item.total) || 0)
        }]
      };

      console.log('处理后的饼图数据:', JSON.stringify(chartData));
      return chartData;
    } catch (error) {
      console.error('获取按快递类型统计的图表数据失败:', error);
      // 返回默认空图表数据
      return {
        labels: [],
        datasets: [{
          data: []
        }]
      };
    }
  }
}

// 修改导出方式，同时支持实例方法和静态方法
const instance = new ShippingRecord();
module.exports = ShippingRecord;
module.exports.instance = instance; 