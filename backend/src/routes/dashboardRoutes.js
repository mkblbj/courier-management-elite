const express = require('express');
const DashboardController = require('../controllers/DashboardController');

const router = express.Router();

// 获取今日出力概览
router.get('/shop-outputs/today', DashboardController.getTodayShopOutputs.bind(DashboardController));

// 获取明日出力预测
router.get('/shop-outputs/tomorrow', DashboardController.getTomorrowShopOutputs.bind(DashboardController));

// 获取店铺出力趋势数据
router.get('/shop-outputs/trend', DashboardController.getShopOutputTrend.bind(DashboardController));

// 清除仪表盘数据缓存
router.post('/cache/clear', DashboardController.clearCache.bind(DashboardController));

// Homepage widget 专用 API
router.get('/homepage', DashboardController.getHomepageStats.bind(DashboardController));

module.exports = router; 