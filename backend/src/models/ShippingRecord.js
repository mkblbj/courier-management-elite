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

  /**
   * 获取发货记录列表（支持母子类型数据汇总）
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 发货记录列表
   */
  static async getShippingRecordsWithHierarchy(options = {}) {
    try {
      const { includeHierarchy = false, ...filterOptions } = options;

      // 如果不需要包含层级关系和汇总统计，则调用原有方法
      if (!includeHierarchy) {
        return await ShippingRecord.getAll(filterOptions);
      }

      // 获取所有母类型
      const Courier = require('./Courier');
      const parentTypes = await Courier.getParentTypes();

      console.log(`找到 ${parentTypes.length} 个母类型用于统计`);

      // 为每个母类型计算自身和子类型的发货记录总和
      const results = await Promise.all(
        parentTypes.map(async (parent) => {
          // 获取所有子类型
          const children = await Courier.getChildren(parent.id);
          const childIds = children.map(child => child.id);

          // 获取母类型自身的发货记录
          const parentRecords = await ShippingRecord.getByTypeId(parent.id, filterOptions);

          // 获取子类型的发货记录
          let childrenRecords = [];
          if (childIds.length > 0) {
            childrenRecords = await ShippingRecord.getByTypeIds(childIds, filterOptions);
          }

          // 合并统计数据
          return {
            ...parent,
            children,
            shipping: {
              own: parentRecords,
              children: childrenRecords,
              total: [...parentRecords, ...childrenRecords],
            },
          };
        })
      );

      return results;
    } catch (error) {
      console.error("获取发货记录（包含层级）失败:", error);
      throw error;
    }
  }

  /**
   * 根据类型ID获取发货记录
   * @param {number} typeId 快递类型ID
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 发货记录数组
   */
  static async getByTypeId(typeId, options = {}) {
    try {
      const shippingRecord = new ShippingRecord();
      let sql = `SELECT sr.*, c.name as courier_name 
                 FROM ${shippingRecord.table} sr
                 LEFT JOIN couriers c ON sr.courier_id = c.id
                 WHERE sr.courier_id = ?`;

      const params = [typeId];
      const whereClauses = [];

      // 添加日期筛选
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

      // 组合WHERE子句
      if (whereClauses.length > 0) {
        sql += " AND " + whereClauses.join(" AND ");
      }

      // 添加排序
      const sortBy = shippingRecord.validateSortField(options.sort_by) || 'date';
      const sortOrder = (options.sort_order || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      sql += ` ORDER BY sr.${sortBy} ${sortOrder}`;

      const db = require('../db');
      const results = await db.query(sql, params);
      return results || [];
    } catch (error) {
      console.error(`获取类型ID ${typeId} 的发货记录失败:`, error);
      throw error;
    }
  }

  /**
   * 根据多个类型ID获取发货记录
   * @param {Array<number>} typeIds 快递类型ID数组
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 发货记录数组
   */
  static async getByTypeIds(typeIds, options = {}) {
    try {
      if (!typeIds.length) return [];

      const shippingRecord = new ShippingRecord();
      const placeholders = typeIds.map(() => "?").join(",");
      let sql = `SELECT sr.*, c.name as courier_name 
                 FROM ${shippingRecord.table} sr
                 LEFT JOIN couriers c ON sr.courier_id = c.id
                 WHERE sr.courier_id IN (${placeholders})`;

      const params = [...typeIds];
      const whereClauses = [];

      // 添加日期筛选
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

      // 组合WHERE子句
      if (whereClauses.length > 0) {
        sql += " AND " + whereClauses.join(" AND ");
      }

      // 添加排序
      const sortBy = shippingRecord.validateSortField(options.sort_by) || 'date';
      const sortOrder = (options.sort_order || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      sql += ` ORDER BY sr.${sortBy} ${sortOrder}`;

      const db = require('../db');
      const results = await db.query(sql, params);
      return results || [];
    } catch (error) {
      console.error(`获取多个类型的发货记录失败:`, error);
      throw error;
    }
  }

  /**
   * 获取层级结构的统计数据
   * @param {Object} options 筛选选项
   * @returns {Promise<Array>} 层级结构统计数据
   */
  static async getHierarchicalStats(options = {}) {
    try {
      // 基础SQL查询获取发货记录总量
      let sql = `
        SELECT 
          c.id AS courier_id,
          c.name AS courier_name,
          c.parent_id,
          SUM(sr.quantity) AS total,
          COUNT(sr.id) AS record_count
        FROM 
          shipping_records sr
        INNER JOIN 
          couriers c ON sr.courier_id = c.id
        WHERE 1=1
      `;
      
      // 参数数组
      const params = [];
      
      // 添加日期筛选
      if (options.date) {
        sql += ' AND DATE(sr.date) = DATE(?)';
        params.push(options.date);
      } else if (options.date_from && options.date_to) {
        sql += ' AND DATE(sr.date) BETWEEN DATE(?) AND DATE(?)';
        params.push(options.date_from, options.date_to);
      }
      
      // 按快递类型分组
      sql += ' GROUP BY c.id';
      
      // 执行查询
      const records = await db.query(sql, params);
      
      // 获取所有快递类型，包括层级关系
      const courierTypes = await db.query('SELECT id, name, parent_id FROM couriers');
      
      // 创建父子关系映射
      const parentChildMap = new Map();
      courierTypes.forEach(ct => {
        if (ct.parent_id) {
          if (!parentChildMap.has(ct.parent_id)) {
            parentChildMap.set(ct.parent_id, []);
          }
          parentChildMap.get(ct.parent_id).push(ct.id);
        }
      });
      
      // 创建ID到快递类型的映射
      const courierMap = new Map();
      courierTypes.forEach(ct => {
        courierMap.set(ct.id, {
          id: ct.id,
          name: ct.name,
          parent_id: ct.parent_id,
          total: 0,
          record_count: 0,
          children: []
        });
      });
      
      // 填充统计数据
      records.forEach(record => {
        const courier = courierMap.get(record.courier_id);
        if (courier) {
          courier.total = Number(record.total) || 0;
          courier.record_count = Number(record.record_count) || 0;
        }
      });
      
      // 构建层级结构
      const result = [];
      
      // 递归计算子类型的统计数据之和
      function calculateTotals(courier) {
        let childrenTotal = 0;
        let childrenRecordCount = 0;
        
        // 获取所有子类型
        const childIds = parentChildMap.get(courier.id) || [];
        
        for (const childId of childIds) {
          const child = courierMap.get(childId);
          if (child) {
            // 递归计算子类型的统计数据
            calculateTotals(child);
            
            // 累加子类型的统计数据
            childrenTotal += child.total;
            childrenRecordCount += child.record_count;
            
            // 添加到父类型的children数组
            courier.children.push(child);
          }
        }
        
        // 设置统计数据字段
        courier.own_total = courier.total;
        courier.own_record_count = courier.record_count;
        courier.children_total = childrenTotal;
        courier.children_record_count = childrenRecordCount;
        courier.total_with_children = courier.total + childrenTotal;
        courier.record_count_with_children = courier.record_count + childrenRecordCount;
      }
      
      // 获取所有母类型（parent_id为null的类型）
      courierTypes.forEach(ct => {
        if (!ct.parent_id) {
          const courier = courierMap.get(ct.id);
          if (courier) {
            calculateTotals(courier);
            result.push(courier);
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error('获取层级统计数据错误:', error);
      throw error;
    }
  }
}

// 修改导出方式，同时支持实例方法和静态方法
const instance = new ShippingRecord();
module.exports = ShippingRecord;
module.exports.instance = instance; 