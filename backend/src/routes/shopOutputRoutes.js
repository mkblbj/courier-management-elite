const express = require('express');
const { ShopOutputController, validateShopOutput } = require('../controllers/ShopOutputController');

const router = express.Router();

// 获取出力数据列表
router.get('/', ShopOutputController.getAll.bind(ShopOutputController));

// 获取最近录入数据
router.get('/recent', ShopOutputController.getRecent.bind(ShopOutputController));

// 获取今日出力数据
router.get('/today', ShopOutputController.getToday.bind(ShopOutputController));

// 获取单条出力记录
router.get('/:id', ShopOutputController.getById.bind(ShopOutputController));

// 创建出力记录
router.post('/', validateShopOutput, ShopOutputController.create.bind(ShopOutputController));

// 更新出力记录
router.put('/:id', validateShopOutput, ShopOutputController.update.bind(ShopOutputController));

// 删除出力记录
router.delete('/:id', ShopOutputController.delete.bind(ShopOutputController));

module.exports = router; 