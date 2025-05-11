const express = require('express');
const { ShopCategoryController, validateShopCategory } = require('../controllers/ShopCategoryController');

const router = express.Router();

// 获取所有店铺类别
router.get('/', ShopCategoryController.getAll.bind(ShopCategoryController));

// 获取单个店铺类别详情
router.get('/:id', ShopCategoryController.getById.bind(ShopCategoryController));

// 创建店铺类别
router.post('/', validateShopCategory, ShopCategoryController.create.bind(ShopCategoryController));

// 更新店铺类别
router.put('/:id', validateShopCategory, ShopCategoryController.update.bind(ShopCategoryController));

// 删除店铺类别
router.delete('/:id', ShopCategoryController.delete.bind(ShopCategoryController));

// 更新店铺类别排序
router.post('/sort', ShopCategoryController.reorder.bind(ShopCategoryController));

module.exports = router; 