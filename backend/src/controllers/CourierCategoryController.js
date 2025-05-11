const CourierCategory = require('../models/CourierCategory');
const { body, validationResult } = require('express-validator');

/**
 * 验证快递类别数据
 */
const validateCourierCategory = [
  body('name').notEmpty().withMessage('名称不能为空')
    .isLength({ max: 100 }).withMessage('名称长度不能超过100'),
  body('sort_order').optional().isInt().withMessage('排序值必须是整数')
];

class CourierCategoryController {
  /**
   * 获取所有快递类别
   */
  async getAll(req, res) {
    try {
      const options = {
        sort_by: req.query.sort || 'sort_order',
        sort_order: req.query.order || 'ASC',
        search: req.query.search || ''
      };

      const categories = await CourierCategory.getAll(options);
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: categories
      });
    } catch (error) {
      console.error('获取快递类别列表失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取快递类别列表失败'
      });
    }
  }

  /**
   * 获取单个快递类别
   */
  async getById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const category = await CourierCategory.getById(id);
      
      if (!category) {
        return res.status(404).json({
          code: 404,
          message: '快递类别不存在'
        });
      }
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: category
      });
    } catch (error) {
      console.error('获取快递类别详情失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取快递类别详情失败'
      });
    }
  }

  /**
   * 创建快递类别
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
      
      // 检查名称是否重复
      const existingCategories = await CourierCategory.getAll({ search: req.body.name });
      const nameExists = existingCategories.some(c => c.name === req.body.name);
      
      if (nameExists) {
        return res.status(400).json({
          code: 400,
          message: '快递类别名称已存在'
        });
      }
      
      // 创建快递类别
      const id = await CourierCategory.add(req.body);
      
      if (!id) {
        return res.status(500).json({
          code: 500,
          message: '创建快递类别失败'
        });
      }
      
      // 获取新创建的快递类别
      const newCategory = await CourierCategory.getById(id);
      
      res.status(201).json({
        code: 0,
        message: '添加成功',
        data: newCategory
      });
    } catch (error) {
      console.error('创建快递类别失败:', error);
      res.status(500).json({
        code: 500,
        message: '创建快递类别失败'
      });
    }
  }

  /**
   * 更新快递类别
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
      
      // 检查快递类别是否存在
      const category = await CourierCategory.getById(id);
      if (!category) {
        return res.status(404).json({
          code: 404,
          message: '快递类别不存在'
        });
      }
      
      // 如果要更新名称，检查名称是否重复
      if (req.body.name && req.body.name !== category.name) {
        const existingCategories = await CourierCategory.getAll({ search: req.body.name });
        const nameExists = existingCategories.some(c => c.name === req.body.name);
        
        if (nameExists) {
          return res.status(400).json({
            code: 400,
            message: '快递类别名称已存在'
          });
        }
      }
      
      // 更新快递类别
      const updated = await CourierCategory.update(id, req.body);
      
      if (!updated) {
        return res.status(500).json({
          code: 500,
          message: '更新快递类别失败'
        });
      }
      
      // 获取更新后的快递类别
      const updatedCategory = await CourierCategory.getById(id);
      
      res.status(200).json({
        code: 0,
        message: '更新成功',
        data: updatedCategory
      });
    } catch (error) {
      console.error('更新快递类别失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新快递类别失败'
      });
    }
  }

  /**
   * 删除快递类别
   */
  async delete(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      // 检查快递类别是否存在
      const category = await CourierCategory.getById(id);
      if (!category) {
        return res.status(404).json({
          code: 404,
          message: '快递类别不存在'
        });
      }
      
      // 检查是否有快递类型使用此类别
      const isBeingUsed = await CourierCategory.isBeingUsed(id);
      if (isBeingUsed) {
        return res.status(400).json({
          code: 400,
          message: '该类别下存在快递类型，无法删除'
        });
      }
      
      // 删除快递类别
      const deleted = await CourierCategory.delete(id);
      
      if (!deleted) {
        return res.status(500).json({
          code: 500,
          message: '删除快递类别失败'
        });
      }
      
      res.status(200).json({
        code: 0,
        message: '删除成功'
      });
    } catch (error) {
      console.error('删除快递类别失败:', error);
      res.status(500).json({
        code: 500,
        message: '删除快递类别失败'
      });
    }
  }

  /**
   * 重新排序快递类别
   */
  async reorder(req, res) {
    try {
      const { items } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '排序数据格式不正确'
        });
      }
      
      // 更新排序
      const updated = await CourierCategory.updateSort(items);
      
      if (!updated) {
        return res.status(500).json({
          code: 500,
          message: '更新排序失败'
        });
      }
      
      res.status(200).json({
        code: 0,
        message: '排序更新成功'
      });
    } catch (error) {
      console.error('更新快递类别排序失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新排序失败'
      });
    }
  }

  /**
   * 获取类别统计信息
   */
  async getStats(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      // 检查快递类别是否存在
      const category = await CourierCategory.getById(id);
      if (!category) {
        return res.status(404).json({
          code: 404,
          message: '快递类别不存在'
        });
      }
      
      const options = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        shop_id: req.query.shop_id ? parseInt(req.query.shop_id) : undefined
      };
      
      const stats = await CourierCategory.getCategoryStats(id, options);
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: stats
      });
    } catch (error) {
      console.error('获取快递类别统计信息失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取统计信息失败'
      });
    }
  }
}

module.exports = {
  CourierCategoryController: new CourierCategoryController(),
  validateCourierCategory
}; 