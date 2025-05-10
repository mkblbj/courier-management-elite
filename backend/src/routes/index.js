const express = require('express');
const courierRoutes = require('./courierRoutes');
const courierCategoryRoutes = require('./courierCategoryRoutes');
const shippingRoutes = require('./shippingRoutes');
const shopRoutes = require('./shopRoutes');
const shopCategoryRoutes = require('./shopCategoryRoutes');
const shopOutputRoutes = require('./shopOutputRoutes');
const statsRoutes = require('./statsRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

// API 根路径
router.get('/', (req, res) => {
  res.json({
    message: '快递API服务',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// 快递类型API路由
router.use('/couriers', courierRoutes);

// 快递类别API路由
router.use('/courier-categories', courierCategoryRoutes);

// 发货记录API路由
router.use('/shipping', shippingRoutes);

// 店铺类别API路由
router.use('/shop-categories', shopCategoryRoutes);

// 店铺API路由
router.use('/shops', shopRoutes);

// 店铺出力数据API路由
router.use('/shop-outputs', shopOutputRoutes);

// 统计分析API路由
router.use('/stats', statsRoutes);

// 仪表盘API路由
router.use('/dashboard', dashboardRoutes);

// API文档路由 (可选)
router.get('/docs', (req, res) => {
  res.json({
    message: 'API文档',
    apis: [
      {
        name: '快递类别API',
        description: '快递类别的CRUD操作',
        basePath: '/api/courier-categories',
        endpoints: [
          { method: 'GET', path: '/', description: '获取所有快递类别' },
          { method: 'GET', path: '/:id', description: '获取单个快递类别详情' },
          { method: 'POST', path: '/', description: '创建快递类别' },
          { method: 'PUT', path: '/:id', description: '更新快递类别' },
          { method: 'DELETE', path: '/:id', description: '删除快递类别' },
          { method: 'POST', path: '/sort', description: '更新快递类别排序' },
          { method: 'GET', path: '/:id/stats', description: '获取类别统计信息' }
        ]
      },
      {
        name: '快递类型API',
        description: '快递类型的CRUD操作',
        basePath: '/api/couriers',
        endpoints: [
          { method: 'GET', path: '/', description: '获取所有快递类型' },
          { method: 'GET', path: '/category/:categoryId', description: '获取特定类别的所有快递类型' },
          { method: 'GET', path: '/:id', description: '获取单个快递类型详情' },
          { method: 'POST', path: '/', description: '创建快递类型' },
          { method: 'PUT', path: '/:id', description: '更新快递类型' },
          { method: 'DELETE', path: '/:id', description: '删除快递类型' },
          { method: 'PUT', path: '/:id/toggle', description: '切换快递类型状态' },
          { method: 'POST', path: '/sort', description: '更新快递类型排序' }
        ]
      },
      {
        name: '发货记录API',
        description: '发货记录的CRUD操作和批量处理',
        basePath: '/api/shipping',
        endpoints: [
          { method: 'GET', path: '/', description: '获取发货记录列表' },
          { method: 'GET', path: '/:id', description: '获取单个发货记录详情' },
          { method: 'POST', path: '/', description: '创建发货记录' },
          { method: 'PUT', path: '/:id', description: '更新发货记录' },
          { method: 'DELETE', path: '/:id', description: '删除发货记录' },
          { method: 'POST', path: '/batch', description: '批量添加发货记录' }
        ]
      },
      {
        name: '店铺类别API',
        description: '店铺类别的CRUD操作',
        basePath: '/api/shop-categories',
        endpoints: [
          { method: 'GET', path: '/', description: '获取店铺类别列表' },
          { method: 'GET', path: '/:id', description: '获取单个店铺类别详情' },
          { method: 'POST', path: '/', description: '创建店铺类别' },
          { method: 'PUT', path: '/:id', description: '更新店铺类别' },
          { method: 'DELETE', path: '/:id', description: '删除店铺类别' },
          { method: 'POST', path: '/sort', description: '更新店铺类别排序' }
        ]
      },
      {
        name: '店铺API',
        description: '店铺的CRUD操作',
        basePath: '/api/shops',
        endpoints: [
          { method: 'GET', path: '/', description: '获取店铺列表' },
          { method: 'GET', path: '/:id', description: '获取单个店铺详情' },
          { method: 'POST', path: '/', description: '创建店铺' },
          { method: 'PUT', path: '/:id', description: '更新店铺' },
          { method: 'DELETE', path: '/:id', description: '删除店铺' },
          { method: 'POST', path: '/:id/toggle', description: '切换店铺状态' },
          { method: 'POST', path: '/sort', description: '更新店铺排序' }
        ]
      },
      {
        name: '店铺出力API',
        description: '店铺出力数据的CRUD操作',
        basePath: '/api/shop-outputs',
        endpoints: [
          { method: 'GET', path: '/', description: '获取出力数据列表' },
          { method: 'GET', path: '/recent', description: '获取最近录入数据' },
          { method: 'GET', path: '/today', description: '获取今日出力数据' },
          { method: 'GET', path: '/:id', description: '获取单条出力记录' },
          { method: 'POST', path: '/', description: '创建出力记录' },
          { method: 'PUT', path: '/:id', description: '更新出力记录' },
          { method: 'DELETE', path: '/:id', description: '删除出力记录' }
        ]
      },
      {
        name: '统计分析API',
        description: '店铺出力数据的统计分析',
        basePath: '/api/stats',
        endpoints: [
          { method: 'GET', path: '/shop-outputs/shops', description: '按店铺统计' },
          { method: 'GET', path: '/shop-outputs/couriers', description: '按快递类型统计' },
          { method: 'GET', path: '/shop-outputs/dates', description: '按日期统计' },
          { method: 'GET', path: '/shop-outputs/total', description: '获取总计数据' }
        ]
      },
      {
        name: '仪表盘API',
        description: '数据仪表盘',
        basePath: '/api/dashboard',
        endpoints: [
          { method: 'GET', path: '/shop-outputs/today', description: '获取今日出力概览' },
          { method: 'GET', path: '/shop-outputs/tomorrow', description: '获取明日出力预测' }
        ]
      }
    ]
  });
});

module.exports = router; 