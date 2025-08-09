const express = require('express');
const { MercariController } = require('../controllers/MercariController');

const router = express.Router();

// 受鉴权保护（占位：项目暂无统一 auth 中间件文件导出，这里保持与其他路由一致的模式）
// 如果项目后来引入 requireAuth，中间件可在此挂载：
// const { requireAuth } = require('../middlewares/auth');
// router.use(requireAuth);

// Mercari Shops 概览（Mock）
router.get('/shops-overview', MercariController.getShopsOverview.bind(MercariController));

module.exports = router;


