const express = require('express');
const StatsController = require('../controllers/StatsController');

const router = express.Router();

// 按店铺统计
router.get('/shop-outputs/shops', StatsController.getShopOutputsByShop.bind(StatsController));

// 按快递类型统计
router.get('/shop-outputs/couriers', StatsController.getShopOutputsByCourier.bind(StatsController));

// 按日期统计
router.get('/shop-outputs/dates', StatsController.getShopOutputsByDate.bind(StatsController));

// 获取总计数据
router.get('/shop-outputs/total', StatsController.getShopOutputsTotal.bind(StatsController));

// 按类别统计
router.get('/shop-outputs/categories', StatsController.getShopOutputsByCategory.bind(StatsController));

// 导出发货数据
router.get('/export-shipping-data', StatsController.exportShippingData.bind(StatsController));

// 导出数据（店铺出力数据）
router.get('/export-data', StatsController.getExportData.bind(StatsController));

module.exports = router; 