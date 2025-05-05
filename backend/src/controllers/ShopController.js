const Shop = require('../models/Shop');
const { body, validationResult } = require('express-validator');

/**
 * 验证店铺数据
 */
const validateShop = [
  body('name').notEmpty().withMessage('名称不能为空')
    .isLength({ max: 100 }).withMessage('名称长度不能超过100'),
  body('is_active').optional().isBoolean().withMessage('状态必须是布尔值'),
  body('sort_order').optional().isInt().withMessage('排序值必须是整数'),
  body('remark').optional()
];

class ShopControllerClass {
  /**
   * 获取所有店铺
   */
  async getAll(req, res) {
    try {
      const isActive = req.query.status === 'active' ? true : 
                       req.query.status === 'inactive' ? false : null;

      const options = {
        is_active: isActive,
        sort_by: req.query.sort || 'sort_order',
        sort_order: req.query.order || 'ASC',
        search: req.query.search || ''
      };

      const shops = await Shop.getAll(options);
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: shops
      });
    } catch (error) {
      console.error('获取店铺列表失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取店铺列表失败'
      });
    }
  }

  /**
   * 获取单个店铺
   */
  async getById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const shop = await Shop.getById(id);
      
      if (!shop) {
        return res.status(404).json({
          code: 404,
          message: '店铺不存在'
        });
      }
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: shop
      });
    } catch (error) {
      console.error('获取店铺详情失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取店铺详情失败'
      });
    }
  }

  /**
   * 创建店铺
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
      const existingShops = await Shop.getAll({ search: req.body.name });
      const nameExists = existingShops.some(s => s.name === req.body.name);
      
      if (nameExists) {
        return res.status(400).json({
          code: 400,
          message: '店铺名称已存在'
        });
      }
      
      // 创建店铺
      const id = await Shop.add(req.body);
      
      if (!id) {
        return res.status(500).json({
          code: 500,
          message: '创建店铺失败'
        });
      }
      
      // 获取新创建的店铺
      const newShop = await Shop.getById(id);
      
      res.status(201).json({
        code: 0,
        message: '添加成功',
        data: newShop
      });
    } catch (error) {
      console.error('创建店铺失败:', error);
      res.status(500).json({
        code: 500,
        message: '创建店铺失败'
      });
    }
  }

  /**
   * 更新店铺
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
      
      // 检查店铺是否存在
      const shop = await Shop.getById(id);
      if (!shop) {
        return res.status(404).json({
          code: 404,
          message: '店铺不存在'
        });
      }
      
      // 如果要更新名称，检查名称是否重复
      if (req.body.name && req.body.name !== shop.name) {
        const existingShops = await Shop.getAll({ search: req.body.name });
        const nameExists = existingShops.some(s => s.name === req.body.name);
        
        if (nameExists) {
          return res.status(400).json({
            code: 400,
            message: '店铺名称已存在'
          });
        }
      }
      
      // 更新店铺
      const updated = await Shop.update(id, req.body);
      
      if (!updated) {
        return res.status(500).json({
          code: 500,
          message: '更新店铺失败'
        });
      }
      
      // 获取更新后的店铺
      const updatedShop = await Shop.getById(id);
      
      res.status(200).json({
        code: 0,
        message: '更新成功',
        data: updatedShop
      });
    } catch (error) {
      console.error('更新店铺失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新店铺失败'
      });
    }
  }

  /**
   * 删除店铺
   */
  async delete(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      // 检查店铺是否存在
      const shop = await Shop.getById(id);
      if (!shop) {
        return res.status(404).json({
          code: 404,
          message: '店铺不存在'
        });
      }
      
      // 删除店铺
      const deleted = await Shop.delete(id);
      
      if (!deleted) {
        return res.status(500).json({
          code: 500,
          message: '删除店铺失败'
        });
      }
      
      res.status(200).json({
        code: 0,
        message: '删除成功'
      });
    } catch (error) {
      console.error('删除店铺失败:', error);
      
      // 如果是外键约束错误
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({
          code: 400,
          message: '该店铺有关联的出力数据，无法删除'
        });
      }
      
      res.status(500).json({
        code: 500,
        message: '删除店铺失败'
      });
    }
  }

  /**
   * 切换店铺状态
   */
  async toggleStatus(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      // 检查店铺是否存在
      const shop = await Shop.getById(id);
      if (!shop) {
        return res.status(404).json({
          code: 404,
          message: '店铺不存在'
        });
      }
      
      // 切换状态
      const toggled = await Shop.toggleActive(id);
      
      if (!toggled) {
        return res.status(500).json({
          code: 500,
          message: '切换店铺状态失败'
        });
      }
      
      // 获取更新后的店铺
      const updatedShop = await Shop.getById(id);
      
      res.status(200).json({
        code: 0,
        message: updatedShop.is_active ? '店铺已启用' : '店铺已禁用',
        data: updatedShop
      });
    } catch (error) {
      console.error('切换店铺状态失败:', error);
      res.status(500).json({
        code: 500,
        message: '切换店铺状态失败'
      });
    }
  }

  /**
   * 更新店铺排序
   */
  async reorder(req, res) {
    try {
      // 验证请求数据
      if (!Array.isArray(req.body)) {
        return res.status(400).json({
          code: 400,
          message: '请求数据格式不正确，应为数组'
        });
      }
      
      // 验证数组中的每一项
      for (const item of req.body) {
        if (!item.id || typeof item.sort_order !== 'number') {
          return res.status(400).json({
            code: 400,
            message: '数组中的数据格式不正确，每一项应包含id和sort_order'
          });
        }
      }
      
      // 更新排序
      const updated = await Shop.updateSort(req.body);
      
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
      console.error('更新店铺排序失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新店铺排序失败'
      });
    }
  }
}

const ShopController = new ShopControllerClass();

module.exports = {
  ShopController,
  validateShop
}; 