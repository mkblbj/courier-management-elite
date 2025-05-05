const express = require('express');
const { ShopController, validateShop } = require('../controllers/ShopController');

const router = express.Router();

// 获取所有店铺
router.get('/', ShopController.getAll.bind(ShopController));

// 获取单个店铺详情
router.get('/:id', ShopController.getById.bind(ShopController));

// 创建店铺
router.post('/', validateShop, ShopController.create.bind(ShopController));

// 更新店铺
router.put('/:id', validateShop, ShopController.update.bind(ShopController));

// 删除店铺
router.delete('/:id', ShopController.delete.bind(ShopController));

// 切换店铺状态
router.post('/:id/toggle', ShopController.toggleStatus.bind(ShopController));

// 更新店铺排序
router.post('/sort', ShopController.reorder.bind(ShopController));

module.exports = router; 