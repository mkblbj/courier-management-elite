const ShippingRecord = require('../models/ShippingRecord');
const dateUtils = require('../utils/dateUtils');

class StatsController {
  /**
   * 获取发货记录统计数据
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getStats(req, res) {
    try {
      // 解析请求参数
      const date = req.query.date || null;
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const courierId = req.query.courier_id ? parseInt(req.query.courier_id) : null;
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
        date_to: finalDateTo,
        courier_id: courierId
      };
      
      // 获取各项统计数据
      const statsByCourier = await ShippingRecord.getStatsByCourier(options);
      const statsByDate = await ShippingRecord.getStatsByDate(options);
      const statsTotal = await ShippingRecord.getStatsTotal(options);
      
      // 返回统计结果
      res.status(200).json({
        success: true,
        data: {
          total: statsTotal,
          by_courier: statsByCourier,
          by_date: statsByDate
        }
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      res.status(500).json({
        success: false,
        message: '获取统计数据失败'
      });
    }
  }
  
  /**
   * 获取按日期和快递公司的详细统计数据
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getDetailedStats(req, res) {
    try {
      // 解析请求参数
      const date = req.query.date || null;
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const courierId = req.query.courier_id ? parseInt(req.query.courier_id) : null;
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
        date_to: finalDateTo,
        courier_id: courierId
      };
      
      // 获取按日期和快递公司统计的详细数据
      const statsByDateAndCourier = await ShippingRecord.getStatsByDateAndCourier(options);
      const statsTotal = await ShippingRecord.getStatsTotal(options);
      
      // 返回统计结果
      res.status(200).json({
        success: true,
        data: {
          total: statsTotal,
          details: statsByDateAndCourier
        }
      });
    } catch (error) {
      console.error('获取详细统计数据失败:', error);
      res.status(500).json({
        success: false,
        message: '获取详细统计数据失败'
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
      
      let chartData = {};
      
      if (chartType === 'line') {
        // 获取折线图数据（按日期统计）
        const statsByDate = await ShippingRecord.getStatsByDate(options);
        
        // 转换为适合折线图的格式
        chartData = {
          labels: statsByDate.map(item => item.date),
          datasets: [{
            label: '发货总数',
            data: statsByDate.map(item => item.total)
          }]
        };
      } else if (chartType === 'pie') {
        // 获取饼图数据（按快递公司统计）
        const statsByCourier = await ShippingRecord.getStatsByCourier(options);
        
        // 转换为适合饼图的格式
        chartData = {
          labels: statsByCourier.map(item => item.courier_name),
          datasets: [{
            data: statsByCourier.map(item => item.total)
          }]
        };
      }
      
      // 返回图表数据
      res.status(200).json({
        success: true,
        data: chartData
      });
    } catch (error) {
      console.error('获取图表数据失败:', error);
      res.status(500).json({
        success: false,
        message: '获取图表数据失败'
      });
    }
  }
}

module.exports = new StatsController(); 