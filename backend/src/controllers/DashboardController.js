const ShopOutput = require('../models/ShopOutput');
const Shop = require('../models/Shop');
const Courier = require('../models/Courier');
const NodeCache = require('node-cache');

// 创建缓存实例，设置缓存时间为60秒（可根据需求调整）
const dashboardCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// 获取格式化的当前时间（使用配置的时区）
const { APP_TIMEZONE } = require('../config/timezone');

function getCurrentTimeFormatted() {
  const now = new Date();
  return now.toLocaleString('sv-SE', { 
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace('T', ' ');
}

class DashboardControllerClass {
  /**
   * 获取今日出力概览
   * @param {Object} req 请求对象，支持query参数：category_id - 按类别过滤
   * @param {Object} res 响应对象
   */
  async getTodayShopOutputs(req, res) {
    try {
      const { category_id } = req.query;
      
      // 构建缓存键，包含可能的筛选条件
      const cacheKey = `today_shop_outputs_${category_id || 'all'}`;
      
      // 尝试从缓存获取数据
      const cachedData = dashboardCache.get(cacheKey);
      if (cachedData) {
        return res.status(200).json({
          code: 0,
          message: `获取成功(cached) - ${getCurrentTimeFormatted()}`,
          data: cachedData
        });
      }
      
      // 获取今日日期
      const today = new Date().toISOString().split('T')[0];
      
      // 获取今日出力数据
      const outputs = await ShopOutput.getOutputsByDate(today);
      
      // 获取所有店铺列表（包括今日未录入的）
      const shopOptions = { is_active: true };
      if (category_id) {
        shopOptions.category_id = category_id;
      }
      const shops = await Shop.getAll(shopOptions);
      const shopMap = new Map(shops.map(shop => [shop.id, { ...shop, outputs: [] }]));
      
      // 获取所有快递类型
      const couriers = await Courier.getAll({ is_active: true });
      const courierMap = new Map(couriers.map(courier => [courier.id, courier]));
      
      // 统计今日出力数据（考虑操作类型）
      let totalQuantity = 0;
      let activeShops = 0;
      const courierStats = new Map();
      
      // 操作类型统计
      let addQuantity = 0;
      let subtractQuantity = 0;
      let mergeQuantity = 0;
      let addCount = 0;
      let subtractCount = 0;
      let mergeCount = 0;
      
      // 店铺和快递类型的关联统计
      const shopCourierStats = new Map();
      
      for (const output of outputs) {
        // 如果指定了类别ID，则只统计该类别下的店铺出力
        if (category_id && shopMap.has(output.shop_id)) {
          const shop = shopMap.get(output.shop_id);
          if (shop.category_id != category_id) {
            continue;
          }
        }
        
        // 根据操作类型统计
        const operationType = output.operation_type || 'add';
        switch (operationType) {
          case 'add':
            addQuantity += output.quantity;
            addCount++;
            break;
          case 'subtract':
            subtractQuantity += Math.abs(output.quantity);
            subtractCount++;
            break;
          case 'merge':
            mergeQuantity += output.quantity;
            mergeCount++;
            break;
        }
        
        // 累加总数量（净增长）- 包含合单操作（合单为负数）
        totalQuantity += output.quantity;
        
        // 添加到店铺统计
        if (shopMap.has(output.shop_id)) {
          const shopData = shopMap.get(output.shop_id);
          if (shopData.outputs.length === 0) {
            activeShops++;
          }
          shopData.outputs.push(output);
          
          // 为店铺和快递类型关联创建记录
          const shopId = output.shop_id;
          if (!shopCourierStats.has(shopId)) {
            shopCourierStats.set(shopId, new Map());
          }
          
          const shopCouriers = shopCourierStats.get(shopId);
          const courierId = output.courier_id;
          
          if (!shopCouriers.has(courierId)) {
            shopCouriers.set(courierId, {
              courier_id: courierId,
              courier_name: output.courier_name,
              quantity: 0
            });
          }
          
          const courierData = shopCouriers.get(courierId);
          // 累加数量（包含合单操作，合单为负数）
          courierData.quantity += output.quantity;
        }
        
        // 添加到快递类型统计
        if (courierMap.has(output.courier_id)) {
          const courierKey = output.courier_id;
          if (!courierStats.has(courierKey)) {
            courierStats.set(courierKey, {
              courier_id: output.courier_id,
              courier_name: output.courier_name,
              total_quantity: 0,
              shops: new Set()
            });
          }
          
          const stats = courierStats.get(courierKey);
          // 累加数量（包含合单操作，合单为负数）
          stats.total_quantity += output.quantity;
          stats.shops.add(output.shop_id);
        }
      }
      
      // 格式化返回数据
      const formattedCourierStats = Array.from(courierStats.values()).map(stat => ({
        courier_id: stat.courier_id,
        courier_name: stat.courier_name,
        total_quantity: stat.total_quantity,
        shops_count: stat.shops.size
      }));
      
      // 计算店铺覆盖率
      const coverageRate = shops.length > 0 ? parseFloat((activeShops / shops.length * 100).toFixed(2)) : 0;
      
      // 按店铺类别分组
      const shopsByCategory = {};
      Array.from(shopMap.values()).forEach(shop => {
        const categoryId = shop.category_id || 0;
        const categoryName = shop.category_name || '未分类';
        
        if (!shopsByCategory[categoryId]) {
          shopsByCategory[categoryId] = {
            category_id: categoryId,
            category_name: categoryName,
            shops: []
          };
        }
        
        shopsByCategory[categoryId].shops.push({
          shop_id: shop.id,
          shop_name: shop.name,
          has_data: shop.outputs.length > 0,
          total_quantity: shop.outputs
            .filter(output => (output.operation_type || 'add') !== 'merge')
            .reduce((sum, output) => sum + output.quantity, 0)
        });
      });
      
      // 将分类数据转换为数组
      const categoriesData = Object.values(shopsByCategory).map(category => {
        // 按输出量对每个类别中的店铺进行排序
        category.shops.sort((a, b) => {
          if (a.has_data !== b.has_data) return a.has_data ? -1 : 1;
          return b.total_quantity - a.total_quantity;
        });
        
        // 计算每个类别的总量
        category.total_quantity = category.shops.reduce((sum, shop) => sum + shop.total_quantity, 0);
        
        return category;
      });
      
      // 按总量排序类别
      categoriesData.sort((a, b) => b.total_quantity - a.total_quantity);
      
      // 格式化店铺快递关联数据
      const shopCourierData = [];
      shopCourierStats.forEach((courierMap, shopId) => {
        const shop = shopMap.get(shopId);
        if (shop) {
          shopCourierData.push({
            shop_id: shopId,
            shop_name: shop.name,
            category_id: shop.category_id,
            category_name: shop.category_name,
            total_quantity: shop.outputs
              .filter(output => (output.operation_type || 'add') !== 'merge')
              .reduce((sum, output) => sum + output.quantity, 0),
            couriers: Array.from(courierMap.values())
          });
        }
      });
      
      const dashboardData = {
        date: today,
        total_quantity: totalQuantity,
        net_growth: totalQuantity,
        operation_stats: {
          add_quantity: addQuantity,
          subtract_quantity: subtractQuantity,
          merge_quantity: mergeQuantity,
          add_count: addCount,
          subtract_count: subtractCount,
          merge_count: mergeCount,
          total_operations: addCount + subtractCount + mergeCount
        },
        shops_count: shops.length,
        active_shops_count: activeShops,
        coverage_rate: coverageRate,
        couriers_data: formattedCourierStats.sort((a, b) => b.total_quantity - a.total_quantity),
        categories_data: categoriesData,
        shops_data: Array.from(shopMap.values())
          .map(shop => ({
            shop_id: shop.id,
            shop_name: shop.name,
            category_id: shop.category_id,
            category_name: shop.category_name,
            has_data: shop.outputs.length > 0,
            total_quantity: shop.outputs
              .filter(output => (output.operation_type || 'add') !== 'merge')
              .reduce((sum, output) => sum + output.quantity, 0),
            couriers: shopCourierStats.has(shop.id) 
              ? Array.from(shopCourierStats.get(shop.id).values()) 
              : []
          }))
          .sort((a, b) => {
            // 先按是否有数据排序，然后按数量降序
            if (a.has_data !== b.has_data) return a.has_data ? -1 : 1;
            return b.total_quantity - a.total_quantity;
          }),
        shop_courier_data: shopCourierData
      };
      
      // 将数据存入缓存
      dashboardCache.set(cacheKey, dashboardData);
      
      res.status(200).json({
        code: 0,
        message: `获取成功 - ${getCurrentTimeFormatted()}`,
        data: dashboardData
      });
    } catch (error) {
      console.error('获取今日出力概览失败:', error);
      res.status(500).json({
        code: 500,
        message: `获取今日出力概览失败 - ${getCurrentTimeFormatted()}`,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * 获取明日出力预测
   * @param {Object} req 请求对象，支持query参数：category_id - 按类别过滤
   * @param {Object} res 响应对象
   */
  async getTomorrowShopOutputs(req, res) {
    try {
      const { category_id } = req.query;
      
      // 构建缓存键，包含可能的筛选条件
      const cacheKey = `tomorrow_shop_outputs_${category_id || 'all'}`;
      
      // 尝试从缓存获取数据
      const cachedData = dashboardCache.get(cacheKey);
      if (cachedData) {
        return res.status(200).json({
          code: 0,
          message: `获取成功(cached) - ${getCurrentTimeFormatted()}`,
          data: cachedData
        });
      }
      
      // 获取明日日期
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      // 直接获取明日的出力数据
      const outputs = await ShopOutput.getOutputsByDate(tomorrowStr);
      
      // 获取所有活跃店铺和快递类型
      const shopOptions = { is_active: true };
      if (category_id) {
        shopOptions.category_id = category_id;
      }
      const shops = await Shop.getAll(shopOptions);
      const couriers = await Courier.getAll({ is_active: true });
      
      // 按店铺和类别过滤输出
      const filteredOutputs = category_id 
        ? outputs.filter(output => {
            const shop = shops.find(s => s.id === output.shop_id);
            return shop && shop.category_id == category_id;
          })
        : outputs;
      
      // 计算总量和店铺覆盖率
      const totalQuantity = filteredOutputs.reduce((sum, output) => sum + output.quantity, 0);
      const coveredShops = new Set(filteredOutputs.map(output => output.shop_id));
      const coverageRate = shops.length > 0 ? parseFloat((coveredShops.size / shops.length * 100).toFixed(2)) : 0;
      
      // 按快递类型汇总
      const courierStats = new Map();
      for (const output of filteredOutputs) {
        if (!courierStats.has(output.courier_id)) {
          courierStats.set(output.courier_id, {
            courier_id: output.courier_id,
            courier_name: output.courier_name,
            total_quantity: 0,
            shops: new Set()
          });
        }
        
        const stats = courierStats.get(output.courier_id);
        stats.total_quantity += output.quantity;
        stats.shops.add(output.shop_id);
      }
      
      // 格式化快递类型统计
      const formattedCourierStats = Array.from(courierStats.values()).map(stat => ({
        courier_id: stat.courier_id,
        courier_name: stat.courier_name,
        total_quantity: stat.total_quantity,
        shops_count: stat.shops.size
      }));
      
      // 按店铺汇总
      const shopStats = new Map();
      // 店铺和快递类型的关联统计
      const shopCourierStats = new Map();
      
      for (const output of filteredOutputs) {
        if (!shopStats.has(output.shop_id)) {
          const shop = shops.find(s => s.id === output.shop_id);
          shopStats.set(output.shop_id, {
            shop_id: output.shop_id,
            shop_name: output.shop_name,
            category_id: shop ? shop.category_id : null,
            category_name: shop ? shop.category_name : '未分类',
            total_quantity: 0,
            couriers: []
          });
        }
        
        const stats = shopStats.get(output.shop_id);
        stats.total_quantity += output.quantity;
        
        // 为店铺和快递类型关联创建记录
        const shopId = output.shop_id;
        if (!shopCourierStats.has(shopId)) {
          shopCourierStats.set(shopId, new Map());
        }
        
        const shopCouriers = shopCourierStats.get(shopId);
        const courierId = output.courier_id;
        
        if (!shopCouriers.has(courierId)) {
          shopCouriers.set(courierId, {
            courier_id: courierId,
            courier_name: output.courier_name,
            quantity: 0
          });
        }
        
        const courierData = shopCouriers.get(courierId);
        courierData.quantity += output.quantity;
        
        // 检查是否已经有该快递类型的记录
        let courierEntry = stats.couriers.find(c => c.courier_id === output.courier_id);
        if (courierEntry) {
          courierEntry.predicted_quantity += output.quantity;
        } else {
          stats.couriers.push({
            courier_id: output.courier_id,
            courier_name: output.courier_name,
            predicted_quantity: output.quantity
          });
        }
      }
      
      // 按店铺类别分组
      const categoriesMap = {};
      Array.from(shopStats.values()).forEach(shop => {
        const categoryId = shop.category_id || 0;
        const categoryName = shop.category_name || '未分类';
        
        if (!categoriesMap[categoryId]) {
          categoriesMap[categoryId] = {
            category_id: categoryId,
            category_name: categoryName,
            total_quantity: 0,
            shops: []
          };
        }
        
        categoriesMap[categoryId].shops.push(shop);
        categoriesMap[categoryId].total_quantity += shop.total_quantity;
      });
      
      // 将类别Map转为数组并排序
      const categoriesData = Object.values(categoriesMap)
        .map(category => {
          // 按输出量对每个类别中的店铺进行排序
          category.shops.sort((a, b) => b.total_quantity - a.total_quantity);
          return category;
        })
        .sort((a, b) => b.total_quantity - a.total_quantity);
      
      // 格式化店铺统计
      const formattedShopStats = Array.from(shopStats.values())
        .map(shop => ({
          ...shop,
          couriers: shopCourierStats.has(shop.shop_id)
            ? Array.from(shopCourierStats.get(shop.shop_id).values())
            : []
        }))
        .sort((a, b) => b.total_quantity - a.total_quantity);
      
      // 格式化店铺快递关联数据
      const shopCourierData = [];
      shopCourierStats.forEach((courierMap, shopId) => {
        const shop = shopStats.get(shopId);
        if (shop) {
          shopCourierData.push({
            shop_id: shopId,
            shop_name: shop.shop_name,
            category_id: shop.category_id,
            category_name: shop.category_name,
            total_quantity: shop.total_quantity,
            couriers: Array.from(courierMap.values())
          });
        }
      });
      
      // 构建最终返回数据
      const dashboardData = {
        date: tomorrowStr,
        total_predicted_quantity: totalQuantity,
        shops_count: shops.length,
        predicted_shops_count: coveredShops.size,
        coverage_rate: coverageRate,
        couriers_data: formattedCourierStats.sort((a, b) => b.total_quantity - a.total_quantity),
        categories_data: categoriesData,
        shops_data: formattedShopStats,
        shop_courier_data: shopCourierData,
        raw_predictions: filteredOutputs.map(output => ({
          shop_id: output.shop_id,
          shop_name: output.shop_name,
          courier_id: output.courier_id,
          courier_name: output.courier_name,
          predicted_quantity: output.quantity,
          days_count: 1
        }))
      };
      
      // 将数据存入缓存
      dashboardCache.set(cacheKey, dashboardData);
      
      res.status(200).json({
        code: 0,
        message: `获取成功 - ${getCurrentTimeFormatted()}`,
        data: dashboardData
      });
    } catch (error) {
      console.error('获取明日出力预测失败:', error);
      res.status(500).json({
        code: 500,
        message: `获取明日出力预测失败 - ${getCurrentTimeFormatted()}`,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * 获取店铺出力趋势数据
   * @param {Object} req 请求对象，支持query参数：
   *                      dimension - 查询维度('category'|'shop'|'courier')
   *                      days - 查询天数
   *                      category_id - 类别ID筛选
   *                      shop_id - 店铺ID筛选
   *                      courier_id - 快递类型ID筛选
   * @param {Object} res 响应对象
   */
  async getShopOutputTrend(req, res) {
    try {
      const { dimension = 'category', days = 7, category_id, shop_id, courier_id } = req.query;
      
      // 验证维度参数
      if (!['category', 'shop', 'courier'].includes(dimension)) {
        return res.status(400).json({
          code: 400,
          message: `不支持的维度: ${dimension}，支持的维度包括: category, shop, courier - ${getCurrentTimeFormatted()}`
        });
      }
      
      // 构建缓存键，包含所有筛选条件
      const cacheKey = `shop_output_trend_${dimension}_${days}_c${category_id || 'all'}_s${shop_id || 'all'}_co${courier_id || 'all'}`;
      
      // 尝试从缓存获取数据
      const cachedData = dashboardCache.get(cacheKey);
      if (cachedData) {
        return res.status(200).json({
          code: 0,
          message: `获取成功(cached) - ${getCurrentTimeFormatted()}`,
          data: cachedData
        });
      }
      
      // 计算日期范围
      const today = new Date();
      const daysNum = parseInt(days) || 7;
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - daysNum + 1);
      
      // 生成日期数组
      const dateArray = [];
      const currentDate = new Date(startDate);
      while (currentDate <= today) {
        dateArray.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // 获取日期范围内的所有出力数据
      const firstDate = dateArray[0];
      const lastDate = dateArray[dateArray.length - 1];
      
      // 根据维度和筛选条件获取数据
      let outputs = [];
      let shops = [];
      let categories = [];
      let couriers = [];
      
      // 获取所有活跃店铺
      const shopOptions = { is_active: true };
      if (category_id) {
        shopOptions.category_id = parseInt(category_id);
      }
      shops = await Shop.getAll(shopOptions);
      
      // 获取所有活跃快递类型
      couriers = await Courier.getAll({ is_active: true });
      
      // 为每个日期获取数据
      const outputsByDate = {};
      for (const date of dateArray) {
        const dailyOutputs = await ShopOutput.getOutputsByDate(date);
        
        // 根据筛选条件过滤数据
        let filteredOutputs = dailyOutputs;
        
        if (category_id) {
          filteredOutputs = filteredOutputs.filter(output => {
            const shop = shops.find(s => s.id === output.shop_id);
            return shop && shop.category_id == category_id;
          });
        }
        
        if (shop_id) {
          filteredOutputs = filteredOutputs.filter(output => output.shop_id == shop_id);
        }
        
        if (courier_id) {
          filteredOutputs = filteredOutputs.filter(output => output.courier_id == courier_id);
        }
        
        outputsByDate[date] = filteredOutputs;
        outputs = outputs.concat(filteredOutputs);
      }
      
      // 按维度聚合数据
      const seriesMap = new Map();
      const totalByDate = {};
      
      // 初始化日期总量
      dateArray.forEach(date => {
        totalByDate[date] = 0;
      });
      
      // 根据维度聚合数据
      for (const date of dateArray) {
        const dateOutputs = outputsByDate[date] || [];
        
        // 计算当天总量
        totalByDate[date] = dateOutputs.reduce((sum, output) => sum + output.quantity, 0);
        
        // 根据维度进行聚合
        if (dimension === 'category') {
          // 按店铺类别汇总
          const categoryOutputs = new Map();
          
          for (const output of dateOutputs) {
            const shop = shops.find(s => s.id === output.shop_id);
            if (!shop) continue;
            
            const categoryId = shop.category_id || 0;
            const categoryName = shop.category_name || '未分类';
            
            if (!categoryOutputs.has(categoryId)) {
              categoryOutputs.set(categoryId, {
                quantity: 0,
                name: categoryName
              });
            }
            
            categoryOutputs.get(categoryId).quantity += output.quantity;
          }
          
          // 更新系列数据
          categoryOutputs.forEach((value, categoryId) => {
            if (!seriesMap.has(categoryId)) {
              seriesMap.set(categoryId, {
                id: categoryId,
                name: value.name,
                data: {},
                total: 0
              });
            }
            
            const series = seriesMap.get(categoryId);
            series.data[date] = value.quantity;
            series.total += value.quantity;
          });
        } else if (dimension === 'shop') {
          // 按店铺汇总
          const shopOutputs = new Map();
          
          for (const output of dateOutputs) {
            const shop = shops.find(s => s.id === output.shop_id);
            if (!shop) continue;
            
            if (!shopOutputs.has(shop.id)) {
              shopOutputs.set(shop.id, {
                quantity: 0,
                name: shop.name,
                category_id: shop.category_id,
                category_name: shop.category_name
              });
            }
            
            shopOutputs.get(shop.id).quantity += output.quantity;
          }
          
          // 更新系列数据
          shopOutputs.forEach((value, shopId) => {
            if (!seriesMap.has(shopId)) {
              seriesMap.set(shopId, {
                id: shopId,
                name: value.name,
                category_id: value.category_id,
                category_name: value.category_name,
                data: {},
                total: 0
              });
            }
            
            const series = seriesMap.get(shopId);
            series.data[date] = value.quantity;
            series.total += value.quantity;
          });
        } else if (dimension === 'courier') {
          // 按快递类型汇总
          const courierOutputs = new Map();
          
          for (const output of dateOutputs) {
            if (!courierOutputs.has(output.courier_id)) {
              courierOutputs.set(output.courier_id, {
                quantity: 0,
                name: output.courier_name
              });
            }
            
            courierOutputs.get(output.courier_id).quantity += output.quantity;
          }
          
          // 更新系列数据
          courierOutputs.forEach((value, courierId) => {
            if (!seriesMap.has(courierId)) {
              seriesMap.set(courierId, {
                id: courierId,
                name: value.name,
                data: {},
                total: 0
              });
            }
            
            const series = seriesMap.get(courierId);
            series.data[date] = value.quantity;
            series.total += value.quantity;
          });
        }
      }
      
      // 转换为数组并排序
      const seriesArray = Array.from(seriesMap.values())
        .sort((a, b) => b.total - a.total);
      
      // 构建返回的趋势数据
      const trendData = {
        dates: dateArray,
        series: seriesArray,
        total_by_date: totalByDate
      };
      
      // 将数据存入缓存
      dashboardCache.set(cacheKey, trendData);
      
      res.status(200).json({
        code: 0,
        message: `获取成功 - ${getCurrentTimeFormatted()}`,
        data: trendData
      });
    } catch (error) {
      console.error('获取店铺出力趋势数据失败:', error);
      res.status(500).json({
        code: 500,
        message: `获取店铺出力趋势数据失败 - ${getCurrentTimeFormatted()}`,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Homepage widget 专用 API - 返回今日出力量和发货量
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getHomepageStats(req, res) {
    try {
      const cacheKey = 'homepage_stats';
      
      // 尝试从缓存获取
      const cachedData = dashboardCache.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      // 获取今日出力量
      const outputs = await ShopOutput.getOutputsByDate(today);
      const outputQuantity = outputs.reduce((sum, output) => sum + output.quantity, 0);
      
      // 获取今日发货量
      const { instance: shippingRecordInstance } = require('../models/ShippingRecord');
      const shippingStats = await shippingRecordInstance.getStatsTotal({ date: today });
      const shippingQuantity = shippingStats?.total || 0;
      
      const data = {
        output_quantity: outputQuantity,
        shipping_quantity: shippingQuantity,
        date: today,
        updated_at: getCurrentTimeFormatted()
      };
      
      // 缓存 30 秒
      dashboardCache.set(cacheKey, data, 30);
      
      res.status(200).json(data);
    } catch (error) {
      console.error('获取 Homepage 统计数据失败:', error);
      res.status(500).json({
        output_quantity: 0,
        shipping_quantity: 0,
        error: error.message
      });
    }
  }

  /**
   * 清除仪表盘数据缓存
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async clearCache(req, res) {
    try {
      dashboardCache.flushAll();
      res.status(200).json({
        code: 0,
        message: `缓存清除成功 - ${getCurrentTimeFormatted()}`
      });
    } catch (error) {
      console.error('清除缓存失败:', error);
      res.status(500).json({
        code: 500,
        message: `清除缓存失败 - ${getCurrentTimeFormatted()}`,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

const DashboardController = new DashboardControllerClass();

module.exports = DashboardController; 