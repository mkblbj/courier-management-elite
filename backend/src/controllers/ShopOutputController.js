const ShopOutput = require('../models/ShopOutput');
const Shop = require('../models/Shop');
const Courier = require('../models/Courier');
const { body, validationResult } = require('express-validator');

/**
 * 验证店铺出力数据
 */
const validateShopOutput = [
  body('shop_id').notEmpty().withMessage('店铺ID不能为空')
    .isInt().withMessage('店铺ID必须是整数'),
  body('courier_id').notEmpty().withMessage('快递类型ID不能为空')
    .isInt().withMessage('快递类型ID必须是整数'),
  body('output_date').notEmpty().withMessage('出力日期不能为空')
    .isDate().withMessage('出力日期格式不正确'),
  body('quantity').notEmpty().withMessage('出力数量不能为空')
    .isInt().withMessage('出力数量必须是整数'),
  body('notes').optional()
];

class ShopOutputControllerClass {
  /**
   * 获取所有出力数据
   */
  async getAll(req, res) {
    try {
      const options = {
        shop_id: req.query.shop_id ? parseInt(req.query.shop_id) : null,
        courier_id: req.query.courier_id ? parseInt(req.query.courier_id) : null,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        sort_by: req.query.sort || 'output_date',
        sort_order: req.query.order || 'DESC',
        search: req.query.search || '',
        limit: req.query.limit ? parseInt(req.query.limit) : null,
        offset: req.query.offset ? parseInt(req.query.offset) : null
      };

      const outputs = await ShopOutput.getAll(options);
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: outputs
      });
    } catch (error) {
      console.error('获取出力数据列表失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取出力数据列表失败'
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
      
      // 检查是否已存在相同日期、店铺和快递类型的记录
      const existingRecord = await ShopOutput.getByShopCourierDate(
        req.body.shop_id, 
        req.body.courier_id, 
        req.body.output_date
      );
      
      // 创建或更新出力记录
      const id = await ShopOutput.add(req.body);
      
      if (!id) {
        return res.status(500).json({
          code: 500,
          message: '处理出力记录失败'
        });
      }
      
      // 获取新创建或更新的出力记录
      const newOutput = await ShopOutput.getById(id);
      
      // 根据是否更新了现有记录返回不同的消息
      const message = existingRecord ? '数量已累加' : '添加成功';
      
      res.status(existingRecord ? 200 : 201).json({
        code: 0,
        message: message,
        data: newOutput
      });
    } catch (error) {
      console.error('处理出力记录失败:', error);
      res.status(500).json({
        code: 500,
        message: '处理出力记录失败'
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
      // 修改为返回当日数据
      const outputs = await ShopOutput.getTodayOutputs();
      
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
      const outputs = await ShopOutput.getTodayOutputs();
      
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
}

const ShopOutputController = new ShopOutputControllerClass();

module.exports = {
  ShopOutputController,
  validateShopOutput
}; 