const ShippingRecord = require('../models/ShippingRecord');
const Courier = require('../models/Courier');
const { body, validationResult } = require('express-validator');
const dateUtils = require('../utils/dateUtils');

/**
 * 验证发货记录数据
 */
const validateShippingRecord = [
  body('date').notEmpty().withMessage('日期不能为空')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('日期格式不正确，应为YYYY-MM-DD'),
  body('courier_id').notEmpty().withMessage('快递公司ID不能为空')
    .isInt().withMessage('快递公司ID必须是整数'),
  body('quantity').notEmpty().withMessage('数量不能为空')
    .isInt({ min: 0, max: 10000 }).withMessage('数量必须是0-10000之间的整数'),
  body('notes').optional().isLength({ max: 500 }).withMessage('备注长度不能超过500个字符')
];

/**
 * 验证批量添加发货记录数据
 */
const validateBatchShippingRecords = [
  body('date').notEmpty().withMessage('日期不能为空')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('日期格式不正确，应为YYYY-MM-DD'),
  body('records').isArray({ min: 1 }).withMessage('至少需要一条记录'),
  body('records.*.courier_id').notEmpty().withMessage('快递公司ID不能为空')
    .isInt().withMessage('快递公司ID必须是整数'),
  body('records.*.quantity').notEmpty().withMessage('数量不能为空')
    .isInt({ min: 0, max: 10000 }).withMessage('数量必须是0-10000之间的整数'),
  body('records.*.notes').optional().isLength({ max: 500 }).withMessage('备注长度不能超过500个字符')
];

class ShippingController {
  /**
   * 获取发货记录列表
   */
  async getAll(req, res) {
    try {
      // 获取请求参数并解析
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 10;
      const sortBy = req.query.sortBy || 'date';
      const sortOrder = req.query.sortOrder || 'DESC';
      const date = req.query.date || null;
      const dateFrom = req.query.date_from || null;
      const dateTo = req.query.date_to || null;
      const courierId = req.query.courier_id ? parseInt(req.query.courier_id) : null;
      const minQuantity = req.query.min_quantity ? parseInt(req.query.min_quantity) : null;
      const maxQuantity = req.query.max_quantity ? parseInt(req.query.max_quantity) : null;
      const notesSearch = req.query.notes_search || null;
      
      // 新增时间筛选参数
      const week = req.query.week ? parseInt(req.query.week) : null;
      const month = req.query.month ? parseInt(req.query.month) : null;
      const quarter = req.query.quarter ? parseInt(req.query.quarter) : null;
      const year = req.query.year ? parseInt(req.query.year) : null;
      
      console.log('接收到查询请求:', { 
        url: req.originalUrl,
        date
      });
      
      // 获取多个快递公司ID筛选
      let courierIds = null;
      if (req.query.courier_ids) {
        courierIds = req.query.courier_ids.split(',').map(id => parseInt(id));
      }
      
      // 处理按年、月、季度、周筛选，转换为date_from和date_to
      let calculatedDateFrom = null;
      let calculatedDateTo = null;
      
      // 使用dateUtils工具函数获取日期范围
      const currentYear = new Date().getFullYear();
      
      // 根据参数组合确定日期范围
      if (year) {
        if (month) {
          // 年+月
          const dateRange = dateUtils.getMonthDateRange(year, month);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        } else if (quarter) {
          // 年+季度
          const dateRange = dateUtils.getQuarterDateRange(year, quarter);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        } else if (week) {
          // 年+周
          const dateRange = dateUtils.getWeekDateRange(year, week);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        } else {
          // 仅年份
          const dateRange = dateUtils.getYearDateRange(year);
          calculatedDateFrom = dateRange.start;
          calculatedDateTo = dateRange.end;
        }
      } else if (month) {
        // 仅月份，使用当前年
        const dateRange = dateUtils.getMonthDateRange(currentYear, month);
        calculatedDateFrom = dateRange.start;
        calculatedDateTo = dateRange.end;
      } else if (quarter) {
        // 仅季度，使用当前年
        const dateRange = dateUtils.getQuarterDateRange(currentYear, quarter);
        calculatedDateFrom = dateRange.start;
        calculatedDateTo = dateRange.end;
      } else if (week) {
        // 仅周数，使用当前年
        const dateRange = dateUtils.getWeekDateRange(currentYear, week);
        calculatedDateFrom = dateRange.start;
        calculatedDateTo = dateRange.end;
      }
      
      // 原有日期筛选优先级高于计算的日期范围
      const finalDateFrom = dateFrom || calculatedDateFrom;
      const finalDateTo = dateTo || calculatedDateTo;
      
      const options = {
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        date,
        date_from: finalDateFrom,
        date_to: finalDateTo,
        courier_id: courierId,
        min_quantity: minQuantity,
        max_quantity: maxQuantity,
        notes_search: notesSearch
      };
      
      // 添加多个快递公司ID筛选
      if (courierIds && courierIds.length > 0) {
        options.courier_ids = courierIds;
      }
      
console.log("SQL查询选项:", JSON.stringify(options));
      // 获取记录总数
      const totalRecords = await ShippingRecord.count(options);
      
      // 获取分页记录
      const records = await ShippingRecord.getAll(options);
      
      // 计算分页信息
      const lastPage = Math.ceil(totalRecords / perPage);
      
      res.status(200).json({
        success: true,
        data: {
          records,
          pagination: {
            total: totalRecords,
            perPage,
            currentPage: page,
            lastPage
          }
        }
      });
    } catch (error) {
      console.error('获取发货记录列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取发货记录列表失败'
      });
    }
  }

  /**
   * 获取单个发货记录
   */
  async getById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const record = await ShippingRecord.getById(id);
      
      if (!record) {
        return res.status(404).json({
          success: false,
          message: '发货记录不存在'
        });
      }
      
      res.status(200).json({
        success: true,
        data: record
      });
    } catch (error) {
      console.error('获取发货记录详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取发货记录详情失败'
      });
    }
  }

  /**
   * 创建发货记录
   */
  async create(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().reduce((acc, err) => {
            acc[err.path] = err.msg;
            return acc;
          }, {})
        });
      }
      
      // 验证日期格式
      if (!dateUtils.isValidDateString(req.body.date)) {
        return res.status(400).json({
          success: false,
          errors: {
            date: '日期格式不正确或无效，应为YYYY-MM-DD'
          }
        });
      }
      
      // 验证日期范围
      const currentDate = dateUtils.getCurrentDateString();
      const tomorrowDate = dateUtils.getOffsetDateString(1);
      const monthAgoDate = dateUtils.getOffsetDateString(-30);
      
      if (dateUtils.compareDateStrings(req.body.date, tomorrowDate) > 0) {
        return res.status(400).json({
          success: false,
          errors: {
            date: '日期不能超过当前日期后一天'
          }
        });
      } else if (dateUtils.compareDateStrings(req.body.date, monthAgoDate) < 0) {
        return res.status(400).json({
          success: false,
          errors: {
            date: '日期不能早于一个月前'
          }
        });
      }
      
      // 验证快递公司是否存在且处于活跃状态
      const courier = await Courier.getById(req.body.courier_id);
      if (!courier) {
        return res.status(400).json({
          success: false,
          errors: {
            courier_id: `ID为${req.body.courier_id}的快递公司不存在`
          }
        });
      } else if (!courier.is_active) {
        return res.status(400).json({
          success: false,
          errors: {
            courier_id: `ID为${req.body.courier_id}的快递公司已停用`
          }
        });
      }
      
      // 创建发货记录
      const id = await ShippingRecord.add(req.body);
      
      if (!id) {
        return res.status(500).json({
          success: false,
          message: '发货记录创建失败'
        });
      }
      
      // 获取新创建的记录
      const newRecord = await ShippingRecord.getById(id);
      
      res.status(201).json({
        success: true,
        data: newRecord,
        message: '发货记录添加成功'
      });
    } catch (error) {
      console.error('创建发货记录失败:', error);
      res.status(500).json({
        success: false,
        message: '创建发货记录失败'
      });
    }
  }

  /**
   * 更新发货记录
   */
  async update(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().reduce((acc, err) => {
            acc[err.path] = err.msg;
            return acc;
          }, {})
        });
      }
      
      // 检查记录是否存在
      const record = await ShippingRecord.getById(id);
      if (!record) {
        return res.status(404).json({
          success: false,
          message: '发货记录不存在'
        });
      }
      
      // 如果更新日期，验证日期格式和范围
      if (req.body.date) {
        if (!dateUtils.isValidDateString(req.body.date)) {
          return res.status(400).json({
            success: false,
            errors: {
              date: '日期格式不正确或无效，应为YYYY-MM-DD'
            }
          });
        }
        
        // 验证日期范围
        const currentDate = dateUtils.getCurrentDateString();
        const tomorrowDate = dateUtils.getOffsetDateString(1);
        const monthAgoDate = dateUtils.getOffsetDateString(-30);
        
        if (dateUtils.compareDateStrings(req.body.date, tomorrowDate) > 0) {
          return res.status(400).json({
            success: false,
            errors: {
              date: '日期不能超过当前日期后一天'
            }
          });
        } else if (dateUtils.compareDateStrings(req.body.date, monthAgoDate) < 0) {
          return res.status(400).json({
            success: false,
            errors: {
              date: '日期不能早于一个月前'
            }
          });
        }
      }
      
      // 如果更新快递公司，验证快递公司是否存在且处于活跃状态
      if (req.body.courier_id) {
        const courier = await Courier.getById(req.body.courier_id);
        if (!courier) {
          return res.status(400).json({
            success: false,
            errors: {
              courier_id: `ID为${req.body.courier_id}的快递公司不存在`
            }
          });
        } else if (!courier.is_active) {
          return res.status(400).json({
            success: false,
            errors: {
              courier_id: `ID为${req.body.courier_id}的快递公司已停用`
            }
          });
        }
      }
      
      // 更新记录
      const updated = await ShippingRecord.update(id, req.body);
      
      if (!updated) {
        return res.status(500).json({
          success: false,
          message: '发货记录更新失败'
        });
      }
      
      // 获取更新后的记录
      const updatedRecord = await ShippingRecord.getById(id);
      
      res.status(200).json({
        success: true,
        data: updatedRecord,
        message: '发货记录更新成功'
      });
    } catch (error) {
      console.error('更新发货记录失败:', error);
      res.status(500).json({
        success: false,
        message: '更新发货记录失败'
      });
    }
  }

  /**
   * 删除发货记录
   */
  async delete(req, res) {
    try {
      const id = parseInt(req.params.id);
      
      // 检查记录是否存在
      const record = await ShippingRecord.getById(id);
      if (!record) {
        return res.status(404).json({
          success: false,
          message: '发货记录不存在'
        });
      }
      
      // 删除记录
      const deleted = await ShippingRecord.delete(id);
      
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: '发货记录删除失败'
        });
      }
      
      res.status(200).json({
        success: true,
        message: '发货记录已删除'
      });
    } catch (error) {
      console.error('删除发货记录失败:', error);
      res.status(500).json({
        success: false,
        message: '删除发货记录失败'
      });
    }
  }

  /**
   * 批量添加发货记录
   */
  async batchCreate(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().reduce((acc, err) => {
            acc[err.path] = err.msg;
            return acc;
          }, {})
        });
      }
      
      // 验证日期格式
      if (!dateUtils.isValidDateString(req.body.date)) {
        return res.status(400).json({
          success: false,
          errors: {
            date: '日期格式不正确或无效，应为YYYY-MM-DD'
          }
        });
      }
      
      // 验证日期范围
      const currentDate = dateUtils.getCurrentDateString();
      const tomorrowDate = dateUtils.getOffsetDateString(1);
      const monthAgoDate = dateUtils.getOffsetDateString(-30);
      
      if (dateUtils.compareDateStrings(req.body.date, tomorrowDate) > 0) {
        return res.status(400).json({
          success: false,
          errors: {
            date: '日期不能超过当前日期后一天'
          }
        });
      } else if (dateUtils.compareDateStrings(req.body.date, monthAgoDate) < 0) {
        return res.status(400).json({
          success: false,
          errors: {
            date: '日期不能早于一个月前'
          }
        });
      }
      
      // 验证每条记录的快递公司是否存在且处于活跃状态
      for (let i = 0; i < req.body.records.length; i++) {
        const record = req.body.records[i];
        const courier = await Courier.getById(record.courier_id);
        
        if (!courier) {
          return res.status(400).json({
            success: false,
            errors: {
              [`records.${i}.courier_id`]: `ID为${record.courier_id}的快递公司不存在`
            }
          });
        } else if (!courier.is_active) {
          return res.status(400).json({
            success: false,
            errors: {
              [`records.${i}.courier_id`]: `ID为${record.courier_id}的快递公司已停用`
            }
          });
        }
      }
      
      // 执行批量添加
      const result = await ShippingRecord.batchAdd(req.body.date, req.body.records);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }
      
      res.status(201).json({
        success: true,
        data: {
          created: result.created,
          records: result.records
        },
        message: `成功添加${result.created}条发货记录`
      });
    } catch (error) {
      console.error('批量添加发货记录失败:', error);
      res.status(500).json({
        success: false,
        message: '批量添加发货记录失败'
      });
    }
  }
}

module.exports = {
  ShippingController: new ShippingController(),
  validateShippingRecord,
  validateBatchShippingRecords
}; 