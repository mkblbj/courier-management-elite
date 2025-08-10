const { fetchShopsOverview } = require('../services/mercari.service');

class MercariControllerClass {
  /**
   * GET /api/mercari/shops-overview (Mock)
   * 返回硬编码的店铺概览列表，字段与后续真实实现保持同构
   */
  async getShopsOverview(req, res) {
    try {
      const data = await fetchShopsOverview();
      return res.status(200).json({ code: 0, message: '获取成功', data });
    } catch (error) {
      console.error('获取 Mercari 店铺概览失败:', error);
      return res.status(500).json({
        code: 500,
        message: '获取 Mercari 店铺概览失败',
      });
    }
  }
}

const MercariController = new MercariControllerClass();

module.exports = {
  MercariController,
};


