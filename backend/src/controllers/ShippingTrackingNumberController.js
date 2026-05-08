const { body, validationResult } = require('express-validator');
const ShippingTrackingNumber = require('../models/ShippingTrackingNumber');
const Courier = require('../models/Courier');
const dateUtils = require('../utils/dateUtils');

const validateCreateTrackingNumber = [
  body('tracking_number')
    .notEmpty().withMessage('运单号不能为空')
    .isLength({ min: 6, max: 50 }).withMessage('运单号长度必须在6-50个字符之间')
    .matches(/^[A-Za-z0-9]+$/).withMessage('运单号只能包含字母和数字'),
  body('raw_input')
    .notEmpty().withMessage('原始扫码内容不能为空')
    .isLength({ min: 1, max: 100 }).withMessage('原始扫码内容不能超过100个字符'),
  body('courier_id')
    .notEmpty().withMessage('快递类型不能为空')
    .isInt().withMessage('快递类型ID必须是整数'),
  body('scan_date')
    .notEmpty().withMessage('扫描日期不能为空')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('扫描日期格式不正确，应为YYYY-MM-DD'),
  body('batch_id')
    .notEmpty().withMessage('批次ID不能为空')
    .isLength({ min: 1, max: 36 }).withMessage('批次ID不能超过36个字符'),
  body('notes')
    .optional({ nullable: true })
    .isLength({ max: 500 }).withMessage('备注长度不能超过500个字符')
];

const validateUpdateTrackingNumber = [
  body('tracking_number')
    .optional()
    .isLength({ min: 6, max: 50 }).withMessage('运单号长度必须在6-50个字符之间')
    .matches(/^[A-Za-z0-9]+$/).withMessage('运单号只能包含字母和数字'),
  body('courier_id')
    .optional()
    .isInt().withMessage('快递类型ID必须是整数'),
  body('notes')
    .optional({ nullable: true })
    .isLength({ max: 500 }).withMessage('备注长度不能超过500个字符')
];

class ShippingTrackingNumberController {
  formatValidationErrors(req, res) {
    const errors = validationResult(req);
    if (errors.isEmpty()) return false;

    res.status(400).json({
      success: false,
      errors: errors.array().reduce((acc, err) => {
        acc[err.path || err.type] = err.msg;
        return acc;
      }, {})
    });
    return true;
  }

  async create(req, res) {
    try {
      if (this.formatValidationErrors(req, res)) return;

      if (!dateUtils.isValidDateString(req.body.scan_date)) {
        return res.status(400).json({
          success: false,
          errors: { scan_date: '扫描日期格式不正确或无效，应为YYYY-MM-DD' }
        });
      }

      const courier = await Courier.getById(req.body.courier_id);
      if (!courier) {
        return res.status(400).json({
          success: false,
          errors: { courier_id: '快递类型不存在' }
        });
      }

      if (!Boolean(courier.is_active)) {
        return res.status(400).json({
          success: false,
          errors: { courier_id: '快递类型已停用' }
        });
      }

      const result = await ShippingTrackingNumber.add(req.body);

      if (result.duplicate) {
        return res.status(409).json({
          success: false,
          duplicate: true,
          message: '该运单号今天已扫描',
          data: result.existing
        });
      }

      return res.status(201).json({
        success: true,
        data: result,
        message: '扫描记录已保存'
      });
    } catch (error) {
      console.error('创建扫码计数记录失败:', error);
      return res.status(500).json({
        success: false,
        message: '创建扫码计数记录失败'
      });
    }
  }

  async getAll(req, res) {
    try {
      const records = await ShippingTrackingNumber.getAll({
        date: req.query.date,
        courier_id: req.query.courier_id,
        batch_id: req.query.batch_id
      });

      return res.status(200).json({
        success: true,
        data: { records }
      });
    } catch (error) {
      console.error('获取扫码计数记录失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取扫码计数记录失败'
      });
    }
  }

  async getStats(req, res) {
    try {
      const date = req.query.date || dateUtils.getCurrentDateString();
      const stats = await ShippingTrackingNumber.getStatsByDate(date);

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取扫码计数统计失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取扫码计数统计失败'
      });
    }
  }

  async update(req, res) {
    try {
      if (this.formatValidationErrors(req, res)) return;

      const id = parseInt(req.params.id, 10);
      const existing = await ShippingTrackingNumber.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: '扫码计数记录不存在' });
      }

      const updated = await ShippingTrackingNumber.update(id, req.body);
      return res.status(200).json({
        success: true,
        data: updated,
        message: '扫码计数记录已更新'
      });
    } catch (error) {
      console.error('更新扫码计数记录失败:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          duplicate: true,
          message: '该运单号今天已扫描'
        });
      }
      return res.status(500).json({ success: false, message: '更新扫码计数记录失败' });
    }
  }

  async delete(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const deleted = await ShippingTrackingNumber.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: '扫码计数记录不存在' });
      }

      return res.status(200).json({ success: true, message: '扫码计数记录已删除' });
    } catch (error) {
      console.error('删除扫码计数记录失败:', error);
      return res.status(500).json({ success: false, message: '删除扫码计数记录失败' });
    }
  }

  async deleteBatch(req, res) {
    try {
      const deleted = await ShippingTrackingNumber.deleteBatch(req.params.batchId);
      return res.status(200).json({
        success: true,
        data: { deleted },
        message: `已撤销${deleted}条扫码记录`
      });
    } catch (error) {
      console.error('撤销扫码计数批次失败:', error);
      return res.status(500).json({ success: false, message: '撤销扫码计数批次失败' });
    }
  }
}

module.exports = {
  ShippingTrackingNumberController: new ShippingTrackingNumberController(),
  validateCreateTrackingNumber,
  validateUpdateTrackingNumber
};
