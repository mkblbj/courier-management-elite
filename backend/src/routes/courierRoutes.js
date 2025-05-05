const express = require('express');
const { CourierController, validateCourier } = require('../controllers/CourierController');

const router = express.Router();

// 获取所有快递类型
router.get('/', CourierController.getAll.bind(CourierController));

// 获取快递类型层级结构
router.get('/hierarchy', CourierController.getTypeHierarchy.bind(CourierController));

// 获取特定母类型的所有子类型
router.get('/:parentId/children', CourierController.getChildTypes.bind(CourierController));

// 获取单个快递类型详情
router.get('/:id', CourierController.getById.bind(CourierController));

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