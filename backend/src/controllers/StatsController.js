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
   * 获取店铺出力数据按店铺统计
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getShopOutputsByShop(req, res) {
    try {
      // 解析请求参数
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const courierId = req.query.courier_id ? parseInt(req.query.courier_id) : null;
      const categoryId = req.query.category_id ? parseInt(req.query.category_id) : null;
      
      // 打印请求参数
      console.log('按店铺统计请求参数:', { date_from: dateFrom, date_to: dateTo, courier_id: courierId, category_id: categoryId });
      
      // 创建一个自定义SQL查询来按店铺统计出力数据
      const db = require('../db');
      
      let sql = `
        SELECT 
          s.id as shop_id, 
          s.name as shop_name,
          s.category_id,
          sc.name as category_name,
          SUM(so.quantity) as total_quantity,
          COUNT(DISTINCT so.output_date) as days_count
        FROM 
          shop_outputs so
        JOIN 
          shops s ON so.shop_id = s.id
        LEFT JOIN 
          shop_categories sc ON s.category_id = sc.id
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
      
      if (courierId) {
        sql += ` AND so.courier_id = ?`;
        params.push(courierId);
      }
      
      if (categoryId) {
        sql += ` AND s.category_id = ?`;
        params.push(categoryId);
      }
      
      sql += `
        GROUP BY 
          s.id, s.name, s.category_id, sc.name
        ORDER BY 
          total_quantity DESC
      `;
      
      const results = await db.query(sql, params);
      
      // 处理未分类的情况 (category_id 可能为 NULL)
      const processedResults = Array.isArray(results) ? results.map(row => {
        if (row.category_id === null) {
          return {
            ...row,
            category_id: 0,
            category_name: '未分类'
          };
        }
        return row;
      }) : [];
      
      // 计算总量用于占比计算
      const totalQuantity = processedResults.reduce((sum, item) => {
        const quantity = parseFloat(item.total_quantity) || 0;
        return sum + quantity;
      }, 0);
      
      // 为每个店铺添加占比和日均量
      processedResults.forEach(item => {
        const quantity = parseFloat(item.total_quantity) || 0;
        const daysCount = parseInt(item.days_count) || 1;
        
        // 计算占比
        item.percentage = totalQuantity > 0 ? parseFloat(((quantity / totalQuantity) * 100).toFixed(2)) : 0;
        
        // 计算日均量
        item.daily_average = parseFloat((quantity / daysCount).toFixed(2));
      });
      
      // 计算同比和环比变化率
      if (dateFrom && dateTo) {
        try {
          const currentPeriodStart = new Date(dateFrom);
          const currentPeriodEnd = new Date(dateTo);
          const currentPeriodDays = Math.round((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          // 计算环比和同比的日期范围
          // 1. 环比（上个时间段）
          const momPeriodEnd = new Date(currentPeriodStart);
          momPeriodEnd.setDate(momPeriodEnd.getDate() - 1);
          
          const momPeriodStart = new Date(momPeriodEnd);
          momPeriodStart.setDate(momPeriodStart.getDate() - currentPeriodDays + 1);
          
          // 2. 同比（去年同期）
          const yoyPeriodStart = new Date(currentPeriodStart);
          yoyPeriodStart.setFullYear(yoyPeriodStart.getFullYear() - 1);
          
          const yoyPeriodEnd = new Date(currentPeriodEnd);
          yoyPeriodEnd.setFullYear(yoyPeriodEnd.getFullYear() - 1);
          
          // 格式化日期为 YYYY-MM-DD
          const formatDate = (date) => {
            return date.toISOString().split('T')[0];
          };
          
          const momDateFrom = formatDate(momPeriodStart);
          const momDateTo = formatDate(momPeriodEnd);
          const yoyDateFrom = formatDate(yoyPeriodStart);
          const yoyDateTo = formatDate(yoyPeriodEnd);
          
          console.log('环比日期范围:', { momDateFrom, momDateTo });
          console.log('同比日期范围:', { yoyDateFrom, yoyDateTo });
          
          // 获取环比周期的数据
          let momSql = `
            SELECT 
              s.id as shop_id, 
              s.name as shop_name, 
              SUM(so.quantity) as total_quantity
            FROM 
              shop_outputs so
            JOIN 
              shops s ON so.shop_id = s.id
            LEFT JOIN 
              shop_categories sc ON s.category_id = sc.id
            WHERE 
              so.output_date >= ? AND so.output_date <= ?
          `;
          
          const momParams = [momDateFrom, momDateTo];
          
          if (courierId) {
            momSql += ` AND so.courier_id = ?`;
            momParams.push(courierId);
          }
          
          if (categoryId) {
            momSql += ` AND s.category_id = ?`;
            momParams.push(categoryId);
          }
          
          momSql += `
            GROUP BY 
              s.id, s.name
          `;
          
          // 获取同比周期的数据
          let yoySql = `
            SELECT 
              s.id as shop_id, 
              s.name as shop_name, 
              SUM(so.quantity) as total_quantity
            FROM 
              shop_outputs so
            JOIN 
              shops s ON so.shop_id = s.id
            LEFT JOIN 
              shop_categories sc ON s.category_id = sc.id
            WHERE 
              so.output_date >= ? AND so.output_date <= ?
          `;
          
          const yoyParams = [yoyDateFrom, yoyDateTo];
          
          if (courierId) {
            yoySql += ` AND so.courier_id = ?`;
            yoyParams.push(courierId);
          }
          
          if (categoryId) {
            yoySql += ` AND s.category_id = ?`;
            yoyParams.push(categoryId);
          }
          
          yoySql += `
            GROUP BY 
              s.id, s.name
          `;
          
          // 执行查询
          const momResults = await db.query(momSql, momParams);
          const yoyResults = await db.query(yoySql, yoyParams);
          
          // 创建映射表用于快速查找
          const momDataMap = new Map();
          (Array.isArray(momResults) ? momResults : []).forEach(item => {
            momDataMap.set(item.shop_id, parseFloat(item.total_quantity) || 0);
          });
          
          const yoyDataMap = new Map();
          (Array.isArray(yoyResults) ? yoyResults : []).forEach(item => {
            yoyDataMap.set(item.shop_id, parseFloat(item.total_quantity) || 0);
          });
          
          console.log('环比数据:', momResults);
          console.log('同比数据:', yoyResults);
          
          // 计算变化率并添加到结果中
          for (const item of processedResults) {
            const currentQuantity = parseFloat(item.total_quantity) || 0;
            const momPreviousQuantity = momDataMap.get(item.shop_id) || 0;
            const yoyPreviousQuantity = yoyDataMap.get(item.shop_id) || 0;
            
            console.log(`店铺 ${item.shop_name}: 当前=${currentQuantity}, 环比上期=${momPreviousQuantity}, 同比上期=${yoyPreviousQuantity}`);
            
            // 计算环比变化率
            if (momPreviousQuantity > 0) {
              const momChangeRate = ((currentQuantity - momPreviousQuantity) / momPreviousQuantity) * 100;
              item.mom_change_rate = parseFloat(momChangeRate.toFixed(2));
              
              if (momChangeRate > 0) {
                item.mom_change_type = 'increase';
              } else if (momChangeRate < 0) {
                item.mom_change_type = 'decrease';
              } else {
                item.mom_change_type = 'unchanged';
              }
            } else if (currentQuantity > 0 && momPreviousQuantity === 0) {
              item.mom_change_rate = 100;
              item.mom_change_type = 'increase';
            } else if (currentQuantity === 0 && momPreviousQuantity === 0) {
              item.mom_change_rate = 0;
              item.mom_change_type = 'unchanged';
            } else if (currentQuantity === 0 && momPreviousQuantity > 0) {
              item.mom_change_rate = -100;
              item.mom_change_type = 'decrease';
            } else {
              item.mom_change_rate = 0;
              item.mom_change_type = 'unchanged';
            }
            
            // 计算同比变化率
            if (yoyPreviousQuantity > 0) {
              const yoyChangeRate = ((currentQuantity - yoyPreviousQuantity) / yoyPreviousQuantity) * 100;
              item.yoy_change_rate = parseFloat(yoyChangeRate.toFixed(2));
              
              if (yoyChangeRate > 0) {
                item.yoy_change_type = 'increase';
              } else if (yoyChangeRate < 0) {
                item.yoy_change_type = 'decrease';
              } else {
                item.yoy_change_type = 'unchanged';
              }
            } else if (currentQuantity > 0 && yoyPreviousQuantity === 0) {
              item.yoy_change_rate = 100;
              item.yoy_change_type = 'increase';
            } else if (currentQuantity === 0 && yoyPreviousQuantity === 0) {
              item.yoy_change_rate = 0;
              item.yoy_change_type = 'unchanged';
            } else if (currentQuantity === 0 && yoyPreviousQuantity > 0) {
              item.yoy_change_rate = -100;
              item.yoy_change_type = 'decrease';
            } else {
              item.yoy_change_rate = 0;
              item.yoy_change_type = 'unchanged';
            }
            
            console.log(`    环比变化率: ${item.mom_change_rate}%, 同比变化率: ${item.yoy_change_rate}%`);
          }
        } catch (error) {
          console.error('计算变化率出错:', error);
          // 如果计算出错，确保仍然返回数据，但不包含变化率信息
          processedResults.forEach(item => {
            item.mom_change_rate = 0;
            item.mom_change_type = 'unchanged';
            item.yoy_change_rate = 0;
            item.yoy_change_type = 'unchanged';
          });
        }
      }
      
      // 打印响应数据
      console.log('按店铺统计响应数据:', {
        code: 0,
        message: '获取成功',
        data: processedResults.slice(0, 2) // 只打印前两条作为样本
      });
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: processedResults
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
      const categoryId = req.query.category_id ? parseInt(req.query.category_id) : null;
      
      console.log('按快递类型统计请求参数:', { date_from: dateFrom, date_to: dateTo, shop_id: shopId, category_id: categoryId });
      
      // 创建一个自定义SQL查询来按快递类型统计出力数据
      const db = require('../db');
      
      // 首先获取总量用于计算百分比
      let totalSql = `
        SELECT SUM(so.quantity) as grand_total
        FROM shop_outputs so
        JOIN couriers c ON so.courier_id = c.id
      `;
      
      if (shopId || categoryId) {
        totalSql += ` JOIN shops s ON so.shop_id = s.id`;
      }
      
      totalSql += ` WHERE 1=1`;
      
      const totalParams = [];
      
      if (shopId) {
        totalSql += ` AND so.shop_id = ?`;
        totalParams.push(shopId);
      }
      
      if (categoryId) {
        totalSql += ` AND s.category_id = ?`;
        totalParams.push(categoryId);
      }
      
      if (dateFrom) {
        totalSql += ` AND so.output_date >= ?`;
        totalParams.push(dateFrom);
      }
      
      if (dateTo) {
        totalSql += ` AND so.output_date <= ?`;
        totalParams.push(dateTo);
      }
      
      const totalResult = await db.query(totalSql, totalParams);
      const grandTotal = totalResult[0]?.grand_total || 0;
      
      // 获取按快递类型统计的数据
      let sql = `
        SELECT 
          c.id as courier_id, 
          c.name as courier_name, 
          SUM(so.quantity) as total_quantity,
          COUNT(DISTINCT so.output_date) as days_count,
          COUNT(DISTINCT so.shop_id) as shops_count
        FROM 
          shop_outputs so
        JOIN 
          couriers c ON so.courier_id = c.id
      `;
      
      if (shopId || categoryId) {
        sql += ` JOIN shops s ON so.shop_id = s.id`;
      }
      
      sql += ` WHERE 1=1`;
      
      const params = [];
      
      if (shopId) {
        sql += ` AND so.shop_id = ?`;
        params.push(shopId);
      }
      
      if (categoryId) {
        sql += ` AND s.category_id = ?`;
        params.push(categoryId);
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
          c.id, c.name
        ORDER BY 
          total_quantity DESC
      `;
      
      const results = await db.query(sql, params);
      
      // 计算百分比和日均量
      const processedResults = (Array.isArray(results) ? results : []).map(item => {
        const totalQuantity = parseInt(item.total_quantity) || 0;
        const daysCount = parseInt(item.days_count) || 1;
        const percentage = grandTotal > 0 ? parseFloat(((totalQuantity / grandTotal) * 100).toFixed(2)) : 0;
        const dailyAverage = parseFloat((totalQuantity / daysCount).toFixed(2));
        
        return {
          courier_id: item.courier_id,
          courier_name: item.courier_name,
          total_quantity: totalQuantity,
          percentage: percentage,
          daily_average: dailyAverage,
          shops_count: parseInt(item.shops_count) || 0,
          days_count: daysCount
        };
      });
      
      // 计算同比和环比变化率
      if (dateFrom && dateTo) {
        try {
          const currentPeriodStart = new Date(dateFrom);
          const currentPeriodEnd = new Date(dateTo);
          const currentPeriodDays = Math.round((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          // 计算环比和同比的日期范围
          // 1. 环比（上个时间段）
          const momPeriodEnd = new Date(currentPeriodStart);
          momPeriodEnd.setDate(momPeriodEnd.getDate() - 1);
          
          const momPeriodStart = new Date(momPeriodEnd);
          momPeriodStart.setDate(momPeriodStart.getDate() - currentPeriodDays + 1);
          
          // 2. 同比（去年同期）
          const yoyPeriodStart = new Date(currentPeriodStart);
          yoyPeriodStart.setFullYear(yoyPeriodStart.getFullYear() - 1);
          
          const yoyPeriodEnd = new Date(currentPeriodEnd);
          yoyPeriodEnd.setFullYear(yoyPeriodEnd.getFullYear() - 1);
          
          // 格式化日期为 YYYY-MM-DD
          const formatDate = (date) => {
            return date.toISOString().split('T')[0];
          };
          
          const momDateFrom = formatDate(momPeriodStart);
          const momDateTo = formatDate(momPeriodEnd);
          const yoyDateFrom = formatDate(yoyPeriodStart);
          const yoyDateTo = formatDate(yoyPeriodEnd);
          
          console.log('环比日期范围:', { momDateFrom, momDateTo });
          console.log('同比日期范围:', { yoyDateFrom, yoyDateTo });
          
          // 获取环比周期的数据
          let momSql = `
            SELECT 
              c.id as courier_id, 
              c.name as courier_name, 
              SUM(so.quantity) as total_quantity
            FROM 
              shop_outputs so
            JOIN 
              couriers c ON so.courier_id = c.id
          `;
          
          if (shopId || categoryId) {
            momSql += ` JOIN shops s ON so.shop_id = s.id`;
          }
          
          momSql += ` WHERE so.output_date >= ? AND so.output_date <= ?`;
          
          const momParams = [momDateFrom, momDateTo];
          
          if (shopId) {
            momSql += ` AND so.shop_id = ?`;
            momParams.push(shopId);
          }
          
          if (categoryId) {
            momSql += ` AND s.category_id = ?`;
            momParams.push(categoryId);
          }
          
          momSql += `
            GROUP BY 
              c.id, c.name
          `;
          
          // 获取同比周期的数据
          let yoySql = `
            SELECT 
              c.id as courier_id, 
              c.name as courier_name, 
              SUM(so.quantity) as total_quantity
            FROM 
              shop_outputs so
            JOIN 
              couriers c ON so.courier_id = c.id
          `;
          
          if (shopId || categoryId) {
            yoySql += ` JOIN shops s ON so.shop_id = s.id`;
          }
          
          yoySql += ` WHERE so.output_date >= ? AND so.output_date <= ?`;
          
          const yoyParams = [yoyDateFrom, yoyDateTo];
          
          if (shopId) {
            yoySql += ` AND so.shop_id = ?`;
            yoyParams.push(shopId);
          }
          
          if (categoryId) {
            yoySql += ` AND s.category_id = ?`;
            yoyParams.push(categoryId);
          }
          
          yoySql += `
            GROUP BY 
              c.id, c.name
          `;
          
          // 执行查询
          const momResults = await db.query(momSql, momParams);
          const yoyResults = await db.query(yoySql, yoyParams);
          
          // 创建映射表用于快速查找
          const momDataMap = new Map();
          (Array.isArray(momResults) ? momResults : []).forEach(item => {
            momDataMap.set(item.courier_id, parseFloat(item.total_quantity) || 0);
          });
          
          const yoyDataMap = new Map();
          (Array.isArray(yoyResults) ? yoyResults : []).forEach(item => {
            yoyDataMap.set(item.courier_id, parseFloat(item.total_quantity) || 0);
          });
          
          console.log('环比数据:', momResults);
          console.log('同比数据:', yoyResults);
          
          // 计算变化率并添加到结果中
          for (const item of processedResults) {
            const currentQuantity = Number(item.total_quantity) || 0;
            const momPreviousQuantity = momDataMap.get(item.courier_id) || 0;
            const yoyPreviousQuantity = yoyDataMap.get(item.courier_id) || 0;
            
            console.log(`快递类型 ${item.courier_name}: 当前=${currentQuantity}, 环比上期=${momPreviousQuantity}, 同比上期=${yoyPreviousQuantity}`);
            
            // 计算环比变化率
            if (momPreviousQuantity > 0) {
              const momChangeRate = ((currentQuantity - momPreviousQuantity) / momPreviousQuantity) * 100;
              item.mom_change_rate = parseFloat(momChangeRate.toFixed(2));
              
              if (momChangeRate > 0) {
                item.mom_change_type = 'increase';
              } else if (momChangeRate < 0) {
                item.mom_change_type = 'decrease';
              } else {
                item.mom_change_type = 'unchanged';
              }
            } else if (currentQuantity > 0 && momPreviousQuantity === 0) {
              item.mom_change_rate = 100;
              item.mom_change_type = 'increase';
            } else if (currentQuantity === 0 && momPreviousQuantity === 0) {
              item.mom_change_rate = 0;
              item.mom_change_type = 'unchanged';
            } else if (currentQuantity === 0 && momPreviousQuantity > 0) {
              item.mom_change_rate = -100;
              item.mom_change_type = 'decrease';
            } else {
              item.mom_change_rate = 0;
              item.mom_change_type = 'unchanged';
            }
            
            // 计算同比变化率
            if (yoyPreviousQuantity > 0) {
              const yoyChangeRate = ((currentQuantity - yoyPreviousQuantity) / yoyPreviousQuantity) * 100;
              item.yoy_change_rate = parseFloat(yoyChangeRate.toFixed(2));
              
              if (yoyChangeRate > 0) {
                item.yoy_change_type = 'increase';
              } else if (yoyChangeRate < 0) {
                item.yoy_change_type = 'decrease';
              } else {
                item.yoy_change_type = 'unchanged';
              }
            } else if (currentQuantity > 0 && yoyPreviousQuantity === 0) {
              item.yoy_change_rate = 100;
              item.yoy_change_type = 'increase';
            } else if (currentQuantity === 0 && yoyPreviousQuantity === 0) {
              item.yoy_change_rate = 0;
              item.yoy_change_type = 'unchanged';
            } else if (currentQuantity === 0 && yoyPreviousQuantity > 0) {
              item.yoy_change_rate = -100;
              item.yoy_change_type = 'decrease';
            } else {
              item.yoy_change_rate = 0;
              item.yoy_change_type = 'unchanged';
            }
            
            console.log(`    环比变化率: ${item.mom_change_rate}%, 同比变化率: ${item.yoy_change_rate}%`);
          }
        } catch (error) {
          console.error('计算变化率出错:', error);
          // 如果计算出错，确保仍然返回数据，但不包含变化率信息
          processedResults.forEach(item => {
            item.mom_change_rate = 0;
            item.mom_change_type = 'unchanged';
            item.yoy_change_rate = 0;
            item.yoy_change_type = 'unchanged';
          });
        }
      }
      
      // 打印响应数据
      console.log('按快递类型统计响应数据:', {
        code: 0,
        message: '获取成功',
        data: processedResults.slice(0, 2) // 只打印前两条作为样本
      });
      
      // 返回符合前端期望的数据结构
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: processedResults
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
      const categoryId = req.query.category_id ? parseInt(req.query.category_id) : null;
      const groupBy = req.query.group_by || 'day'; // day, week, month, year
      
      console.log('按日期统计请求参数:', { date_from: dateFrom, date_to: dateTo, shop_id: shopId, courier_id: courierId, category_id: categoryId, group_by: groupBy });
      
      // 创建一个自定义SQL查询来按日期统计出力数据
      const db = require('../db');
      
      // 根据分组方式构建不同的SQL
      let dateGroupExpression;
      let dateOrderExpression;
      
      switch (groupBy) {
        case 'week':
          dateGroupExpression = `DATE_FORMAT(so.output_date, '%Y-%u')`;
          dateOrderExpression = `DATE_FORMAT(so.output_date, '%Y-%u')`;
          break;
        case 'month':
          dateGroupExpression = `DATE_FORMAT(so.output_date, '%Y-%m')`;
          dateOrderExpression = `DATE_FORMAT(so.output_date, '%Y-%m')`;
          break;
        case 'year':
          dateGroupExpression = `DATE_FORMAT(so.output_date, '%Y')`;
          dateOrderExpression = `DATE_FORMAT(so.output_date, '%Y')`;
          break;
        default: // day
          dateGroupExpression = `so.output_date`;
          dateOrderExpression = `so.output_date`;
      }
      
      let sql = `
        SELECT 
          ${dateGroupExpression} as date, 
          SUM(so.quantity) as total_quantity,
          COUNT(DISTINCT so.shop_id) as shops_count,
          COUNT(DISTINCT so.courier_id) as couriers_count,
          AVG(so.quantity) as avg_quantity
        FROM 
          shop_outputs so
      `;
      
      // 如果需要按类别筛选，需要JOIN shops表
      if (categoryId) {
        sql += ` JOIN shops s ON so.shop_id = s.id`;
      }
      
      sql += ` WHERE 1=1`;
      
      const params = [];
      
      if (shopId) {
        sql += ` AND so.shop_id = ?`;
        params.push(shopId);
      }
      
      if (courierId) {
        sql += ` AND so.courier_id = ?`;
        params.push(courierId);
      }
      
      if (categoryId) {
        sql += ` AND s.category_id = ?`;
        params.push(categoryId);
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
          ${dateGroupExpression}
        ORDER BY 
          ${dateOrderExpression} ASC
      `;
      
      const results = await db.query(sql, params);
      
      // 处理结果，计算环比和同比变化
      const processedResults = [];
      const resultsArray = Array.isArray(results) ? results : [];
      
      for (let i = 0; i < resultsArray.length; i++) {
        const current = resultsArray[i];
        const item = {
          date: current?.date || '',
          total_quantity: parseInt(current?.total_quantity) || 0,
          shops_count: parseInt(current?.shops_count) || 0,
          couriers_count: parseInt(current?.couriers_count) || 0,
          avg_quantity: parseFloat(current?.avg_quantity) || 0,
          mom_change_rate: 0,
          mom_change_type: 'unchanged',
          yoy_change_rate: 0,
          yoy_change_type: 'unchanged'
        };
        
        // 计算环比（与前一期相比）
        if (i > 0) {
          const previous = results[i - 1];
          const previousQuantity = parseInt(previous.total_quantity) || 0;
          const currentQuantity = parseInt(current.total_quantity) || 0;
          
          if (previousQuantity > 0) {
            const momChangeRate = ((currentQuantity - previousQuantity) / previousQuantity) * 100;
            item.mom_change_rate = parseFloat(momChangeRate.toFixed(2));
            
            if (momChangeRate > 0) {
              item.mom_change_type = 'increase';
            } else if (momChangeRate < 0) {
              item.mom_change_type = 'decrease';
            } else {
              item.mom_change_type = 'unchanged';
            }
          } else if (currentQuantity > 0) {
            item.mom_change_rate = 100;
            item.mom_change_type = 'increase';
          }
        }
        
        // 计算同比（与去年同期相比）
        try {
          let yoyDate;
          if (groupBy === 'day') {
            const currentDate = new Date(current.date);
            yoyDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
          } else if (groupBy === 'week') {
            const [year, week] = current.date.split('-');
            yoyDate = `${parseInt(year) - 1}-${week}`;
          } else if (groupBy === 'month') {
            const [year, month] = current.date.split('-');
            yoyDate = `${parseInt(year) - 1}-${month}`;
          } else if (groupBy === 'year') {
            yoyDate = `${parseInt(current.date) - 1}`;
          }
          
          if (yoyDate) {
            // 查询去年同期数据
            let yoySql = `
              SELECT SUM(so.quantity) as total_quantity
              FROM shop_outputs so
            `;
            
            if (categoryId) {
              yoySql += ` JOIN shops s ON so.shop_id = s.id`;
            }
            
            yoySql += ` WHERE ${dateGroupExpression} = ?`;
            
            const yoyParams = [yoyDate];
            
            if (shopId) {
              yoySql += ` AND so.shop_id = ?`;
              yoyParams.push(shopId.toString());
            }
            
            if (courierId) {
              yoySql += ` AND so.courier_id = ?`;
              yoyParams.push(courierId.toString());
            }
            
            if (categoryId) {
              yoySql += ` AND s.category_id = ?`;
              yoyParams.push(categoryId.toString());
            }
            
            const yoyResults = await db.query(yoySql, yoyParams);
            
            if (Array.isArray(yoyResults) && yoyResults.length > 0) {
              const yoyQuantity = parseInt(yoyResults[0].total_quantity) || 0;
              const currentQuantity = parseInt(current.total_quantity) || 0;
              
              if (yoyQuantity > 0) {
                const yoyChangeRate = ((currentQuantity - yoyQuantity) / yoyQuantity) * 100;
                item.yoy_change_rate = parseFloat(yoyChangeRate.toFixed(2));
                
                if (yoyChangeRate > 0) {
                  item.yoy_change_type = 'increase';
                } else if (yoyChangeRate < 0) {
                  item.yoy_change_type = 'decrease';
                } else {
                  item.yoy_change_type = 'unchanged';
                }
              } else if (currentQuantity > 0) {
                item.yoy_change_rate = 100;
                item.yoy_change_type = 'increase';
              }
            }
          }
        } catch (error) {
          console.warn('计算同比数据失败:', error);
        }
        
        processedResults.push(item);
      }
      
      // 计算总量用于百分比计算
      const totalQuantity = processedResults.reduce((sum, item) => sum + item.total_quantity, 0);
      
      // 为每个项目添加百分比
      processedResults.forEach(item => {
        item.percentage = totalQuantity > 0 ? parseFloat(((item.total_quantity / totalQuantity) * 100).toFixed(2)) : 0;
      });
      
      console.log('按日期统计响应数据:', {
        code: 0,
        message: '获取成功',
        data: processedResults.slice(0, 3) // 只打印前三条作为样本
      });
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: processedResults
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
   * 获取按类别分组的发货统计数据
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getCategoryStats(req, res) {
    try {
      // 解析请求参数
      const date = req.query.date || null;
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const categoryId = req.query.category_id ? parseInt(req.query.category_id) : null;
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
        category_id: categoryId
      };
      
      try {
        // 获取各项统计数据
        const statsByCategory = await shippingRecordInstance.getStatsByCategory(options);
        const statsTotal = await shippingRecordInstance.getStatsTotal(options);
        
        // 返回统计结果
        res.status(200).json({
          success: true,
          data: {
            by_category: statsByCategory || [],
            total: statsTotal || { total: 0 }
          }
        });
      } catch (error) {
        console.error('获取类别统计数据查询错误:', error);
        // 即使查询出错，也返回一个一致的数据结构
        res.status(200).json({
          success: true,
          data: {
            by_category: [],
            total: { total: 0 }
          }
        });
      }
    } catch (error) {
      console.error('获取类别统计数据失败:', error);
      // 返回服务器错误，但保持数据结构一致
      res.status(500).json({
        success: false,
        message: '获取类别统计数据失败',
        data: {
          by_category: [],
          total: { total: 0 }
        }
      });
    }
  }

  /**
   * 获取按类别统计的店铺出力数据
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getShopOutputsByCategory(req, res) {
    try {
      // 解析请求参数
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const courierId = req.query.courier_id ? parseInt(req.query.courier_id) : null;
      
      // 打印请求参数
      console.log('按类别统计请求参数:', { date_from: dateFrom, date_to: dateTo, courier_id: courierId });
      
      // 创建一个自定义SQL查询来按店铺类别统计出力数据
      const db = require('../db');
      
      let sql = `
        SELECT 
          sc.id as category_id, 
          sc.name as category_name, 
          SUM(so.quantity) as total_quantity,
          COUNT(DISTINCT so.shop_id) as shops_count,
          COUNT(DISTINCT so.output_date) as days_count
        FROM 
          shop_outputs so
        JOIN 
          shops s ON so.shop_id = s.id
        LEFT JOIN 
          shop_categories sc ON s.category_id = sc.id
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
      
      if (courierId) {
        sql += ` AND so.courier_id = ?`;
        params.push(courierId);
      }
      
      sql += `
        GROUP BY 
          sc.id, sc.name
        ORDER BY 
          total_quantity DESC
      `;
      
      const results = await db.query(sql, params);
      
      // 处理未分类的情况 (sc.id 可能为 NULL)
      const processedResults = Array.isArray(results) ? results.map(row => {
        if (row.category_id === null) {
          return {
            ...row,
            category_id: 0,
            category_name: '未分类'
          };
        }
        return row;
      }) : [];
      
      // 计算同比和环比变化率
      if (dateFrom && dateTo) {
        try {
          const currentPeriodStart = new Date(dateFrom);
          const currentPeriodEnd = new Date(dateTo);
          const currentPeriodDays = Math.round((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          // 计算环比和同比的日期范围
          // 1. 环比（上个时间段）
          const momPeriodEnd = new Date(currentPeriodStart);
          momPeriodEnd.setDate(momPeriodEnd.getDate() - 1);
          
          const momPeriodStart = new Date(momPeriodEnd);
          momPeriodStart.setDate(momPeriodStart.getDate() - currentPeriodDays + 1);
          
          // 2. 同比（去年同期）
          const yoyPeriodStart = new Date(currentPeriodStart);
          yoyPeriodStart.setFullYear(yoyPeriodStart.getFullYear() - 1);
          
          const yoyPeriodEnd = new Date(currentPeriodEnd);
          yoyPeriodEnd.setFullYear(yoyPeriodEnd.getFullYear() - 1);
          
          // 格式化日期为 YYYY-MM-DD
          const formatDate = (date) => {
            return date.toISOString().split('T')[0];
          };
          
          const momDateFrom = formatDate(momPeriodStart);
          const momDateTo = formatDate(momPeriodEnd);
          const yoyDateFrom = formatDate(yoyPeriodStart);
          const yoyDateTo = formatDate(yoyPeriodEnd);
          
          console.log('环比日期范围:', { momDateFrom, momDateTo });
          console.log('同比日期范围:', { yoyDateFrom, yoyDateTo });
          
          // 获取环比周期的数据
          let momSql = `
            SELECT 
              sc.id as category_id, 
              sc.name as category_name, 
              SUM(so.quantity) as total_quantity
            FROM 
              shop_outputs so
            JOIN 
              shops s ON so.shop_id = s.id
            LEFT JOIN 
              shop_categories sc ON s.category_id = sc.id
            WHERE 
              so.output_date >= ? AND so.output_date <= ?
          `;
          
          const momParams = [momDateFrom, momDateTo];
          
          if (courierId) {
            momSql += ` AND so.courier_id = ?`;
            momParams.push(courierId);
          }
          
          momSql += `
            GROUP BY 
              sc.id, sc.name
          `;
          
          // 获取同比周期的数据
          let yoySql = `
            SELECT 
              sc.id as category_id, 
              sc.name as category_name, 
              SUM(so.quantity) as total_quantity
            FROM 
              shop_outputs so
            JOIN 
              shops s ON so.shop_id = s.id
            LEFT JOIN 
              shop_categories sc ON s.category_id = sc.id
            WHERE 
              so.output_date >= ? AND so.output_date <= ?
          `;
          
          const yoyParams = [yoyDateFrom, yoyDateTo];
          
          if (courierId) {
            yoySql += ` AND so.courier_id = ?`;
            yoyParams.push(courierId);
          }
          
          yoySql += `
            GROUP BY 
              sc.id, sc.name
          `;
          
          // 执行查询
          const momResults = await db.query(momSql, momParams);
          const yoyResults = await db.query(yoySql, yoyParams);
          
          // 处理未分类数据
          const momProcessedResults = Array.isArray(momResults) ? momResults.map(row => {
            if (row.category_id === null) {
              return {
                ...row,
                category_id: 0,
                category_name: '未分类'
              };
            }
            return row;
          }) : [];
          
          const yoyProcessedResults = Array.isArray(yoyResults) ? yoyResults.map(row => {
            if (row.category_id === null) {
              return {
                ...row,
                category_id: 0,
                category_name: '未分类'
              };
            }
            return row;
          }) : [];
          
          // 创建映射表用于快速查找
          const momDataMap = new Map();
          momProcessedResults.forEach(item => {
            momDataMap.set(item.category_id, parseFloat(item.total_quantity) || 0);
          });
          
          const yoyDataMap = new Map();
          yoyProcessedResults.forEach(item => {
            yoyDataMap.set(item.category_id, parseFloat(item.total_quantity) || 0);
          });
          
          console.log('环比数据:', momProcessedResults);
          console.log('同比数据:', yoyProcessedResults);
          
          // 计算变化率并添加到结果中
          for (const item of processedResults) {
            const currentQuantity = parseFloat(item.total_quantity) || 0;
            const momPreviousQuantity = momDataMap.get(item.category_id) || 0;
            const yoyPreviousQuantity = yoyDataMap.get(item.category_id) || 0;
            
            console.log(`类别 ${item.category_name}: 当前=${currentQuantity}, 环比上期=${momPreviousQuantity}, 同比上期=${yoyPreviousQuantity}`);
            
            // 计算环比变化率
            if (momPreviousQuantity > 0) {
              const momChangeRate = ((currentQuantity - momPreviousQuantity) / momPreviousQuantity) * 100;
              item.mom_change_rate = parseFloat(momChangeRate.toFixed(2));
              
              if (momChangeRate > 0) {
                item.mom_change_type = 'increase';
              } else if (momChangeRate < 0) {
                item.mom_change_type = 'decrease';
              } else {
                item.mom_change_type = 'unchanged';
              }
            } else if (currentQuantity > 0 && momPreviousQuantity === 0) {
              item.mom_change_rate = 100;
              item.mom_change_type = 'increase';
            } else if (currentQuantity === 0 && momPreviousQuantity === 0) {
              item.mom_change_rate = 0;
              item.mom_change_type = 'unchanged';
            } else if (currentQuantity === 0 && momPreviousQuantity > 0) {
              item.mom_change_rate = -100;
              item.mom_change_type = 'decrease';
            } else {
              item.mom_change_rate = 0;
              item.mom_change_type = 'unchanged';
            }
            
            // 计算同比变化率
            if (yoyPreviousQuantity > 0) {
              const yoyChangeRate = ((currentQuantity - yoyPreviousQuantity) / yoyPreviousQuantity) * 100;
              item.yoy_change_rate = parseFloat(yoyChangeRate.toFixed(2));
              
              if (yoyChangeRate > 0) {
                item.yoy_change_type = 'increase';
              } else if (yoyChangeRate < 0) {
                item.yoy_change_type = 'decrease';
              } else {
                item.yoy_change_type = 'unchanged';
              }
            } else if (currentQuantity > 0 && yoyPreviousQuantity === 0) {
              item.yoy_change_rate = 100;
              item.yoy_change_type = 'increase';
            } else if (currentQuantity === 0 && yoyPreviousQuantity === 0) {
              item.yoy_change_rate = 0;
              item.yoy_change_type = 'unchanged';
            } else if (currentQuantity === 0 && yoyPreviousQuantity > 0) {
              item.yoy_change_rate = -100;
              item.yoy_change_type = 'decrease';
            } else {
              item.yoy_change_rate = 0;
              item.yoy_change_type = 'unchanged';
            }
            
            console.log(`    环比变化率: ${item.mom_change_rate}%, 同比变化率: ${item.yoy_change_rate}%`);
          }
        } catch (error) {
          console.error('计算变化率出错:', error);
          // 如果计算出错，确保仍然返回数据，但不包含变化率信息
          processedResults.forEach(item => {
            item.mom_change_rate = 0;
            item.mom_change_type = 'unchanged';
            item.yoy_change_rate = 0;
            item.yoy_change_type = 'unchanged';
          });
        }
      }
      
      // 打印响应数据
      console.log('按类别统计响应数据:', {
        code: 0,
        message: '获取成功',
        data: processedResults
      });
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: processedResults
      });
    } catch (error) {
      console.error('按类别统计出力数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '统计数据查询失败'
      });
    }
  }

  /**
   * 导出发货数据
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async exportShippingData(req, res) {
    try {
      // 解析请求参数
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const courierIds = req.query.courier_ids ? req.query.courier_ids.split(',').map(id => parseInt(id)) : null;
      const format = req.query.format || 'excel';
      
      console.log('导出发货数据请求参数:', { date_from: dateFrom, date_to: dateTo, courier_ids: courierIds, format });
      
      // 创建SQL查询来获取详细的发货数据
      const db = require('../db');
      
      let sql = `
        SELECT 
          CONCAT('SR', LPAD(sr.id, 8, '0')) as recordId,
          c.name as courierName,
          c.code as courierCode,
          sr.quantity as quantity,
          sr.date as shippingDate,
          sr.created_at as createTime,
          sr.updated_at as updateTime
        FROM 
          shipping_records sr
        LEFT JOIN couriers c ON sr.courier_id = c.id
        WHERE 
          1=1
      `;
      
      const params = [];
      
      if (courierIds && courierIds.length > 0) {
        sql += ` AND sr.courier_id IN (${courierIds.map(() => '?').join(',')})`;
        params.push(...courierIds);
      }
      
      if (dateFrom) {
        sql += ` AND sr.date >= ?`;
        params.push(dateFrom);
      }
      
      if (dateTo) {
        sql += ` AND sr.date <= ?`;
        params.push(dateTo);
      }
      
      sql += ` ORDER BY sr.date DESC, sr.created_at DESC`;
      
      const records = await db.query(sql, params);
      
      // 计算汇总信息
      const totalQuantity = records.reduce((sum, record) => sum + (record.quantity || 0), 0);
      const totalRecords = records.length;
      
      // 按快递类型分组统计
      const courierStats = {};
      records.forEach(record => {
        const courierName = record.courierName || '未知快递';
        if (!courierStats[courierName]) {
          courierStats[courierName] = {
            courierName,
            courierCode: record.courierCode || '',
            totalQuantity: 0,
            recordCount: 0
          };
        }
        courierStats[courierName].totalQuantity += record.quantity || 0;
        courierStats[courierName].recordCount += 1;
      });
      
      // 构建响应数据
      const responseData = {
        records: records.map(record => ({
          recordId: record.recordId,
          courierName: record.courierName || '未知快递',
          courierCode: record.courierCode || '',
          quantity: record.quantity || 0,
          shippingDate: record.shippingDate,
          createTime: record.createTime,
          updateTime: record.updateTime
        })),
        total: totalRecords,
        summary: {
          totalQuantity: totalQuantity,
          totalRecords: totalRecords,
          courierStats: Object.values(courierStats),
          dateRange: {
            from: dateFrom || (records.length > 0 ? records[records.length - 1].shippingDate : null),
            to: dateTo || (records.length > 0 ? records[0].shippingDate : null)
          }
        }
      };
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: responseData
      });
    } catch (error) {
      console.error('导出发货数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '导出发货数据失败'
      });
    }
  }

  /**
   * 获取导出数据（店铺出力数据）
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getExportData(req, res) {
    try {
      // 解析请求参数
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const shopId = req.query.shop_id ? parseInt(req.query.shop_id) : null;
      const categoryId = req.query.category_id ? parseInt(req.query.category_id) : null;
      const courierId = req.query.courier_id ? parseInt(req.query.courier_id) : null;
      
      console.log('导出数据请求参数:', { date_from: dateFrom, date_to: dateTo, shop_id: shopId, category_id: categoryId, courier_id: courierId });
      
      // 创建SQL查询来获取详细的出力数据
      const db = require('../db');
      
      let sql = `
        SELECT 
          CONCAT('SO', LPAD(so.id, 8, '0')) as orderId,
          s.name as shopName,
          sc.name as shopCategory,
          c.name as courierType,
          so.output_date as orderDate,
          so.quantity as amount,
          '已完成' as status,
          so.created_at as createTime,
          so.updated_at as updateTime
        FROM 
          shop_outputs so
        LEFT JOIN shops s ON so.shop_id = s.id
        LEFT JOIN shop_categories sc ON s.category_id = sc.id
        LEFT JOIN couriers c ON so.courier_id = c.id
        WHERE 
          1=1
      `;
      
      const params = [];
      
      if (shopId) {
        sql += ` AND so.shop_id = ?`;
        params.push(shopId);
      }
      
      if (categoryId) {
        sql += ` AND s.category_id = ?`;
        params.push(categoryId);
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
      
      sql += ` ORDER BY so.output_date DESC, so.created_at DESC`;
      
      const orders = await db.query(sql, params);
      
      // 计算汇总信息
      const totalAmount = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
      const totalOrders = orders.length;
      
      // 构建响应数据
      const responseData = {
        orders: orders.map(order => ({
          orderId: order.orderId,
          shopName: order.shopName || '未知店铺',
          shopCategory: order.shopCategory || '未分类',
          courierType: order.courierType || '未知快递',
          orderDate: order.orderDate,
          amount: order.amount || 0,
          status: order.status,
          createTime: order.createTime,
          updateTime: order.updateTime
        })),
        total: totalOrders,
        summary: {
          totalAmount: totalAmount,
          totalOrders: totalOrders,
          dateRange: {
            from: dateFrom || (orders.length > 0 ? orders[orders.length - 1].orderDate : null),
            to: dateTo || (orders.length > 0 ? orders[0].orderDate : null)
          }
        }
      };
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: responseData
      });
    } catch (error) {
      console.error('获取导出数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取导出数据失败'
      });
    }
  }
}

module.exports = new StatsController(); 