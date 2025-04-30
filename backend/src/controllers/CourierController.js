const Courier = require('../models/Courier');
const { body, validationResult } = require('express-validator');

/**
 * 验证快递类型数据
 */
const validateCourier = [
  body('name').notEmpty().withMessage('名称不能为空')
    .isLength({ max: 100 }).withMessage('名称长度不能超过100'),
  body('code').optional().isLength({ max: 50 }).withMessage('代码长度不能超过50'),
  body('remark').optional(),
  body('is_active').optional().isBoolean().withMessage('状态必须是布尔值'),
  body('sort_order').optional().isInt().withMessage('排序值必须是整数'),
  body('parent_id').optional().isInt().withMessage('父类型ID必须是整数')
];

class CourierController {
  /**
   * 获取所有快递类型
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

      const couriers = await Courier.getAll(options);
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: couriers
      });
    } catch (error) {
      console.error('获取快递类型列表失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取快递类型列表失败'
      });
    }
  }

  /**
   * 获取单个快递类型
   */
  async getById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const courier = await Courier.getById(id);
      
      if (!courier) {
        return res.status(404).json({
          code: 404,
          message: '快递类型不存在'
        });
      }
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: courier
      });
    } catch (error) {
      console.error('获取快递类型详情失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取快递类型详情失败'
      });
    }
  }

  /**
   * 创建快递类型
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
      const existingCouriers = await Courier.getAll({ search: req.body.name });
      const nameExists = existingCouriers.some(c => c.name === req.body.name);
      
      if (nameExists) {
        return res.status(400).json({
          code: 400,
          message: '快递类型名称已存在'
        });
      }
      
      // 创建快递类型
      const id = await Courier.add(req.body);
      
      if (!id) {
        return res.status(500).json({
          code: 500,
          message: '创建快递类型失败'
        });
      }
      
      // 获取新创建的快递类型
      const newCourier = await Courier.getById(id);
      
      res.status(201).json({
        code: 0,
        message: '添加成功',
        data: newCourier
      });
    } catch (error) {
      console.error('创建快递类型失败:', error);
      res.status(500).json({
        code: 500,
        message: '创建快递类型失败'
      });
    }
  }

  /**
   * 更新快递类型
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
      
      // 检查快递类型是否存在
      const courier = await Courier.getById(id);
      if (!courier) {
        return res.status(404).json({
          code: 404,
          message: '快递类型不存在'
        });
      }
      
      // 如果要更新名称，检查名称是否重复
      if (req.body.name && req.body.name !== courier.name) {
        const existingCouriers = await Courier.getAll({ search: req.body.name });
        const nameExists = existingCouriers.some(c => c.name === req.body.name);
        
        if (nameExists) {
          return res.status(400).json({
            code: 400,
            message: '快递类型名称已存在'
          });
        }
      }
      
      // 更新快递类型
      const updated = await Courier.update(id, req.body);
      
      if (!updated) {
        return res.status(500).json({
          code: 500,
          message: '更新快递类型失败'
        });
      }
      
      // 获取更新后的快递类型
      const updatedCourier = await Courier.getById(id);
      
      res.status(200).json({
        code: 0,
        message: '更新成功',
        data: updatedCourier
      });
    } catch (error) {
      console.error('更新快递类型失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新快递类型失败'
      });
    }
  }

  /**
   * 删除快递类型
   */
  async delete(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      // 检查快递类型是否存在
      const courier = await Courier.getById(id);
      if (!courier) {
        return res.status(404).json({
          code: 404,
          message: '快递类型不存在'
        });
      }
      
      // 检查是否有子类型
      const hasChildren = await Courier.hasChildren(id);
      if (hasChildren) {
        return res.status(400).json({
          code: 400,
          message: '不能删除有子类型的母类型'
        });
      }
      
      // TODO: 这里应该检查是否有关联的发货记录，如有则不允许删除
      // 暂时不实现，后续需要时可添加
      
      // 删除快递类型
      const deleted = await Courier.delete(id);
      
      if (!deleted) {
        return res.status(500).json({
          code: 500,
          message: '删除快递类型失败'
        });
      }
      
      res.status(200).json({
        code: 0,
        message: '删除成功'
      });
    } catch (error) {
      console.error('删除快递类型失败:', error);
      res.status(500).json({
        code: 500,
        message: '删除快递类型失败'
      });
    }
  }

  /**
   * 切换快递类型状态
   */
  async toggleStatus(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      // 检查快递类型是否存在
      const courier = await Courier.getById(id);
      if (!courier) {
        return res.status(404).json({
          code: 404,
          message: '快递类型不存在'
        });
      }
      
      // 切换状态
      const toggled = await Courier.toggleActive(id);
      
      if (!toggled) {
        return res.status(500).json({
          code: 500,
          message: '更新状态失败'
        });
      }
      
      // 获取更新后的状态
      const updatedCourier = await Courier.getById(id);
      
      res.status(200).json({
        code: 0,
        message: '状态已更新',
        data: {
          id: updatedCourier.id,
          is_active: updatedCourier.is_active
        }
      });
    } catch (error) {
      console.error('更新快递类型状态失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新状态失败'
      });
    }
  }

  /**
   * 重新排序快递类型
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
      const updated = await Courier.updateSort(items);
      
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
      console.error('更新快递类型排序失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新排序失败'
      });
    }
  }

  /**
   * 获取快递类型层级结构(包括母子类型关系)
   */
  async getTypeHierarchy(req, res) {
    try {
      const typeHierarchy = await Courier.getTypeHierarchy();
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: typeHierarchy
      });
    } catch (error) {
      console.error('获取快递类型层级结构失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取快递类型层级结构失败'
      });
    }
  }

  /**
   * 获取特定母类型的所有子类型
   */
  async getChildTypes(req, res) {
    try {
      const parentId = parseInt(req.params.parentId);
      
      // 验证母类型是否存在
      const parentType = await Courier.getById(parentId);
      if (!parentType) {
        return res.status(404).json({
          code: 404,
          message: '母类型不存在'
        });
      }
      
      // 验证是否为母类型(parent_id为null)
      if (parentType.parent_id !== null) {
        return res.status(400).json({
          code: 400,
          message: '指定的类型不是母类型'
        });
      }
      
      const childTypes = await Courier.getChildren(parentId);
      const totalCount = await Courier.getChildrenSum(parentId);
      
      res.status(200).json({
        code: 0,
        message: '获取成功',
        data: {
          parentType,
          childTypes,
          totalCount
        }
      });
    } catch (error) {
      console.error('获取子类型列表失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取子类型列表失败'
      });
    }
  }
}

module.exports = {
  CourierController: new CourierController(),
  validateCourier
}; 