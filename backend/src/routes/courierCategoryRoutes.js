const express = require('express');
const { CourierCategoryController, validateCourierCategory } = require('../controllers/CourierCategoryController');

const router = express.Router();

// 获取所有快递类别
router.get('/', CourierCategoryController.getAll.bind(CourierCategoryController));

// 获取单个快递类别详情
router.get('/:id', CourierCategoryController.getById.bind(CourierCategoryController));

// 创建快递类别
router.post('/', validateCourierCategory, CourierCategoryController.create.bind(CourierCategoryController));

// 更新快递类别
router.put('/:id', validateCourierCategory, CourierCategoryController.update.bind(CourierCategoryController));

// 删除快递类别
router.delete('/:id', CourierCategoryController.delete.bind(CourierCategoryController));

// 更新快递类别排序
router.post('/sort', CourierCategoryController.reorder.bind(CourierCategoryController));
router.post('/reorder', CourierCategoryController.reorder.bind(CourierCategoryController)); // 别名，保持API兼容性

// 获取类别统计信息
router.get('/:id/stats', CourierCategoryController.getStats.bind(CourierCategoryController));

module.exports = router; 