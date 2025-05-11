const ShopCategory = require('../models/ShopCategory');
const { body, validationResult } = require('express-validator');

/**
 * 验证店铺类别数据
 */
const validateShopCategory = [
  body('name').notEmpty().withMessage('名称不能为空')
    .isLength({ max: 50 }).withMessage('名称长度不能超过50'),
  body('sort_order').optional().isInt().withMessage('排序值必须是整数')
];

class ShopCategoryControllerClass {
  /**
   * 获取所有店铺类别
   */
  async getAll(req, res) {
    try {
      const options = {
        sort_by: req.query.sort || 'sort_order',
        sort_order: req.query.order || 'ASC',
        search: req.query.search || ''
      };

      const categories = await ShopCategory.getAll(options);
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: categories
      });
    } catch (error) {
      console.error('获取店铺类别列表失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取店铺类别列表失败'
      });
    }
  }

  /**
   * 获取单个店铺类别
   */
  async getById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const category = await ShopCategory.getById(id);
      
      if (!category) {
        return res.status(404).json({
          code: 404,
          message: '店铺类别不存在'
        });
      }
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: category
      });
    } catch (error) {
      console.error('获取店铺类别详情失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取店铺类别详情失败'
      });
    }
  }

  /**
   * 创建店铺类别
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
      const existingCategories = await ShopCategory.getAll({ search: req.body.name });
      const nameExists = existingCategories.some(c => c.name === req.body.name);
      
      if (nameExists) {
        return res.status(400).json({
          code: 400,
          message: '店铺类别名称已存在'
        });
      }
      
      // 创建店铺类别
      const id = await ShopCategory.add(req.body);
      
      if (!id) {
        return res.status(500).json({
          code: 500,
          message: '创建店铺类别失败'
        });
      }
      
      // 获取新创建的店铺类别
      const newCategory = await ShopCategory.getById(id);
      
      res.status(201).json({
        code: 0,
        message: '添加成功',
        data: newCategory
      });
    } catch (error) {
      console.error('创建店铺类别失败:', error);
      res.status(500).json({
        code: 500,
        message: '创建店铺类别失败'
      });
    }
  }

  /**
   * 更新店铺类别
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
      
      // 检查店铺类别是否存在
      const category = await ShopCategory.getById(id);
      if (!category) {
        return res.status(404).json({
          code: 404,
          message: '店铺类别不存在'
        });
      }
      
      // 如果要更新名称，检查名称是否重复
      if (req.body.name && req.body.name !== category.name) {
        const existingCategories = await ShopCategory.getAll({ search: req.body.name });
        const nameExists = existingCategories.some(c => c.name === req.body.name);
        
        if (nameExists) {
          return res.status(400).json({
            code: 400,
            message: '店铺类别名称已存在'
          });
        }
      }
      
      // 更新店铺类别
      const updated = await ShopCategory.update(id, req.body);
      
      if (!updated) {
        return res.status(500).json({
          code: 500,
          message: '更新店铺类别失败'
        });
      }
      
      // 获取更新后的店铺类别
      const updatedCategory = await ShopCategory.getById(id);
      
      res.status(200).json({
        code: 0,
        message: '更新成功',
        data: updatedCategory
      });
    } catch (error) {
      console.error('更新店铺类别失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新店铺类别失败'
      });
    }
  }

  /**
   * 删除店铺类别
   */
  async delete(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      // 检查类别是否存在
      const category = await ShopCategory.getById(id);
      if (!category) {
        return res.status(404).json({
          code: 404,
          message: '店铺类别不存在'
        });
      }
      
      // 检查类别是否被店铺使用
      const isBeingUsed = await ShopCategory.isBeingUsed(id);
      if (isBeingUsed) {
        return res.status(400).json({
          code: 400,
          message: '无法删除已被店铺使用的类别'
        });
      }
      
      // 删除类别
      const deleted = await ShopCategory.delete(id);
      
      if (!deleted) {
        return res.status(500).json({
          code: 500,
          message: '删除店铺类别失败'
        });
      }
      
      res.status(200).json({
        code: 0,
        message: '删除成功'
      });
    } catch (error) {
      console.error('删除店铺类别失败:', error);
      res.status(500).json({
        code: 500,
        message: '删除店铺类别失败'
      });
    }
  }

  /**
   * 更新店铺类别排序
   */
  async reorder(req, res) {
    try {
      const { orderData } = req.body;
      
      if (!Array.isArray(orderData) || orderData.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '排序数据无效'
        });
      }
      
      const result = await ShopCategory.updateSort(orderData);
      
      if (!result) {
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
      console.error('更新店铺类别排序失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新排序失败'
      });
    }
  }
}

const ShopCategoryController = new ShopCategoryControllerClass();

module.exports = {
  ShopCategoryController,
  validateShopCategory
}; 