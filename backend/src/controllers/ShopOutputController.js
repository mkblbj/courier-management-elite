const ShopOutput = require('../models/ShopOutput');
const Shop = require('../models/Shop');
const Courier = require('../models/Courier');
const { body, validationResult } = require('express-validator');
const { formatToISOString, getToday } = require('../config/timezone');

/**
 * 验证店铺出力数据
 */
const validateShopOutput = [
  body('shop_id').notEmpty().withMessage('店铺ID不能为空')
    .isInt().withMessage('店铺ID必须是整数'),
  body('courier_id').notEmpty().withMessage('快递类型ID不能为空')
    .isInt().withMessage('快递类型ID必须是整数'),
  body('output_date').notEmpty().withMessage('出力日期不能为空')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('出力日期格式不正确，应为YYYY-MM-DD'),
  body('quantity').notEmpty().withMessage('出力数量不能为空')
    .isInt().withMessage('出力数量必须是整数'),
  body('notes').optional()
];

/**
 * 验证减少操作数据
 */
const validateSubtractOutput = [
  body('shop_id').notEmpty().withMessage('店铺ID不能为空')
    .isInt().withMessage('店铺ID必须是整数'),
  body('courier_id').notEmpty().withMessage('快递类型ID不能为空')
    .isInt().withMessage('快递类型ID必须是整数'),
  body('output_date').notEmpty().withMessage('出力日期不能为空')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('出力日期格式不正确，应为YYYY-MM-DD'),
  body('quantity').notEmpty().withMessage('减少数量不能为空')
    .isInt({ min: 1 }).withMessage('减少数量必须是大于0的整数'),
  body('notes').optional()
];

/**
 * 验证合单操作数据
 */
const validateMergeOutput = [
  body('shop_id').notEmpty().withMessage('店铺ID不能为空')
    .isInt().withMessage('店铺ID必须是整数'),
  body('courier_id').notEmpty().withMessage('快递类型ID不能为空')
    .isInt().withMessage('快递类型ID必须是整数'),
  body('output_date').notEmpty().withMessage('出力日期不能为空')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('出力日期格式不正确，应为YYYY-MM-DD'),
  body('quantity').notEmpty().withMessage('合单数量不能为空')
    .isInt({ min: 1 }).withMessage('合单数量必须是大于0的整数'),
  body('merge_note').optional()
    .isLength({ max: 500 }).withMessage('合单备注长度不能超过500字符'),
  body('notes').optional()
];

class ShopOutputControllerClass {
  /**
   * 获取所有出力数据
   */
  async getAll(req, res) {
    try {
      // 从请求中获取过滤和排序参数
      const options = {
        shop_id: req.query.shop_id ? parseInt(req.query.shop_id) : undefined,
        courier_id: req.query.courier_id ? parseInt(req.query.courier_id) : undefined,
        output_date: req.query.output_date || undefined,
        date_from: req.query.date_from || undefined,
        date_to: req.query.date_to || undefined,
        search: req.query.search || undefined,
        sort_by: req.query.sort_by || 'output_date',
        sort_order: req.query.sort_order || 'DESC',
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined
      };
      
      // 获取店铺出力数据
      const data = await ShopOutput.getAll(options);
      
      res.status(200).json({
        code: 0,
        message: "获取成功",
        data
      });
    } catch (error) {
      console.error("获取所有出力数据失败:", error);
      res.status(500).json({
        code: 500,
        message: "查询出错"
      });
    }
  }

  /**
   * 获取单个出力记录
   */
  async getById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const output = await ShopOutput.getById(id);
      
      if (!output) {
        return res.status(404).json({
          code: 404,
          message: '出力记录不存在'
        });
      }
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: output
      });
    } catch (error) {
      console.error('获取出力记录详情失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取出力记录详情失败'
      });
    }
  }

  /**
   * 创建出力记录
   */
  async create(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 400,
          message: '请求数据验证失败',
          errors: errors.array()
        });
      }
      
      // 检查店铺是否存在
      const shop = await Shop.getById(req.body.shop_id);
      if (!shop) {
        return res.status(400).json({
          code: 400,
          message: '店铺不存在'
        });
      }
      
      // 检查快递类型是否存在
      const courier = await Courier.getById(req.body.courier_id);
      if (!courier) {
        return res.status(400).json({
          code: 400,
          message: '快递类型不存在'
        });
      }
      
      // 创建新的出力记录（默认为新增操作）
      const outputData = {
        ...req.body,
        operation_type: 'add'
      };
      const id = await ShopOutput.add(outputData);
      
      if (!id) {
        return res.status(500).json({
          code: 500,
          message: '创建出力记录失败'
        });
      }
      
      // 获取新创建的出力记录
      const newOutput = await ShopOutput.getById(id);
      
      res.status(201).json({
        code: 0,
        message: '添加成功',
        data: newOutput
      });
    } catch (error) {
      console.error('创建出力记录失败:', error);
      res.status(500).json({
        code: 500,
        message: '创建出力记录失败'
      });
    }
  }

  /**
   * 更新出力记录
   */
  async update(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 400,
          message: '请求数据验证失败',
          errors: errors.array()
        });
      }
      
      // 检查出力记录是否存在
      const output = await ShopOutput.getById(id);
      if (!output) {
        return res.status(404).json({
          code: 404,
          message: '出力记录不存在'
        });
      }
      
      // 如果更新店铺ID，检查店铺是否存在
      if (req.body.shop_id && req.body.shop_id !== output.shop_id) {
        const shop = await Shop.getById(req.body.shop_id);
        if (!shop) {
          return res.status(400).json({
            code: 400,
            message: '店铺不存在'
          });
        }
      }
      
      // 如果更新快递类型ID，检查快递类型是否存在
      if (req.body.courier_id && req.body.courier_id !== output.courier_id) {
        const courier = await Courier.getById(req.body.courier_id);
        if (!courier) {
          return res.status(400).json({
            code: 400,
            message: '快递类型不存在'
          });
        }
      }
      
      // 更新出力记录
      const updated = await ShopOutput.update(id, req.body);
      
      if (!updated) {
        return res.status(500).json({
          code: 500,
          message: '更新出力记录失败'
        });
      }
      
      // 获取更新后的出力记录
      const updatedOutput = await ShopOutput.getById(id);
      
      res.status(200).json({
        code: 0,
        message: '更新成功',
        data: updatedOutput
      });
    } catch (error) {
      console.error('更新出力记录失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新出力记录失败'
      });
    }
  }

  /**
   * 删除出力记录
   */
  async delete(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      // 检查出力记录是否存在
      const output = await ShopOutput.getById(id);
      if (!output) {
        return res.status(404).json({
          code: 404,
          message: '出力记录不存在'
        });
      }
      
      // 删除出力记录
      const deleted = await ShopOutput.delete(id);
      
      if (!deleted) {
        return res.status(500).json({
          code: 500,
          message: '删除出力记录失败'
        });
      }
      
      res.status(200).json({
        code: 0,
        message: '删除成功'
      });
    } catch (error) {
      console.error('删除出力记录失败:', error);
      res.status(500).json({
        code: 500,
        message: '删除出力记录失败'
      });
    }
  }

  /**
   * 获取最近录入的出力数据
   */
  async getRecent(req, res) {
    try {
      // 使用时区工具获取今天的日期
      const today = formatToISOString(getToday(), false);
      const outputs = await ShopOutput.getAggregatedOutputsByDate(today);
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: outputs
      });
    } catch (error) {
      console.error('获取最近录入数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取最近录入数据失败'
      });
    }
  }

  /**
   * 获取今日出力数据
   */
  async getToday(req, res) {
    try {
      // 获取今日数据并按店铺和快递类型分组累加
      const outputs = await ShopOutput.getAggregatedTodayOutputs();
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: outputs
      });
    } catch (error) {
      console.error('获取今日出力数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取今日出力数据失败'
      });
    }
  }

  /**
   * 减少出力数据
   */
  async subtractOutput(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 400,
          message: '请求数据验证失败',
          errors: errors.array()
        });
      }
      
      const { shop_id, courier_id, output_date, quantity, notes } = req.body;
      
      // 检查店铺是否存在
      const shop = await Shop.getById(shop_id);
      if (!shop) {
        return res.status(400).json({
          code: 400,
          message: '店铺不存在'
        });
      }
      
      // 检查快递类型是否存在
      const courier = await Courier.getById(courier_id);
      if (!courier) {
        return res.status(400).json({
          code: 400,
          message: '快递类型不存在'
        });
      }
      
      // 计算当前该店铺该快递类型的总量
      const currentStats = await ShopOutput.getNetGrowthStats({
        shop_id,
        courier_id,
        output_date
      });
      
      const currentTotal = currentStats.net_growth;
      
      // 验证是否有足够的数量可以减少
      if (currentTotal < quantity) {
        return res.status(400).json({
          code: 400,
          message: `减少数量(${quantity})超过当前库存(${currentTotal})`
        });
      }
      
      // 创建减少记录
      const subtractData = {
        shop_id,
        courier_id,
        output_date,
        quantity: -quantity, // 负数表示减少
        operation_type: 'subtract',
        original_quantity: currentTotal,
        notes: notes || `減少: 元出力${currentTotal}，減少${quantity}`
      };
      
      const id = await ShopOutput.add(subtractData);
      
      if (!id) {
        return res.status(500).json({
          code: 500,
          message: '创建减少记录失败'
        });
      }
      
      // 获取新创建的记录
      const newRecord = await ShopOutput.getById(id);
      
      res.status(201).json({
        code: 0,
        message: '减少操作成功',
        data: {
          record: newRecord,
          original_quantity: currentTotal,
          subtract_quantity: quantity,
          remaining_quantity: currentTotal - quantity
        }
      });
    } catch (error) {
      console.error('减少出力数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '减少出力数据失败'
      });
    }
  }

  /**
   * 合单操作
   */
  async mergeOutput(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 400,
          message: '请求数据验证失败',
          errors: errors.array()
        });
      }
      
      const { shop_id, courier_id, output_date, quantity, merge_note, notes } = req.body;
      
      // 检查店铺是否存在
      const shop = await Shop.getById(shop_id);
      if (!shop) {
        return res.status(400).json({
          code: 400,
          message: '店铺不存在'
        });
      }
      
      // 检查快递类型是否存在
      const courier = await Courier.getById(courier_id);
      if (!courier) {
        return res.status(400).json({
          code: 400,
          message: '快递类型不存在'
        });
      }
      
      // 创建合单记录
      const mergeData = {
        shop_id,
        courier_id,
        output_date,
        quantity,
        operation_type: 'merge',
        merge_note,
        notes: notes || `合戸発送: ${merge_note}`
      };
      
      const id = await ShopOutput.add(mergeData);
      
      if (!id) {
        return res.status(500).json({
          code: 500,
          message: '创建合单记录失败'
        });
      }
      
      // 获取新创建的记录
      const newRecord = await ShopOutput.getById(id);
      
      res.status(201).json({
        code: 0,
        message: '合单操作成功',
        data: newRecord
      });
    } catch (error) {
      console.error('合单操作失败:', error);
      res.status(500).json({
        code: 500,
        message: '合单操作失败'
      });
    }
  }

  /**
   * 根据操作类型获取出力数据
   */
  async getByOperationType(req, res) {
    try {
      const operationType = req.params.operationType;
      
      // 验证操作类型
      if (!['add', 'subtract', 'merge'].includes(operationType)) {
        return res.status(400).json({
          code: 400,
          message: '无效的操作类型，支持的类型: add, subtract, merge'
        });
      }
      
      // 从请求中获取过滤参数
      const options = {
        output_date: req.query.output_date || undefined,
        date_from: req.query.date_from || undefined,
        date_to: req.query.date_to || undefined,
        shop_id: req.query.shop_id ? parseInt(req.query.shop_id) : undefined,
        courier_id: req.query.courier_id ? parseInt(req.query.courier_id) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined
      };
      
      const data = await ShopOutput.getByOperationType(operationType, options);
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data
      });
    } catch (error) {
      console.error('根据操作类型获取数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取数据失败'
      });
    }
  }

  /**
   * 获取操作类型统计数据
   */
  async getOperationStats(req, res) {
    try {
      // 从请求中获取过滤参数
      const options = {
        output_date: req.query.output_date || undefined,
        date_from: req.query.date_from || undefined,
        date_to: req.query.date_to || undefined,
        shop_id: req.query.shop_id ? parseInt(req.query.shop_id) : undefined,
        courier_id: req.query.courier_id ? parseInt(req.query.courier_id) : undefined
      };
      
      // 获取按操作类型分组的统计
      const typeStats = await ShopOutput.getStatsByOperationType(options);
      
      // 获取净增长统计
      const netStats = await ShopOutput.getNetGrowthStats(options);
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: {
          by_type: typeStats,
          net_growth: netStats
        }
      });
    } catch (error) {
      console.error('获取操作统计失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取操作统计失败'
      });
    }
  }

  /**
   * 获取最近录入数据（支持操作类型标识）
   */
  async getRecentWithOperationType(req, res) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const outputs = await ShopOutput.getRecent(limit);
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: outputs
      });
    } catch (error) {
      console.error('获取最近录入数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取最近录入数据失败'
      });
    }
  }
}

const ShopOutputController = new ShopOutputControllerClass();

module.exports = {
  ShopOutputController,
  validateShopOutput,
  validateSubtractOutput,
  validateMergeOutput
}; 