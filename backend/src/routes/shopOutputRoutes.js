const express = require('express');
const { 
  ShopOutputController, 
  validateShopOutput, 
  validateSubtractOutput, 
  validateMergeOutput 
} = require('../controllers/ShopOutputController');

const router = express.Router();

// 获取出力数据列表
router.get('/', ShopOutputController.getAll.bind(ShopOutputController));

// 获取最近录入数据（支持操作类型标识）
router.get('/recent', ShopOutputController.getRecentWithOperationType.bind(ShopOutputController));

// 获取今日出力数据
router.get('/today', ShopOutputController.getToday.bind(ShopOutputController));

// 获取操作统计数据
router.get('/stats/operations', ShopOutputController.getOperationStats.bind(ShopOutputController));

// 根据操作类型获取数据
router.get('/operation/:operationType', ShopOutputController.getByOperationType.bind(ShopOutputController));

// 获取单条出力记录
router.get('/:id', ShopOutputController.getById.bind(ShopOutputController));

// 创建出力记录（新增操作）
router.post('/', validateShopOutput, ShopOutputController.create.bind(ShopOutputController));

// 减少出力数据
router.post('/subtract', validateSubtractOutput, ShopOutputController.subtractOutput.bind(ShopOutputController));

// 合单操作
router.post('/merge', validateMergeOutput, ShopOutputController.mergeOutput.bind(ShopOutputController));

// 更新出力记录
router.put('/:id', validateShopOutput, ShopOutputController.update.bind(ShopOutputController));

// 删除出力记录
router.delete('/:id', ShopOutputController.delete.bind(ShopOutputController));

module.exports = router; 