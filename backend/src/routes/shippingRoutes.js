const express = require('express');
const { param } = require('express-validator');
const { 
  ShippingController, 
  validateShippingRecord, 
  validateBatchShippingRecords 
} = require('../controllers/ShippingController');
const StatsController = require('../controllers/StatsController');

const router = express.Router();

// 获取统计数据 - 摘要
router.get('/stats/summary', StatsController.getStats);


// 添加兼容路由处理前端/api/shipping/stats的请求
router.get('/stats', StatsController.getStats);

// 获取详细统计数据
router.get('/stats/details', StatsController.getDetailedStats);

// 获取图表数据 - 添加一个指向StatsController.getChartData的路由
router.get('/stats/charts', StatsController.getChartData);

// 获取按类别统计的发货记录数据
router.get('/stats/categories', StatsController.getCategoryStats);

// 获取母类型发货记录统计

// 添加兼容路由处理前端/api/shipping/chart的请求
router.get('/chart', StatsController.getChartData);

// 批量添加发货记录
router.post('/batch', validateBatchShippingRecords, ShippingController.batchCreate.bind(ShippingController));


// 获取发货记录列表
router.get('/', ShippingController.getAll.bind(ShippingController));

// 获取单个发货记录详情
router.get('/:id', ShippingController.getById.bind(ShippingController));

// 创建发货记录
router.post('/', validateShippingRecord, ShippingController.create.bind(ShippingController));

// 更新发货记录
router.put('/:id', validateShippingRecord, ShippingController.update.bind(ShippingController));

// 删除发货记录
router.delete('/:id', ShippingController.delete.bind(ShippingController));

module.exports = router; 