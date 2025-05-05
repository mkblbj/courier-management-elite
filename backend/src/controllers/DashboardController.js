const ShopOutput = require('../models/ShopOutput');
const Shop = require('../models/Shop');
const Courier = require('../models/Courier');

class DashboardControllerClass {
  /**
   * 获取今日出力概览
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getTodayShopOutputs(req, res) {
    try {
      // 获取今日日期
      const today = new Date().toISOString().split('T')[0];
      
      // 获取今日出力数据
      const outputs = await ShopOutput.getOutputsByDate(today);
      
      // 获取所有店铺列表（包括今日未录入的）
      const shops = await Shop.getAll({ is_active: true });
      const shopMap = new Map(shops.map(shop => [shop.id, { ...shop, outputs: [] }]));
      
      // 获取所有快递类型
      const couriers = await Courier.getAll({ is_active: true });
      const courierMap = new Map(couriers.map(courier => [courier.id, courier]));
      
      // 统计今日出力数据
      let totalQuantity = 0;
      let activeShops = 0;
      const courierStats = new Map();
      
      for (const output of outputs) {
        // 累加总数量
        totalQuantity += output.quantity;
        
        // 添加到店铺统计
        if (shopMap.has(output.shop_id)) {
          const shopData = shopMap.get(output.shop_id);
          if (shopData.outputs.length === 0) {
            activeShops++;
          }
          shopData.outputs.push(output);
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
      
      const dashboardData = {
        date: today,
        total_quantity: totalQuantity,
        shops_count: shops.length,
        active_shops_count: activeShops,
        coverage_rate: coverageRate,
        couriers_data: formattedCourierStats.sort((a, b) => b.total_quantity - a.total_quantity),
        shops_data: Array.from(shopMap.values())
          .map(shop => ({
            shop_id: shop.id,
            shop_name: shop.name,
            has_data: shop.outputs.length > 0,
            total_quantity: shop.outputs.reduce((sum, output) => sum + output.quantity, 0)
          }))
          .sort((a, b) => {
            // 先按是否有数据排序，然后按数量降序
            if (a.has_data !== b.has_data) return a.has_data ? -1 : 1;
            return b.total_quantity - a.total_quantity;
          })
      };
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: dashboardData
      });
    } catch (error) {
      console.error('获取今日出力概览失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取今日出力概览失败'
      });
    }
  }

  /**
   * 获取明日出力预测
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   */
  async getTomorrowShopOutputs(req, res) {
    try {
      // 获取明日日期
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      // 直接获取明日的出力数据
      const outputs = await ShopOutput.getOutputsByDate(tomorrowStr);
      
      // 获取所有活跃店铺和快递类型
      const shops = await Shop.getAll({ is_active: true });
      const couriers = await Courier.getAll({ is_active: true });
      
      // 计算总量和店铺覆盖率
      const totalQuantity = outputs.reduce((sum, output) => sum + output.quantity, 0);
      const coveredShops = new Set(outputs.map(output => output.shop_id));
      const coverageRate = shops.length > 0 ? parseFloat((coveredShops.size / shops.length * 100).toFixed(2)) : 0;
      
      // 按快递类型汇总
      const courierStats = new Map();
      for (const output of outputs) {
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
      for (const output of outputs) {
        if (!shopStats.has(output.shop_id)) {
          shopStats.set(output.shop_id, {
            shop_id: output.shop_id,
            shop_name: output.shop_name,
            total_quantity: 0,
            couriers: []
          });
        }
        
        const stats = shopStats.get(output.shop_id);
        stats.total_quantity += output.quantity;
        
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
      
      // 格式化店铺统计
      const formattedShopStats = Array.from(shopStats.values()).sort((a, b) => b.total_quantity - a.total_quantity);
      
      // 构建最终返回数据
      const dashboardData = {
        date: tomorrowStr,
        total_predicted_quantity: totalQuantity,
        shops_count: shops.length,
        predicted_shops_count: coveredShops.size,
        coverage_rate: coverageRate,
        couriers_data: formattedCourierStats.sort((a, b) => b.total_quantity - a.total_quantity),
        shops_data: formattedShopStats,
        raw_predictions: outputs.map(output => ({
          shop_id: output.shop_id,
          shop_name: output.shop_name,
          courier_id: output.courier_id,
          courier_name: output.courier_name,
          predicted_quantity: output.quantity,
          days_count: 1
        }))
      };
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: dashboardData
      });
    } catch (error) {
      console.error('获取明日出力预测失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取明日出力预测失败'
      });
    }
  }
}

const DashboardController = new DashboardControllerClass();

module.exports = DashboardController; 