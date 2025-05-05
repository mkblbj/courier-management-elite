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

module.exports = router; 