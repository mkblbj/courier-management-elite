const ShippingRecord = require('../models/ShippingRecord');
const ShopOutput = require('../models/ShopOutput');
const dateUtils = require('../utils/dateUtils');
const { formatToISOString, getToday, parseDate } = require('../config/timezone');

// 创建ShippingRecord实例用于访问实例方法
const shippingRecordInstance = new ShippingRecord();

class StatsController {
  /**
   * 获取统计数据
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getStats(req, res) {
    try {
      // 解析请求参数
      const date = req.query.date || null;
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const week = req.query.week ? parseInt(req.query.week) : null;
      const month = req.query.month ? parseInt(req.query.month) : null;
      const quarter = req.query.quarter ? parseInt(req.query.quarter) : null;
      const year = req.query.year ? parseInt(req.query.year) : null;
      
      // 处理按年、月、季度、周筛选，转换为date_from和date_to
      let calculatedDateFrom = null;
      let calculatedDateTo = null;
      
      // 使用dateUtils工具函数获取日期范围
      const currentYear = new Date().getFullYear();
      
      // 根据参数组合确定日期范围
      if (year) {
        if (month) {
          // 年+月
          const dateRange = dateUtils.getMonthDateRange(year, month);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        } else if (quarter) {
          // 年+季度
          const dateRange = dateUtils.getQuarterDateRange(year, quarter);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        } else if (week) {
          // 年+周
          const dateRange = dateUtils.getWeekDateRange(year, week);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        } else {
          // 仅年份
          const dateRange = dateUtils.getYearDateRange(year);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        }
      } else if (month) {
        // 仅月份，使用当前年
        const dateRange = dateUtils.getMonthDateRange(currentYear, month);
        calculatedDateFrom = dateRange.start;
        calculatedDateTo = dateRange.end;
      } else if (quarter) {
        // 仅季度，使用当前年
        const dateRange = dateUtils.getQuarterDateRange(currentYear, quarter);
        calculatedDateFrom = dateRange.start;
        calculatedDateTo = dateRange.end;
      } else if (week) {
        // 仅周数，使用当前年
        const dateRange = dateUtils.getWeekDateRange(currentYear, week);
        calculatedDateFrom = dateRange.start;
        calculatedDateTo = dateRange.end;
      }
      
      // 原有日期筛选优先级高于计算的日期范围
      const finalDateFrom = dateFrom || calculatedDateFrom;
      const finalDateTo = dateTo || calculatedDateTo;
      
      const options = {
        date,
        date_from: finalDateFrom,
        date_to: finalDateTo
      };
      
      try {
        // 获取各项统计数据
        const statsByCourier = await shippingRecordInstance.getStatsByCourier(options);
        const statsByDate = await shippingRecordInstance.getStatsByDate(options);
        const statsTotal = await shippingRecordInstance.getStatsTotal(options);
        
        // 返回统计结果
        res.status(200).json({
          success: true,
          data: {
            by_courier: statsByCourier || [],
            by_date: statsByDate || [], 
            total: statsTotal || { total: 0 }
          }
        });
      } catch (error) {
        console.error('获取统计数据查询错误:', error);
        // 即使查询出错，也返回一个一致的数据结构
        res.status(200).json({
          success: true,
          data: {
            by_courier: [],
            by_date: [],
            total: { total: 0 }
          }
        });
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      // 返回服务器错误，但保持数据结构一致
      res.status(500).json({
        success: false,
        message: '获取统计数据失败',
        data: {
          by_courier: [],
          by_date: [],
          total: { total: 0 }
        }
      });
    }
  }
  
  /**
   * 获取详细统计数据（按日期+快递类型）
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getDetailedStats(req, res) {
    try {
      // 解析请求参数
      const date = req.query.date || null;
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const week = req.query.week ? parseInt(req.query.week) : null;
      const month = req.query.month ? parseInt(req.query.month) : null;
      const quarter = req.query.quarter ? parseInt(req.query.quarter) : null;
      const year = req.query.year ? parseInt(req.query.year) : null;
      
      // 处理按年、月、季度、周筛选，转换为date_from和date_to
      let calculatedDateFrom = null;
      let calculatedDateTo = null;
      
      // 使用dateUtils工具函数获取日期范围
      const currentYear = new Date().getFullYear();
      
      // 根据参数组合确定日期范围
      if (year) {
        if (month) {
          // 年+月
          const dateRange = dateUtils.getMonthDateRange(year, month);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        } else if (quarter) {
          // 年+季度
          const dateRange = dateUtils.getQuarterDateRange(year, quarter);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        } else if (week) {
          // 年+周
          const dateRange = dateUtils.getWeekDateRange(year, week);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        } else {
          // 仅年份
          const dateRange = dateUtils.getYearDateRange(year);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        }
      } else if (month) {
        // 仅月份，使用当前年
        const dateRange = dateUtils.getMonthDateRange(currentYear, month);
        calculatedDateFrom = dateRange.start;
        calculatedDateTo = dateRange.end;
      } else if (quarter) {
        // 仅季度，使用当前年
        const dateRange = dateUtils.getQuarterDateRange(currentYear, quarter);
        calculatedDateFrom = dateRange.start;
        calculatedDateTo = dateRange.end;
      } else if (week) {
        // 仅周数，使用当前年
        const dateRange = dateUtils.getWeekDateRange(currentYear, week);
        calculatedDateFrom = dateRange.start;
        calculatedDateTo = dateRange.end;
      }
      
      // 原有日期筛选优先级高于计算的日期范围
      const finalDateFrom = dateFrom || calculatedDateFrom;
      const finalDateTo = dateTo || calculatedDateTo;
      
      const options = {
        date,
        date_from: finalDateFrom,
        date_to: finalDateTo
      };
      
      try {
        // 获取按日期和快递类型统计的详细数据
        const statsByDateAndCourier = await shippingRecordInstance.getStatsByDateAndCourier(options);
        const statsTotal = await shippingRecordInstance.getStatsTotal(options);
        
        // 返回统计结果
        res.status(200).json({
          success: true,
          data: {
            by_date_and_courier: statsByDateAndCourier || [],
            total: statsTotal || { total: 0 }
          }
        });
      } catch (error) {
        console.error('获取详细统计数据查询错误:', error);
        // 即使查询出错，也返回一个一致的数据结构
        res.status(200).json({
          success: true,
          data: {
            by_date_and_courier: [],
            total: { total: 0 }
          }
        });
      }
    } catch (error) {
      console.error('获取详细统计数据失败:', error);
      // 返回服务器错误，但保持数据结构一致
      res.status(500).json({
        success: false,
        message: '获取详细统计数据失败',
        data: {
          by_date_and_courier: [],
          total: { total: 0 }
        }
      });
    }
  }
  
  /**
   * 获取用于图表展示的统计数据
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getChartData(req, res) {
    try {
      // 解析请求参数
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const chartType = req.query.type || 'line'; // 默认折线图，可选值: line, pie
      const week = req.query.week ? parseInt(req.query.week) : null;
      const month = req.query.month ? parseInt(req.query.month) : null;
      const quarter = req.query.quarter ? parseInt(req.query.quarter) : null;
      const year = req.query.year ? parseInt(req.query.year) : null;
      
      // 处理按年、月、季度、周筛选，转换为date_from和date_to
      let calculatedDateFrom = null;
      let calculatedDateTo = null;
      
      // 使用dateUtils工具函数获取日期范围
      const currentYear = new Date().getFullYear();
      
      // 根据参数组合确定日期范围
      if (year) {
        if (month) {
          // 年+月
          const dateRange = dateUtils.getMonthDateRange(year, month);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        } else if (quarter) {
          // 年+季度
          const dateRange = dateUtils.getQuarterDateRange(year, quarter);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        } else if (week) {
          // 年+周
          const dateRange = dateUtils.getWeekDateRange(year, week);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        } else {
          // 仅年份
          const dateRange = dateUtils.getYearDateRange(year);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        }
      } else if (month) {
        // 仅月份，使用当前年
        const dateRange = dateUtils.getMonthDateRange(currentYear, month);
        calculatedDateFrom = dateRange.start;
        calculatedDateTo = dateRange.end;
      } else if (quarter) {
        // 仅季度，使用当前年
        const dateRange = dateUtils.getQuarterDateRange(currentYear, quarter);
        calculatedDateFrom = dateRange.start;
        calculatedDateTo = dateRange.end;
      } else if (week) {
        // 仅周数，使用当前年
        const dateRange = dateUtils.getWeekDateRange(currentYear, week);
        calculatedDateFrom = dateRange.start;
        calculatedDateTo = dateRange.end;
      }
      
      // 原有日期筛选优先级高于计算的日期范围
      const finalDateFrom = dateFrom || calculatedDateFrom;
      const finalDateTo = dateTo || calculatedDateTo;
      
      const options = {
        date_from: finalDateFrom,
        date_to: finalDateTo
      };
      
      try {
        let chartData = null;
        
        // 根据图表类型获取相应的数据
        if (chartType === 'pie') {
          // 饼图数据 - 按快递类型分布
          chartData = await shippingRecordInstance.getChartDataByCourier(options);
        } else {
          // 折线图数据 - 按日期趋势
          chartData = await shippingRecordInstance.getChartDataByDate(options);
        }
        
        // 检查返回的图表数据
        if (!chartData || 
            !chartData.labels || 
            !Array.isArray(chartData.labels) || 
            !chartData.datasets || 
            !Array.isArray(chartData.datasets)) {
          chartData = { labels: [], datasets: [{ data: [] }] };
        }
        
        // 返回图表数据
        res.status(200).json({
          success: true,
          data: chartData
        });
      } catch (error) {
        console.error('获取图表数据查询错误:', error);
        // 即使查询出错，也返回一个一致的数据结构，避免前端渲染错误
        res.status(200).json({
          success: true,
          data: { labels: [], datasets: [{ data: [] }] }
        });
      }
    } catch (error) {
      console.error('获取图表数据失败:', error);
      // 返回服务器错误，但保持数据结构一致
      res.status(500).json({
        success: false,
        message: '获取图表数据失败',
        data: { labels: [], datasets: [{ data: [] }] }
      });
    }
  }

  /**
   * 获取快递类型层级结构统计数据
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getHierarchicalStats(req, res) {
    try {
      // 解析请求参数
      const date = req.query.date || null;
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const week = req.query.week ? parseInt(req.query.week) : null;
      const month = req.query.month ? parseInt(req.query.month) : null;
      const quarter = req.query.quarter ? parseInt(req.query.quarter) : null;
      const year = req.query.year ? parseInt(req.query.year) : null;
      
      // 处理按年、月、季度、周筛选，转换为date_from和date_to
      let calculatedDateFrom = null;
      let calculatedDateTo = null;
      
      // 使用dateUtils工具函数获取日期范围
      const currentYear = new Date().getFullYear();
      
      // 根据参数组合确定日期范围
      if (year) {
        if (month) {
          // 年+月
          const dateRange = dateUtils.getMonthDateRange(year, month);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        } else if (quarter) {
          // 年+季度
          const dateRange = dateUtils.getQuarterDateRange(year, quarter);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        } else if (week) {
          // 年+周
          const dateRange = dateUtils.getWeekDateRange(year, week);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        } else {
          // 仅年份
          const dateRange = dateUtils.getYearDateRange(year);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        }
      } else if (month) {
        // 仅月份，使用当前年
        const dateRange = dateUtils.getMonthDateRange(currentYear, month);
        calculatedDateFrom = dateRange.start;
        calculatedDateTo = dateRange.end;
      } else if (quarter) {
        // 仅季度，使用当前年
        const dateRange = dateUtils.getQuarterDateRange(currentYear, quarter);
        calculatedDateFrom = dateRange.start;
        calculatedDateTo = dateRange.end;
      } else if (week) {
        // 仅周数，使用当前年
        const dateRange = dateUtils.getWeekDateRange(currentYear, week);
        calculatedDateFrom = dateRange.start;
        calculatedDateTo = dateRange.end;
      }
      
      // 原有日期筛选优先级高于计算的日期范围
      const finalDateFrom = dateFrom || calculatedDateFrom;
      const finalDateTo = dateTo || calculatedDateTo;
      
      const options = {
        date,
        date_from: finalDateFrom,
        date_to: finalDateTo
      };
      
      try {
        // 获取层级结构的统计数据
        const hierarchicalStats = await ShippingRecord.getHierarchicalStats(options);
        const statsTotal = await shippingRecordInstance.getStatsTotal(options);
        
        // 返回统计结果
        res.status(200).json({
          success: true,
          data: {
            total: statsTotal || { total: 0 },
            hierarchical: hierarchicalStats || []
          }
        });
      } catch (error) {
        console.error('获取层级统计数据查询错误:', error);
        // 即使查询出错，也返回一个一致的数据结构
        res.status(200).json({
          success: true,
          data: {
            total: { total: 0 },
            hierarchical: []
          }
        });
      }
    } catch (error) {
      console.error('获取层级统计数据失败:', error);
      // 返回服务器错误，但保持数据结构一致
      res.status(500).json({
        success: false,
        message: '获取层级统计数据失败',
        data: {
          total: { total: 0 },
          hierarchical: []
        }
      });
    }
  }

  /**
   * 获取店铺出力数据按店铺统计
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getShopOutputsByShop(req, res) {
    try {
      // 解析请求参数
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      
      // 创建一个自定义SQL查询来按店铺统计出力数据
      const db = require('../db');
      
      let sql = `
        SELECT 
          s.id as shop_id, 
          s.name as shop_name, 
          SUM(so.quantity) as total_quantity,
          COUNT(DISTINCT so.output_date) as days_count
        FROM 
          shop_outputs so
        JOIN 
          shops s ON so.shop_id = s.id
        WHERE 
          1=1
      `;
      
      const params = [];
      
      if (dateFrom) {
        sql += ` AND so.output_date >= ?`;
        params.push(dateFrom);
      }
      
      if (dateTo) {
        sql += ` AND so.output_date <= ?`;
        params.push(dateTo);
      }
      
      sql += `
        GROUP BY 
          s.id, s.name
        ORDER BY 
          total_quantity DESC
      `;
      
      const results = await db.query(sql, params);
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: results
      });
    } catch (error) {
      console.error('按店铺统计出力数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '统计数据查询失败'
      });
    }
  }

  /**
   * 获取店铺出力数据按快递类型统计
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getShopOutputsByCourier(req, res) {
    try {
      // 解析请求参数
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const shopId = req.query.shop_id ? parseInt(req.query.shop_id) : null;
      
      // 创建一个自定义SQL查询来按快递类型统计出力数据
      const db = require('../db');
      
      let sql = `
        SELECT 
          c.id as courier_id, 
          c.name as courier_name, 
          c.parent_id,
          SUM(so.quantity) as total_quantity,
          COUNT(DISTINCT so.output_date) as days_count
        FROM 
          shop_outputs so
        JOIN 
          couriers c ON so.courier_id = c.id
        WHERE 
          1=1
      `;
      
      const params = [];
      
      if (shopId) {
        sql += ` AND so.shop_id = ?`;
        params.push(shopId);
      }
      
      if (dateFrom) {
        sql += ` AND so.output_date >= ?`;
        params.push(dateFrom);
      }
      
      if (dateTo) {
        sql += ` AND so.output_date <= ?`;
        params.push(dateTo);
      }
      
      sql += `
        GROUP BY 
          c.id, c.name, c.parent_id
        ORDER BY 
          total_quantity DESC
      `;
      
      const results = await db.query(sql, params);
      
      // 处理层级结构，如果需要
      const hierarchyResults = this.processHierarchy(results);
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: hierarchyResults
      });
    } catch (error) {
      console.error('按快递类型统计出力数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '统计数据查询失败'
      });
    }
  }

  /**
   * 获取店铺出力数据按日期统计
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getShopOutputsByDate(req, res) {
    try {
      // 解析请求参数
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const shopId = req.query.shop_id ? parseInt(req.query.shop_id) : null;
      const courierId = req.query.courier_id ? parseInt(req.query.courier_id) : null;
      
      // 创建一个自定义SQL查询来按日期统计出力数据
      const db = require('../db');
      
      let sql = `
        SELECT 
          so.output_date, 
          SUM(so.quantity) as total_quantity,
          COUNT(DISTINCT so.shop_id) as shops_count
        FROM 
          shop_outputs so
        WHERE 
          1=1
      `;
      
      const params = [];
      
      if (shopId) {
        sql += ` AND so.shop_id = ?`;
        params.push(shopId);
      }
      
      if (courierId) {
        sql += ` AND so.courier_id = ?`;
        params.push(courierId);
      }
      
      if (dateFrom) {
        sql += ` AND so.output_date >= ?`;
        params.push(dateFrom);
      }
      
      if (dateTo) {
        sql += ` AND so.output_date <= ?`;
        params.push(dateTo);
      }
      
      sql += `
        GROUP BY 
          so.output_date
        ORDER BY 
          so.output_date DESC
      `;
      
      const results = await db.query(sql, params);
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: results
      });
    } catch (error) {
      console.error('按日期统计出力数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '统计数据查询失败'
      });
    }
  }

  /**
   * 获取店铺出力数据总计
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getShopOutputsTotal(req, res) {
    try {
      // 解析请求参数
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const shopId = req.query.shop_id ? parseInt(req.query.shop_id) : null;
      const courierId = req.query.courier_id ? parseInt(req.query.courier_id) : null;
      
      // 创建一个自定义SQL查询来获取总计数据
      const db = require('../db');
      
      let sql = `
        SELECT 
          SUM(so.quantity) as total_quantity,
          COUNT(DISTINCT so.id) as total_records,
          COUNT(DISTINCT so.shop_id) as total_shops,
          COUNT(DISTINCT so.courier_id) as total_couriers,
          COUNT(DISTINCT so.output_date) as total_days,
          MIN(so.output_date) as earliest_date,
          MAX(so.output_date) as latest_date,
          AVG(so.quantity) as average_quantity
        FROM 
          shop_outputs so
        WHERE 
          1=1
      `;
      
      const params = [];
      
      if (shopId) {
        sql += ` AND so.shop_id = ?`;
        params.push(shopId);
      }
      
      if (courierId) {
        sql += ` AND so.courier_id = ?`;
        params.push(courierId);
      }
      
      if (dateFrom) {
        sql += ` AND so.output_date >= ?`;
        params.push(dateFrom);
      }
      
      if (dateTo) {
        sql += ` AND so.output_date <= ?`;
        params.push(dateTo);
      }
      
      const results = await db.query(sql, params);
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: results[0] || {
          total_quantity: 0,
          total_records: 0,
          total_shops: 0,
          total_couriers: 0,
          total_days: 0,
          earliest_date: null,
          latest_date: null,
          average_quantity: 0
        }
      });
    } catch (error) {
      console.error('获取出力数据总计失败:', error);
      res.status(500).json({
        code: 500,
        message: '统计数据查询失败'
      });
    }
  }
  
  /**
   * 处理层级结构
   * @param {Array|Object} results 结果数组或对象
   * @returns {Array} 处理后的数组
   */
  processHierarchy(results) {
    // 确保传入的结果是数组
    const dataArray = Array.isArray(results) ? results : 
                     (results && typeof results === 'object' ? [results] : []);
    
    // 这里简化处理，只返回处理后的数组
    // 实际项目中可能需要根据parent_id构建层级结构
    return dataArray;
  }
}

module.exports = new StatsController(); 