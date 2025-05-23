const express = require('express');
const { CourierController, validateCourier } = require('../controllers/CourierController');

const router = express.Router();

// 获取所有快递类型
router.get('/', CourierController.getAll.bind(CourierController));

// 获取单个快递类型详情
router.get('/:id', CourierController.getById.bind(CourierController));

// 获取特定类别的所有快递类型
router.get('/category/:categoryId', CourierController.getByCategoryId.bind(CourierController));

// 创建快递类型
router.post('/', validateCourier, CourierController.create.bind(CourierController));

// 更新快递类型
router.put('/:id', validateCourier, CourierController.update.bind(CourierController));

// 删除快递类型
router.delete('/:id', CourierController.delete.bind(CourierController));

// 切换快递类型状态
router.put('/:id/toggle', CourierController.toggleStatus.bind(CourierController));

// 更新快递类型排序
router.post('/sort', CourierController.reorder.bind(CourierController));
router.post('/reorder', CourierController.reorder.bind(CourierController)); // 别名，保持API兼容性

module.exports = router; 