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

// 添加层级统计数据路由
router.get('/stats/hierarchical', StatsController.getHierarchicalStats);

// 添加兼容路由处理前端/api/shipping/stats的请求
router.get('/stats', StatsController.getStats);

// 获取详细统计数据
router.get('/stats/details', StatsController.getDetailedStats);

// 获取图表数据 - 添加一个指向StatsController.getChartData的路由
router.get('/stats/charts', StatsController.getChartData);

// 获取特定母类型的发货统计
router.get('/stats/parent/:id', [
  param('id').isInt().withMessage('ID必须是整数')
], ShippingController.getParentTypeShippingStats.bind(ShippingController));

// 添加兼容路由处理前端/api/shipping/chart的请求
router.get('/chart', StatsController.getChartData);

// 批量添加发货记录
router.post('/batch', validateBatchShippingRecords, ShippingController.batchCreate.bind(ShippingController));

// 获取发货记录列表（支持层级和汇总）
router.get('/hierarchy', ShippingController.getShippingRecordsWithHierarchy.bind(ShippingController));

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