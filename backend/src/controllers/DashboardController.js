const ShopOutput = require('../models/ShopOutput');
const Shop = require('../models/Shop');
const Courier = require('../models/Courier');
const NodeCache = require('node-cache');

// 创建缓存实例，设置缓存时间为60秒（可根据需求调整）
const dashboardCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// 获取格式化的当前时间
function getCurrentTimeFormatted() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
      
      // 统计今日出力数据
      let totalQuantity = 0;
      let activeShops = 0;
      const courierStats = new Map();
      
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
        
        // 累加总数量
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
          total_quantity: shop.outputs.reduce((sum, output) => sum + output.quantity, 0)
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
            total_quantity: shop.outputs.reduce((sum, output) => sum + output.quantity, 0),
            couriers: Array.from(courierMap.values())
          });
        }
      });
      
      const dashboardData = {
        date: today,
        total_quantity: totalQuantity,
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
            total_quantity: shop.outputs.reduce((sum, output) => sum + output.quantity, 0),
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