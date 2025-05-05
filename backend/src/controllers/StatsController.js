const ShippingRecord = require('../models/ShippingRecord');
const dateUtils = require('../utils/dateUtils');

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
}

module.exports = new StatsController(); 